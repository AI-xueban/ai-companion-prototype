import { createZipArchive } from './managementExport';

export type GuardianStudent = { name: string; account: string; className: string; guardianToken?: string };
export type GuardianBatch = { id: string; accounts: string[]; createdAt: string; method: '手动新增' | '批量导入'; operator: string };

// Prototype tokens are opaque and independent of student numbers. A real release must issue and validate them on the server.
export const createGuardianToken = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join('');
export const guardianPayload = (token: string) => `TWJ:${token}`;

const multiply = (x: number, y: number) => {
  let result = 0;
  for (let i = 7; i >= 0; i--) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((y >>> i) & 1) * x;
  }
  return result;
};

// QR version 3, medium error correction, byte mode. The short demo payload fits its 42-byte capacity.
export function createGuardianQrMatrix(token: string): boolean[][] {
  const payload = new TextEncoder().encode(guardianPayload(token));
  if (payload.length > 42) throw new Error('二维码内容过长');
  const bits: number[] = [0, 1, 0, 0]; // byte mode
  for (let i = 7; i >= 0; i--) bits.push((payload.length >>> i) & 1);
  for (const byte of payload) for (let i = 7; i >= 0; i--) bits.push((byte >>> i) & 1);
  for (let i = 0; i < Math.min(4, 352 - bits.length); i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  let padding = 0;
  while (data.length < 44) data.push((padding++ % 2) === 0 ? 0xec : 0x11);

  const degree = 26;
  const divisor = Array<number>(degree).fill(0);
  divisor[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      divisor[j] = multiply(divisor[j], root);
      if (j + 1 < degree) divisor[j] ^= divisor[j + 1];
    }
    root = multiply(root, 2);
  }
  const remainder = Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder.shift()!;
    remainder.push(0);
    for (let j = 0; j < degree; j++) remainder[j] ^= multiply(divisor[j], factor);
  }
  const codewords = [...data, ...remainder];
  const size = 29;
  const cells = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const set = (x: number, y: number, value: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    cells[y][x] = value; reserved[y][x] = true;
  };
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      set(cx + dx, cy + dy, distance !== 2 && distance !== 4);
    }
  }
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    set(22 + dx, 22 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const drawFormat = () => {
    const dataBits = 0; // ECC M, mask 0
    let remainderBits = dataBits;
    for (let i = 0; i < 10; i++) remainderBits = (remainderBits << 1) ^ (((remainderBits >>> 9) & 1) * 0x537);
    const value = ((dataBits << 10) | remainderBits) ^ 0x5412;
    const bit = (i: number) => ((value >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat();
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      const y = ((right + 1) & 2) === 0 ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset++) {
        const x = right - offset;
        if (reserved[y][x]) continue;
        const bit = index < codewords.length * 8 ? ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) !== 0 : false;
        cells[y][x] = bit !== ((x + y) % 2 === 0); // mask 0
        index++;
      }
    }
  }
  if (index < codewords.length * 8) throw new Error('二维码容量不足');
  return cells;
}

export function guardianQrSvg(token: string): string {
  const cells = createGuardianQrMatrix(token);
  const blocks = cells.flatMap((row, y) => row.map((on, x) => on ? `<rect x="${x + 4}" y="${y + 4}" width="1" height="1"/>` : '')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37" shape-rendering="crispEdges"><rect width="37" height="37" fill="white"/><g fill="#0f172a">${blocks}</g></svg>`;
}

const safeName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '_').trim() || '未命名';
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
const download = (file: Blob, name: string) => {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

export async function makeGuardianCard(student: GuardianStudent, school: string): Promise<Blob> {
  if (!student.guardianToken) throw new Error(`${student.name}尚未生成绑定码`);
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 810;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器无法生成卡片');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, 640, 810);
  context.fillStyle = '#1d4ed8'; context.fillRect(0, 0, 640, 14);
  context.fillStyle = '#0f172a'; context.font = 'bold 31px sans-serif'; context.textAlign = 'center';
  context.fillText('家长绑定卡', 320, 75);
  context.font = '20px sans-serif'; context.fillStyle = '#475569'; context.fillText(school, 320, 111);
  context.font = 'bold 29px sans-serif'; context.fillStyle = '#0f172a'; context.fillText(student.name, 320, 158);
  context.font = '20px sans-serif'; context.fillStyle = '#475569'; context.fillText(student.className, 320, 190);
  const cells = createGuardianQrMatrix(student.guardianToken);
  const unit = 12;
  context.fillStyle = '#ffffff'; context.fillRect(98, 220, 444, 444);
  context.fillStyle = '#0f172a';
  cells.forEach((row, y) => row.forEach((on, x) => { if (on) context.fillRect(98 + (x + 4) * unit, 220 + (y + 4) * unit, unit, unit); }));
  context.fillStyle = '#334155'; context.font = '18px sans-serif'; context.fillText('请家长扫码核对孩子信息后完成绑定', 320, 708);
  context.fillStyle = '#64748b'; context.font = '15px sans-serif'; context.fillText('请由学校私下发给对应家庭 · 演示码不可用于真实绑定', 320, 747);
  context.font = '13px sans-serif'; context.fillText(`学号 ${student.account}`, 320, 779);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('卡片生成失败')), 'image/png'));
}

export async function downloadGuardianCard(student: GuardianStudent, school: string): Promise<void> {
  download(await makeGuardianCard(student, school), `${safeName(student.className)}-${safeName(student.name)}-${safeName(student.account)}-家长绑定卡.png`);
}

export async function downloadGuardianBundle(students: GuardianStudent[], school: string, label: string, onProgress: (count: number) => void, isCancelled: () => boolean): Promise<void> {
  if (!students.length) throw new Error('当前范围没有可下载的学生');
  const files: { name: string; data: Uint8Array }[] = [];
  const rows = ['班级,学生姓名,学号,卡片文件'];
  for (const [index, student] of students.entries()) {
    if (isCancelled()) throw new Error('已取消生成');
    const grade = student.className.match(/^(.+?年级)/)?.[1] ?? '其他年级';
    const path = `${safeName(grade)}/${safeName(student.className)}/${safeName(student.name)}-${safeName(student.account)}-家长绑定卡.png`;
    files.push({ name: path, data: new Uint8Array(await (await makeGuardianCard(student, school)).arrayBuffer()) });
    rows.push([student.className, student.name, student.account, path].map(csvCell).join(','));
    onProgress(index + 1);
    if (index % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  files.push({ name: '卡片索引.csv', data: new TextEncoder().encode(`\ufeff${rows.join('\r\n')}`) });
  const archive = await createZipArchive(files, isCancelled);
  if (isCancelled()) throw new Error('已取消生成');
  download(archive, `${safeName(school)}-${safeName(label)}-家长绑定码.zip`);
}
