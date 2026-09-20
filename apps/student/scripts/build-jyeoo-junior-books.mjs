import fs from 'fs';
import path from 'path';

const SRC = 'E:/通晤纪/原型文件/AI学伴_0812/同步章节映射知识点数据-菁优网/jyeoo_metadata';
const OUT = path.join(process.cwd(), 'data/jyeooJuniorBooks.json');

const SOURCES = [
  ['数学', [
    'jye_math_book/math_book2_c774d5bded2f8215876f1f179af464be.json',
    'jye_math3_book/math3_book2_be5c68a93fc20f26f9f718727b6b90f8.json',
  ]],
  ['语文', [
    'jye_chinese_book/chinese_book2_62d1c47c734c9d0da7bc27bc51ae88ae.json',
    'jye_chinese3_book/chinese3_book2_d19eaf897bb9e7e15d42c07b2bb79da9.json',
  ]],
  ['英语', [
    'jye_english_book/english_book2_527a440baa5428576ae6f7b7e8c4dc48.json',
    'jye_english3_book/english3_book2_e087266a4384d6faf0d4bfb4e6e4daa0.json',
  ]],
  ['物理', ['jye_physics_book/physics_book2_9c5a154db5cdc4a4eab8e110e0e88125.json']],
  ['化学', ['jye_chemistry_book/chemistry_book2_ced4904cde2d4525cf6dd5cfd8139dcb.json']],
  ['生物', ['jye_bio_book/bio_book2_7e0d829f6b5919742e64076e9a658f25.json']],
  ['历史', ['jye_history_book/history_book2_4d1c5ad2caa65bfd5e3ddea128fb498c.json']],
  ['地理', ['jye_geography_book/geography_book2_dab4e8d1545b145622a3b2526d27672b.json']],
  ['道德与法治', [
    'jye_politics_book/politics_book2_aaacf517051c632dde440f7b3407b63a.json',
    'jye_politics3_book/politics3_book2_5bc373c7dbb43aa4a3e22cd27692644d.json',
  ]],
  ['科学', [
    'jye_science_book/science_book2_aa9694d0a2612a21f5d135677f12c8a3.json',
    'jye_science3_book/science3_book2_3726045d556ac22aae44d087a8bab99b.json',
  ]],
];

const TERM_MAP = { 上学期: '上册', 下学期: '下册' };

function mapTerm(book) {
  if (TERM_MAP[book.TermName]) return TERM_MAP[book.TermName];
  const raw = `${book.TermName || ''} ${book.Name || ''}`;
  if (/全/.test(raw)) return '全一册';
  if (book.TermName) return String(book.TermName).replace('学期', '册');
  return '';
}

function compactNode(node) {
  const points = (node.Points || [])
    .filter((point) => point?.No || point?.Name)
    .map((point) => ({ id: String(point.No || point.Name), title: String(point.Name || '').trim() }))
    .filter((point) => point.title);
  const children = (node.Children || []).map(compactNode).filter((child) => child.title);
  const result = {
    id: String(node.ID || node.Name),
    title: String(node.Name || '').trim(),
  };
  if (points.length) result.points = points;
  if (children.length) result.children = children;
  return result;
}

function compactBook(book, subject) {
  const term = mapTerm(book);
  if (!book.GradeName || !term) return null;
  const chapters = (book.Children || []).map(compactNode).filter((node) => node.title);
  if (!chapters.length) return null;
  return {
    subject,
    edition: book.EditionName,
    grade: book.GradeName,
    term,
    title: book.Name,
    chapters,
  };
}

function bookKey(book) {
  return `${book.subject}|${book.edition}|${book.grade}|${book.term}`;
}

const payload = { generatedAt: new Date().toISOString().slice(0, 10), books: [] };
const seen = new Set();

for (const [subject, files] of SOURCES) {
  let kept = 0;
  for (const rel of files) {
    const filePath = path.join(SRC, rel);
    if (!fs.existsSync(filePath)) {
      console.warn('missing', rel);
      continue;
    }
    const books = JSON.parse(fs.readFileSync(filePath, 'utf8')).response || [];
    for (const book of books) {
      if (![6, 7, 8, 9].includes(book.GradeID)) continue;
      const compact = compactBook(book, subject);
      if (!compact) continue;
      const key = bookKey(compact);
      if (seen.has(key)) continue;
      seen.add(key);
      payload.books.push(compact);
      kept += 1;
    }
  }
  console.log(subject, 'kept', kept);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload));
const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log('wrote', OUT, sizeKb, 'KB', 'books', payload.books.length);
