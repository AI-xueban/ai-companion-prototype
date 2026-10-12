/* 学生照片 ZIP 导入：保留原图和原文件名，按当前学生姓名匹配编号。 */
(function () {
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
  const gb18030Decoder = new TextDecoder('gb18030', { fatal: true });

  function decodeName(bytes, utf8Flag) {
    if (utf8Flag) return utf8Decoder.decode(bytes);
    try { return utf8Decoder.decode(bytes); }
    catch (error) { return gb18030Decoder.decode(bytes); }
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== 'function') throw new Error('当前浏览器不支持 ZIP 解压，请更换新版浏览器');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function readZip(file) {
    if (!file?.name?.toLowerCase().endsWith('.zip')) throw new Error('仅支持 ZIP 压缩包');
    if (file.size > 50 * 1024 * 1024) throw new Error('压缩包不能超过 50MB');
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let end = -1;
    for (let index = Math.max(0, bytes.length - 65557); index <= bytes.length - 22; index += 1) {
      if (view.getUint32(index, true) === 0x06054b50) end = index;
    }
    if (end < 0) throw new Error('无法读取 ZIP，请重新打包');
    const count = view.getUint16(end + 10, true);
    let offset = view.getUint32(end + 16, true);
    const entries = [];
    for (let index = 0; index < count; index += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIP 目录信息不完整');
      const flags = view.getUint16(offset + 8, true);
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const size = view.getUint32(offset + 24, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const rawName = bytes.slice(offset + 46, offset + 46 + nameLength);
      let name;
      try { name = decodeName(rawName, Boolean(flags & 0x800)).replace(/\\/g, '/'); }
      catch (error) { throw new Error('ZIP 中文文件名无法识别，请重新打包'); }
      offset += 46 + nameLength + extraLength + commentLength;
      if (!name || name.endsWith('/') || name.includes('__MACOSX/')) continue;
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('ZIP 文件内容不完整');
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      let photoBytes;
      if (method === 0) photoBytes = compressed;
      else if (method === 8) photoBytes = await inflateRaw(compressed);
      else throw new Error(`ZIP 使用了不支持的压缩方式（${method}）`);
      if (photoBytes.length !== size) throw new Error(`${name}：解压后的文件大小不正确`);
      const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
      const type = extension === '.png' ? 'image/png' : 'image/jpeg';
      entries.push({ name, size, blob: new Blob([photoBytes], { type }) });
    }
    return entries;
  }

  async function matchAndUpload({ zipFile, students, uploadPhoto }) {
    if (typeof uploadPhoto !== 'function') throw new Error('缺少照片上传接口');
    if (!Array.isArray(students)) throw new Error('缺少当前班级学生列表');
    const entries = await readZip(zipFile);
    const byName = new Map();
    students.forEach(student => {
      const key = String(student.name || '').trim().normalize('NFC');
      const list = byName.get(key) || [];
      list.push(student);
      byName.set(key, list);
    });
    const results = [];
    const seenIds = new Set();
    for (const entry of entries) {
      const fileName = entry.name.split('/').pop();
      const dot = fileName.lastIndexOf('.');
      const extension = dot > 0 ? fileName.slice(dot).toLowerCase() : '';
      const name = (dot > 0 ? fileName.slice(0, dot) : fileName).trim().normalize('NFC');
      const matched = byName.get(name) || [];
      if (!['.jpg', '.jpeg', '.png'].includes(extension)) {
        results.push({ fileName, success: false, reason: '不支持的照片格式' });
      } else if (entry.size > 2 * 1024 * 1024) {
        results.push({ fileName, success: false, reason: '照片超过 2MB' });
      } else if (matched.length !== 1) {
        results.push({ fileName, success: false, reason: matched.length ? '当前班级完整姓名重复' : '当前班级没有匹配学生' });
      } else if (seenIds.has(matched[0].id)) {
        results.push({ fileName, success: false, reason: '同一学生存在多张照片' });
      } else {
        seenIds.add(matched[0].id);
        try {
          await uploadPhoto({ studentId: matched[0].id, originalFileName: fileName, file: entry.blob });
          results.push({ fileName, studentId: matched[0].id, success: true });
        } catch (error) {
          results.push({ fileName, studentId: matched[0].id, success: false, reason: error.message || '照片上传失败' });
        }
      }
    }
    return results;
  }
  window.FacePhotoImporter = { readZip, matchAndUpload };
})();