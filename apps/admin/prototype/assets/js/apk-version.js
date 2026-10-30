/* Read APK manifest metadata locally; no package execution. */
async function cvReadApkVersion(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw Error('APK 文件结构无效');
  let offset = view.getUint32(end + 16, true);
  for (let i = 0; i < view.getUint16(end + 10, true); i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw Error('APK 文件目录无效');
    const method = view.getUint16(offset + 10, true);
    const size = view.getUint32(offset + 20, true);
    const unpacked = view.getUint32(offset + 24, true);
    const nameSize = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameSize));
    if (name === 'AndroidManifest.xml') {
      if (unpacked > 8 * 1024 * 1024 || size > 8 * 1024 * 1024) throw Error('APK 清单过大');
      const local = view.getUint32(offset + 42, true);
      if (view.getUint32(local, true) !== 0x04034b50) throw Error('APK 清单无效');
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      let xml = bytes.slice(start, start + size);
      if (method === 8) {
        const reader = new Blob([xml]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
        const chunks = []; let length = 0;
        while (true) {
          const {value, done} = await reader.read(); if (done) break;
          length += value.length;
          if (length > 8 * 1024 * 1024) { await reader.cancel(); throw Error('APK 清单过大'); }
          chunks.push(value);
        }
        xml = new Uint8Array(length); let p = 0;
        for (const chunk of chunks) { xml.set(chunk, p); p += chunk.length; }
      } else if (method !== 0) throw Error('不支持此 APK 压缩方式');
      if (xml.length !== unpacked) throw Error('APK 清单不完整');
      return cvParseApkManifest(xml);
    }
    offset += 46 + nameSize + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  throw Error('未找到 AndroidManifest.xml');
}
function cvParseApkManifest(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.getUint16(0, true) !== 3) throw Error('APK 清单格式无效');
  const strings = [];
  for (let p = v.getUint16(2, true); p < bytes.length;) {
    const type = v.getUint16(p, true), header = v.getUint16(p + 2, true), size = v.getUint32(p + 4, true);
    if (size < header || header < 8 || p + size > bytes.length) throw Error('APK 清单损坏');
    if (type === 1) {
      const count = v.getUint32(p + 8, true), utf8 = v.getUint32(p + 16, true) & 256;
      const start = p + v.getUint32(p + 20, true);
      if (count > size / 4) throw Error('APK 字符串表无效');
      for (let i = 0; i < count; i++) {
        let at = start + v.getUint32(p + header + i * 4, true);
        const len = () => {
          if (utf8) { const n = v.getUint8(at++); return n & 128 ? ((n & 127) << 8) | v.getUint8(at++) : n; }
          const n = v.getUint16(at, true); at += 2;
          if (!(n & 32768)) return n;
          const tail = v.getUint16(at, true); at += 2; return (n & 32767) * 65536 + tail;
        };
        let length = len(); if (utf8) length = len(); else length *= 2;
        if (at + length > p + size) throw Error('APK 字符串损坏');
        strings.push(new TextDecoder(utf8 ? 'utf-8' : 'utf-16le').decode(bytes.subarray(at, at + length)));
      }
    } else if (type === 0x0102 && strings[v.getUint32(p + 20, true)] === 'manifest') {
      let version = '', versionCode = '';
      const start = p + 16 + v.getUint16(p + 24, true), step = v.getUint16(p + 26, true), count = v.getUint16(p + 28, true);
      if (step < 20 || start + step * count > p + size) throw Error('APK 属性无效');
      for (let i = 0; i < count; i++) {
        const at = start + i * step, name = strings[v.getUint32(at + 4, true)];
        if (strings[v.getUint32(at, true)] !== 'http://schemas.android.com/apk/res/android') continue;
        const raw = v.getUint32(at + 8, true), kind = v.getUint8(at + 15), value = v.getUint32(at + 16, true);
        const text = raw !== 0xffffffff ? strings[raw] : kind === 3 ? strings[value] : kind === 16 || kind === 17 ? String(value) : '';
        if (name === 'versionName') version = text;
        if (name === 'versionCode') versionCode = text;
      }
      if (!version || !versionCode) throw Error('无法读取版本信息，请提供含明确版本号的 APK');
      return { version, versionCode };
    }
    p += size;
  }
  throw Error('无法读取 APK 版本号');
}
async function cvParseUpload(input) {
  const form = input.form, file = input.files[0];
  form.apkMetadata = null; form.apkFile = null;
  form.elements.version.value = '';
  const error = form.querySelector('#cv-error');
  error.textContent = '';
  if (!file) return;
  if (!/\.apk$/i.test(file.name) || !file.size || file.size > 500 * 1024 * 1024) { error.textContent = '请选择有效 APK 文件，大小不超过 500 MB'; return; }
  error.textContent = '正在解析版本号…';
  try {
    const metadata = await cvReadApkVersion(file);
    if (input.files[0] !== file) return;
    form.apkMetadata = metadata; form.apkFile = file;
    form.elements.version.value = metadata.version;
    error.textContent = '';
  } catch (e) {
    if (input.files[0] === file) error.textContent = '版本解析失败：' + (e instanceof RangeError ? 'APK 文件损坏' : e.message);
  }
}
