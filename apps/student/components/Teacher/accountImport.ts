import { TEACHER_ROLE_OPTIONS, TEACHER_SUBJECT_OPTIONS } from './data/teacherAccess';

export type ImportKind = 'teachers' | 'students' | 'classes';
export type ImportPerson = { name: string; account: string; className: string; subject?: string; role?: string; staffNumber?: string; homeroomClassName?: string; grade?: number; sort?: number; note?: string };
export type ImportRow = { row: number; values: string[]; errors: string[]; person: ImportPerson };
export const IMPORT_HEADERS = {
  teachers: ['登录手机号', '教师姓名', '教师工号', '任教学科', '教师角色', '任教班级', '班主任班级'],
  students: ['学生姓名', '所属班级'],
  classes: ['年级', '班级名称', '排序', '备注'],
};
export const importSheetName = (kind: ImportKind) => kind === 'teachers' ? '教师名单' : kind === 'students' ? '学生名单' : '班级名单';

// Read the named data sheet only; examples and instructions are never imported.
export async function readAccountWorkbook(file: File, kind: ImportKind): Promise<{ row: number; values: string[] }[]> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('请上传 .xlsx 格式的 Excel 文件');
  if (file.size > 5 * 1024 * 1024) throw new Error('文件不能超过 5 MB，请拆分后上传');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw new Error('文件无法读取，请使用模板另存为 .xlsx 后重试');
  const entries = new Map<string, { offset: number; size: number; length: number; method: number }>();
  let cursor = view.getUint32(end + 16, true);
  for (let i = 0; i < view.getUint16(end + 10, true); i++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Excel 文件已损坏');
    const nameLength = view.getUint16(cursor + 28, true);
    const name = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    if (view.getUint16(cursor + 8, true) & 1) throw new Error('请取消文件加密后重新上传');
    entries.set(name, { offset: view.getUint32(cursor + 42, true), size: view.getUint32(cursor + 20, true), length: view.getUint32(cursor + 24, true), method: view.getUint16(cursor + 10, true) });
    cursor += 46 + nameLength + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
  }
  const xml = async (path: string) => {
    const entry = entries.get(path);
    if (!entry || entry.length > 25 * 1024 * 1024) throw new Error('文件结构不符合模板，请重新下载模板填写');
    const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
    const compressed = bytes.slice(start, start + entry.size);
    let content: Uint8Array;
    if (entry.method === 0) content = compressed;
    else if (entry.method === 8) {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      content = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error('不支持该文件压缩格式，请另存为 .xlsx');
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(content), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Excel 文件内容已损坏');
    return doc;
  };
  const elements = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS('*', tag));
  const workbook = await xml('xl/workbook.xml');
  const sheet = elements(workbook, 'sheet').find((item) => item.getAttribute('name') === importSheetName(kind));
  if (!sheet) throw new Error(`找不到“${importSheetName(kind)}”工作表，请使用对应的导入模板`);
  const rels = await xml('xl/_rels/workbook.xml.rels');
  const id = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  const target = elements(rels, 'Relationship').find((item) => item.getAttribute('Id') === id)?.getAttribute('Target');
  if (!target) throw new Error('找不到名单工作表');
  const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`.split('/').reduce<string[]>((parts, part) => { if (part === '..') parts.pop(); else if (part !== '.') parts.push(part); return parts; }, []).join('/');
  const strings = entries.has('xl/sharedStrings.xml') ? elements(await xml('xl/sharedStrings.xml'), 'si').map((item) => elements(item, 't').map((t) => t.textContent ?? '').join('')) : [];
  const document = await xml(path);
  const rows = elements(document, 'row').map((row) => {
    const values: string[] = [];
    for (const cell of elements(row, 'c')) {
      const letters = cell.getAttribute('r')?.match(/^[A-Z]+/)?.[0] ?? '';
      const column = [...letters].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1;
      if (column < 0 || column > 50) continue;
      if (elements(cell, 'f').length || cell.getAttribute('t') === 'e') throw new Error(`第${row.getAttribute('r')}行含公式或错误值，请改为直接填写的文本`);
      const raw = elements(cell, 'v')[0]?.textContent ?? '';
      values[column] = (cell.getAttribute('t') === 's' ? strings[Number(raw)] ?? '' : cell.getAttribute('t') === 'inlineStr' ? elements(cell, 't').map((t) => t.textContent ?? '').join('') : raw).trim();
    }
    return { row: Number(row.getAttribute('r')), values };
  }).filter((row) => row.values.some(Boolean));
  const headers = IMPORT_HEADERS[kind];
  if (!rows.length || headers.some((header, i) => rows[0].values[i] !== header) || rows[0].values.slice(headers.length).some(Boolean)) throw new Error('表头与模板不一致，请保留模板第一行的名称和顺序');
  if (rows.length === 1) throw new Error('名单为空，请从第 2 行开始填写后上传');
  if (rows.length > 5001) throw new Error('每次最多导入 5000 条记录，请拆分文件');
  return rows.slice(1);
}

const splitList = (value: string) => [...new Set(value.split(/[、,，;/；\n]+/).map((v) => v.trim()).filter(Boolean))];
export function validateAccountRows(raw: { row: number; values: string[] }[], kind: ImportKind, classes: { name: string }[], existing: ImportPerson[]): ImportRow[] {
  if (kind === 'students') return raw.map(({ row, values }) => {
    const [name = '', className = ''] = values;
    const errors: string[] = [];
    if (!name) errors.push('学生姓名必填');
    if (!className) errors.push('所属班级必填');
    else if (splitList(className).length > 1) errors.push('学生只能填写一个所属班级');
    else if (!classes.some((item) => item.name === className)) errors.push(`所属班级不存在：${className}`);
    if (values.slice(2).some(Boolean)) errors.push('存在模板之外的额外字段');
    return { row, values, errors, person: { name, className, account: '' } };
  });
  if (kind === 'classes') {
    const names = new Map<string, number[]>();
    for (const row of raw) { const name = row.values[1] ?? ''; names.set(name, [...(names.get(name) ?? []), row.row]); }
    return raw.map(({ row, values }) => {
      const [grade = '', name = '', sort = '', note = ''] = values;
      const errors: string[] = [];
      if (!/^[1-9]$/.test(grade)) errors.push('年级必填，填写1至9的数字');
      if (!name) errors.push('班级名称必填');
      else if (/^[1-9]$/.test(grade) && !name.startsWith(`${'一二三四五六七八九'[Number(grade) - 1]}年级`)) errors.push('班级名称须以所填年级开头，如七年级(3)班');
      if (name && classes.some((item) => item.name === name)) errors.push('班级已存在，请在列表中编辑');
      if (name && (names.get(name)?.length ?? 0) > 1) errors.push(`文件内班级重复（第${names.get(name)!.join('、')}行）`);
      if (sort && (!/^\d+$/.test(sort) || !Number.isSafeInteger(Number(sort)) || Number(sort) < 1)) errors.push('排序须为大于0的整数，可留空');
      if (values.slice(4).some(Boolean)) errors.push('存在模板之外的额外字段');
      return { row, values, errors, person: { account: name, name, className: name, grade: Number(grade), sort: sort ? Number(sort) : undefined, note } };
    });
  }
  const counts = new Map<string, number[]>();
  for (const row of raw) { const key = row.values[0] ?? ''; counts.set(key, [...(counts.get(key) ?? []), row.row]); }
  const owners = new Map<string, string[]>();
  for (const teacher of existing) for (const name of splitList(teacher.homeroomClassName ?? '')) owners.set(name, [...(owners.get(name) ?? []), `现有教师${teacher.name}`]);
  if (kind === 'teachers') for (const row of raw) if (row.values[4] === '班主任') for (const name of splitList(row.values[6] ?? '').filter((v) => v !== '未分配')) owners.set(name, [...(owners.get(name) ?? []), `文件第${row.row}行`]);
  return raw.map(({ row, values }) => {
    const [account = '', name = ''] = values;
    const errors: string[] = [];
    if (!account) errors.push('登录手机号必填');
    else if (!/^1[3-9]\d{9}$/.test(account)) errors.push('登录手机号须为有效的11位手机号');
    if (!name) errors.push('姓名必填');
    if (account && existing.some((person) => person.account === account)) errors.push('账号已存在，请在列表中编辑');
    if (account && (counts.get(account)?.length ?? 0) > 1) errors.push(`文件内账号重复（第${counts.get(account)!.join('、')}行）`);
    if (values.slice(IMPORT_HEADERS[kind].length).some(Boolean)) errors.push('存在模板之外的额外字段');
    const checkClasses = (text: string, label: string, allowUnassigned: boolean) => {
      const list = splitList(text);
      if (!list.length && !allowUnassigned) errors.push(`${label}必填`);
      if (list.includes('未分配') && (!allowUnassigned || list.length > 1)) errors.push(`${label}“未分配”不能与班级同时填写`);
      for (const item of list) if (item !== '未分配' && !classes.some((c) => c.name === item)) errors.push(`${label}不存在：${item}`);
      return list.join('、') || '未分配';
    };
    let person: ImportPerson;
    if (kind === 'teachers') {
      const [,, staffNumber = '', subject = '', role = '', teaching = '', homeroom = ''] = values;
      const subjects = splitList(subject).map((item) => item === '道法' ? '道德与法治' : item);
      if (!subjects.length) errors.push('任教学科必填');
      for (const item of subjects) if (!TEACHER_SUBJECT_OPTIONS.includes(item)) errors.push(`任教学科不支持：${item}`);
      if (!TEACHER_ROLE_OPTIONS.includes(role)) errors.push('教师角色须为教师、班主任或学校管理员');
      const className = checkClasses(teaching, '任教班级', true);
      const homeroomClassName = checkClasses(homeroom, '班主任班级', true);
      if (role !== '班主任' && homeroomClassName !== '未分配') errors.push('仅班主任角色可填写班主任班级');
      for (const item of splitList(homeroomClassName).filter((v) => v !== '未分配')) if ((owners.get(item)?.length ?? 0) > 1) errors.push(`${item}班主任冲突：${owners.get(item)!.join('、')}`);
      person = { account, name, staffNumber, subject: [...new Set(subjects)].join('、'), role, className, homeroomClassName };
    }
    return { row, values, errors, person };
  });
}
