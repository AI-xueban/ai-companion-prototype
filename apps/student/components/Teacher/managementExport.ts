export const EXPORT_LIMIT = 10_000;
export const EXPORT_SHEET_SIZE = 10_000;
export type ExportSheet = { name: string; headers: string[]; rows: (string | number)[][] };
const encoder = new TextEncoder();
const xmlText = (value: string | number) => String(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const columnName = (index: number) => {
  let name = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) name = String.fromCharCode(65 + (value - 1) % 26) + name;
  return name;
};
const crcTable = Array.from({ length: 256 }, (_, i) => {
  let value = i;
  for (let j = 0; j < 8; j++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});
const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
// Standard OOXML ZIP, compressed locally with the browser's native stream API.
async function zip(files: { name: string; data: Uint8Array }[], isCancelled: () => boolean): Promise<Blob> {
  const parts: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    if (isCancelled()) throw new Error('已取消下载');
    const stream = new Blob([file.data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    const data = compressed.length < file.data.length ? compressed : file.data;
    const method = data === compressed ? 8 : 0;
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const header = new Uint8Array(30 + name.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true);
    view.setUint16(8, method, true); view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, file.data.length, true); view.setUint16(26, name.length, true);
    header.set(name, 30); parts.push(header, data);
    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0x800, true);
    centralView.setUint16(10, method, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, file.data.length, true); centralView.setUint16(28, name.length, true); centralView.setUint32(42, offset, true);
    central.set(name, 46); directory.push(central); offset += header.length + data.length;
  }
  const directorySize = directory.reduce((total, item) => total + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true); endView.setUint32(12, directorySize, true); endView.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function createZipArchive(files: { name: string; data: Uint8Array }[], isCancelled: () => boolean): Promise<Blob> {
  const archive = await zip(files, isCancelled);
  return new Blob([archive], { type: 'application/zip' });
}

export async function createManagementWorkbook(source: ExportSheet[], progress: (percent: number) => void, isCancelled: () => boolean): Promise<Blob> {
  const total = source.reduce((count, sheet) => count + sheet.rows.length, 0);
  if (total > EXPORT_LIMIT) throw new Error('超过单次 1 万条上限，请缩小筛选范围后下载');
  if (!source[0]?.rows.length) throw new Error('没有可下载的数据');
  const sheets = source.flatMap((sheet) => {
    if (!sheet.rows.length) return [{ ...sheet }];
    return Array.from({ length: Math.ceil(sheet.rows.length / EXPORT_SHEET_SIZE) }, (_, i) => ({ ...sheet, name: sheet.rows.length > EXPORT_SHEET_SIZE ? `${sheet.name}${i + 1}` : sheet.name, rows: sheet.rows.slice(i * EXPORT_SHEET_SIZE, (i + 1) * EXPORT_SHEET_SIZE) }));
  });
  const files: { name: string; data: Uint8Array }[] = [];
  const add = (name: string, text: string) => files.push({ name, data: encoder.encode(text) });
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const namespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  let completed = 0;
  const makeRow = (values: (string | number)[], row: number, header = false) => `<row r="${row}">${values.map((value, column) => typeof value === 'number' && Number.isFinite(value) ? `<c r="${columnName(column)}${row}" s="${header ? 1 : 0}"><v>${value}</v></c>` : `<c r="${columnName(column)}${row}" t="inlineStr" s="${header ? 1 : 0}"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`).join('')}</row>`;
  for (const [index, sheet] of sheets.entries()) {
    const rows = [makeRow(sheet.headers, 1, true)];
    for (let start = 0; start < sheet.rows.length; start += 250) {
      if (isCancelled()) throw new Error('已取消下载');
      const batch = sheet.rows.slice(start, start + 250);
      rows.push(...batch.map((row, i) => makeRow(row, start + i + 2)));
      completed += batch.length; progress(Math.round(completed / total * 90));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const range = `A1:${columnName(sheet.headers.length - 1)}${sheet.rows.length + 1}`;
    add(`xl/worksheets/sheet${index + 1}.xml`, `${declaration}<worksheet xmlns="${namespace}"><dimension ref="${range}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${sheet.headers.length}" width="23" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData><autoFilter ref="${range}"/></worksheet>`);
  }
  if (isCancelled()) throw new Error('已取消下载');
  add('[Content_Types].xml', `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  add('_rels/.rels', `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add('xl/workbook.xml', `${declaration}<workbook xmlns="${namespace}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, i) => `<sheet name="${xmlText(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`);
  add('xl/_rels/workbook.xml.rels', `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  add('xl/styles.xml', `${declaration}<styleSheet xmlns="${namespace}"><fonts count="2"><font><sz val="11"/><name val="微软雅黑"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="微软雅黑"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  progress(95);
  await new Promise((resolve) => setTimeout(resolve, 0));
  if (isCancelled()) throw new Error('已取消下载');
  const blob = await zip(files, isCancelled);
  progress(100);
  return blob;
}
