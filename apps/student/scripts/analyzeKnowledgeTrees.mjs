import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function isEnglishUnitSection(name) {
  return /^Unit\s+\d+/i.test(name.trim());
}

function isEnglishVocabLabel(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const latin = (trimmed.match(/[A-Za-z]/g) || []).length;
  const cjk = (trimmed.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cjk > 0 && latin === 0) return false;
  return latin > 0;
}

function isLetterBucket(name) {
  return /^[A-Za-z]$/.test(name.trim());
}

function collectCatalogPoints(catalogTree, catalogIds) {
  const points = [];
  const visit = (node) => {
    if (catalogIds.has(node.catalog_id)) {
      points.push(...(node.knowledge_points ?? []));
    }
    node.children?.forEach(visit);
  };
  catalogTree.forEach(visit);
  return points;
}

function collectCatalogIds(catalogTree, chapterId, sectionId) {
  const ids = new Set();
  const walk = (node) => {
    ids.add(node.catalog_id);
    node.children?.forEach(walk);
  };
  const chapter = catalogTree.find((c) => c.catalog_id === chapterId);
  if (!chapter) return ids;
  if (sectionId) {
    const find = (node, target) => {
      if (node.catalog_id === target) return node;
      for (const ch of node.children ?? []) {
        const r = find(ch, target);
        if (r) return r;
      }
      return null;
    };
    const sec = find(chapter, sectionId);
    if (sec) walk(sec);
    else ids.add(sectionId);
  } else {
    walk(chapter);
  }
  return ids;
}

function analyzeScopePoints(points, catalogIds) {
  const stats = {
    total: points.length,
    KnowledgeNode: 0,
    KnowledgePoint: 0,
    TestingPoint: 0,
    englishVocab: 0,
    chineseLabel: 0,
    letterBucket: 0,
    other: 0,
  };
  for (const p of points) {
    stats[p.type] = (stats[p.type] ?? 0) + 1;
    if (isLetterBucket(p.name)) stats.letterBucket += 1;
    else if (p.type === 'TestingPoint' && isEnglishVocabLabel(p.name)) stats.englishVocab += 1;
    else if (/[\u4e00-\u9fff]/.test(p.name)) stats.chineseLabel += 1;
    else stats.other += 1;
  }
  return stats;
}

function classifyEnglishUnit(stats) {
  if (stats.total === 0) return 'empty';
  if (stats.englishVocab === stats.total) return 'vocab_only';
  if (stats.englishVocab >= stats.total * 0.8 && stats.KnowledgePoint === 0) return 'mostly_vocab';
  if (stats.KnowledgePoint > 0 && stats.englishVocab > 0) return 'grammar_vocab_mixed';
  if (stats.KnowledgePoint > 0 && stats.englishVocab === 0) return 'grammar_only';
  if (stats.chineseLabel > stats.englishVocab) return 'chinese_taxonomy';
  return 'other';
}

function analyzeTextbook(tree, subjectLabel) {
  const scopes = [];

  for (const ch of tree.catalog_tree) {
    const sections = ch.children?.length ? ch.children : [{ catalog_id: ch.catalog_id, name: ch.name, knowledge_points: ch.knowledge_points }];
    for (const sec of sections) {
      const isEnglish = subjectLabel === '英语';
      if (isEnglish && !isEnglishUnitSection(sec.name)) continue;

      const catalogIds = collectCatalogIds(tree.catalog_tree, ch.catalog_id, sec.catalog_id);
      const points = collectCatalogPoints(tree.catalog_tree, catalogIds);
      const stats = analyzeScopePoints(points, catalogIds);
      scopes.push({
        chapter: ch.name,
        section: sec.name,
        chapterId: ch.catalog_id,
        sectionId: sec.catalog_id,
        stats,
        classify: isEnglish ? classifyEnglishUnit(stats) : null,
      });
    }
  }

  return scopes;
}

function summarizeScopes(scopes, subjectLabel, tree) {
  const total = scopes.length;
  const empty = scopes.filter((s) => s.stats.total === 0).length;
  const withData = scopes.filter((s) => s.stats.total > 0);

  const typeTotals = { KnowledgeNode: 0, KnowledgePoint: 0, TestingPoint: 0 };
  let englishVocab = 0;
  let chineseLabel = 0;

  for (const s of withData) {
    typeTotals.KnowledgeNode += s.stats.KnowledgeNode;
    typeTotals.KnowledgePoint += s.stats.KnowledgePoint;
    typeTotals.TestingPoint += s.stats.TestingPoint;
    englishVocab += s.stats.englishVocab;
    chineseLabel += s.stats.chineseLabel;
  }

  const classifyCounts = {};
  if (subjectLabel === '英语') {
    for (const s of scopes) {
      classifyCounts[s.classify] = (classifyCounts[s.classify] ?? 0) + 1;
    }
  }

  const nodeCounts = withData.map((s) => s.stats.total);
  nodeCounts.sort((a, b) => a - b);
  const median = nodeCounts.length ? nodeCounts[Math.floor(nodeCounts.length / 2)] : 0;

  return {
    subject: subjectLabel,
    textbook: tree.textbook_name,
    textbookId: tree.textbook_id,
    fileStats: tree.statistics,
    scopeCount: total,
    emptyScopes: empty,
    scopesWithData: withData.length,
    typeTotals,
    englishVocab,
    chineseLabel,
    classifyCounts,
    nodeCount: {
      min: nodeCounts[0] ?? 0,
      median,
      max: nodeCounts[nodeCounts.length - 1] ?? 0,
      sweet6to20: withData.filter((s) => s.stats.total >= 6 && s.stats.total <= 20).length,
      under5: withData.filter((s) => s.stats.total < 5).length,
      over35: withData.filter((s) => s.stats.total > 35).length,
    },
    scopes,
  };
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function walkJsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const demoFiles = [
  { file: '1_4_上册_4686.json', subject: '语文' },
  { file: '2_4_上册_2964.json', subject: '数学' },
  { file: '3_4_上册_5275.json', subject: '英语' },
];

console.log('========== 四年级上册演示数据（产品当前使用） ==========\n');

const demoReports = [];
for (const { file, subject } of demoFiles) {
  const tree = loadJson(path.join(root, 'data/knowledge_trees/demo', file));
  demoReports.push(summarizeScopes(analyzeTextbook(tree, subject), subject, tree));
}

for (const r of demoReports) {
  console.log(`【${r.subject}】${r.textbook} (id=${r.textbookId})`);
  console.log(`  全书节点: 总${r.fileStats.total_nodes} | KnowledgeNode ${r.fileStats.knowledge_nodes} | KnowledgePoint ${r.fileStats.knowledge_points} | TestingPoint ${r.fileStats.testing_points}`);
  console.log(`  scope 数量: ${r.scopeCount} | 有数据 ${r.scopesWithData} | 空 ${r.emptyScopes}`);
  console.log(`  catalog 挂载合计: KP ${r.typeTotals.KnowledgePoint} | TP ${r.typeTotals.TestingPoint} | KN ${r.typeTotals.KnowledgeNode}`);
  if (r.subject === '英语') {
    console.log(`  英语词汇(拉丁字母): ${r.englishVocab} | 中文标签: ${r.chineseLabel}`);
    console.log(`  Unit 分类: ${JSON.stringify(r.classifyCounts)}`);
  }
  console.log(`  节点规模: 中位${r.nodeCount.median} | 甜区6-20: ${r.nodeCount.sweet6to20} | <5: ${r.nodeCount.under5} | >35: ${r.nodeCount.over35}`);
  console.log('');
}

const englishDemo = demoReports.find((r) => r.subject === '英语');
console.log('--- 英语 Unit 明细（四年级上册） ---');
for (const s of englishDemo.scopes) {
  const st = s.stats;
  console.log(
    `  ${s.section.padEnd(28)} | 总${String(st.total).padStart(3)} | 词${String(st.englishVocab).padStart(3)} | KP${st.KnowledgePoint} TP${st.TestingPoint} | ${s.classify}`
  );
}

const mathDemo = demoReports.find((r) => r.subject === '数学');
console.log('\n--- 数学 课时明细（节选：有数据的前 15 节） ---');
mathDemo.scopes
  .filter((s) => s.stats.total > 0)
  .slice(0, 15)
  .forEach((s) => {
    console.log(
      `  ${s.chapter.slice(0, 8).padEnd(10)} / ${s.section.slice(0, 16).padEnd(18)} | 总${String(s.stats.total).padStart(3)} | KP${s.stats.KnowledgePoint} TP${s.stats.TestingPoint}`
    );
  });

const chineseDemo = demoReports.find((r) => r.subject === '语文');
console.log('\n--- 语文 单元明细 ---');
for (const s of chineseDemo.scopes) {
  const st = s.stats;
  console.log(`  ${s.chapter.padEnd(10)} | 挂载${String(st.total).padStart(3)} | KP${st.KnowledgePoint} TP${st.TestingPoint} KN${st.KnowledgeNode}`);
}

// Full corpus
const fullDir = path.join(root, '知识图谱/knowledge_trees/knowledge_trees');
if (fs.existsSync(fullDir)) {
  console.log('\n\n========== 全量 54 册知识树 ==========\n');
  const files = walkJsonFiles(fullDir);
  const fullReports = [];
  for (const f of files) {
    const tree = loadJson(f);
    const subject = tree.course_name || '未知';
    if (!['语文', '数学', '英语'].includes(subject)) continue;
    fullReports.push(summarizeScopes(analyzeTextbook(tree, subject), subject, tree));
  }

  const bySubject = { 语文: [], 数学: [], 英语: [] };
  for (const r of fullReports) bySubject[r.subject].push(r);

  for (const subject of ['语文', '数学', '英语']) {
    const list = bySubject[subject];
    const scopes = list.flatMap((r) => r.scopes);
    const withData = scopes.filter((s) => s.stats.total > 0);
    const empty = scopes.filter((s) => s.stats.total === 0).length;
    const typeTotals = { KnowledgeNode: 0, KnowledgePoint: 0, TestingPoint: 0 };
    let englishVocab = 0;
    const classifyCounts = {};

    for (const s of withData) {
      typeTotals.KnowledgeNode += s.stats.KnowledgeNode;
      typeTotals.KnowledgePoint += s.stats.KnowledgePoint;
      typeTotals.TestingPoint += s.stats.TestingPoint;
      if (subject === '英语') {
        englishVocab += s.stats.englishVocab;
        classifyCounts[s.classify] = (classifyCounts[s.classify] ?? 0) + 1;
      }
    }

    const counts = withData.map((s) => s.stats.total).sort((a, b) => a - b);
    const pct = (n) => (withData.length ? ((n / withData.length) * 100).toFixed(1) : '0');

    console.log(`【${subject}】${list.length} 册`);
    console.log(`  scope 总数: ${scopes.length} | 有数据 ${withData.length} (${pct(withData.length)}%) | 空 ${empty}`);
    console.log(`  catalog 挂载: KP ${typeTotals.KnowledgePoint} | TP ${typeTotals.TestingPoint} | KN ${typeTotals.KnowledgeNode}`);
    if (subject === '英语') {
      console.log(`  英语词汇条: ${englishVocab} | Unit 分类: ${JSON.stringify(classifyCounts)}`);
      const vocabOnlyPct = classifyCounts.vocab_only
        ? ((classifyCounts.vocab_only / scopes.filter((s) => isEnglishUnitSection(s.section)).length) * 100).toFixed(1)
        : '0';
      console.log(`  纯单词 Unit 占比: ${classifyCounts.vocab_only ?? 0} / ${scopes.filter((s) => isEnglishUnitSection(s.section)).length} (${vocabOnlyPct}%)`);
    }
    console.log(
      `  节点规模: P50=${counts[Math.floor(counts.length / 2)] ?? 0} | 6-20甜区 ${withData.filter((s) => s.stats.total >= 6 && s.stats.total <= 20).length} (${pct(withData.filter((s) => s.stats.total >= 6 && s.stats.total <= 20).length)}) | <5 ${withData.filter((s) => s.stats.total < 5).length} (${pct(withData.filter((s) => s.stats.total < 5).length)})`
    );
    console.log('');
  }
}
