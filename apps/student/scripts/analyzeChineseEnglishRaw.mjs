import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';

function load(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function flattenKnowledgeTree(roots) {
  const map = new Map();
  const visit = (n) => {
    map.set(n.node_id, n);
    n.children?.forEach(visit);
  };
  roots.forEach(visit);
  return map;
}

function collectCatalogPoints(catalogTree, catalogIds) {
  const pts = [];
  const visit = (node) => {
    if (catalogIds.has(node.catalog_id)) pts.push(...(node.knowledge_points ?? []));
    node.children?.forEach(visit);
  };
  catalogTree.forEach(visit);
  return pts;
}

function collectCatalogIds(catalogTree, chapterId, sectionId) {
  const ids = new Set();
  const walk = (n) => {
    ids.add(n.catalog_id);
    n.children?.forEach(walk);
  };
  const ch = catalogTree.find((c) => c.catalog_id === chapterId);
  if (!ch) return ids;
  if (sectionId) {
    const find = (n, t) => {
      if (n.catalog_id === t) return n;
      for (const c of n.children ?? []) {
        const r = find(c, t);
        if (r) return r;
      }
      return null;
    };
    const sec = find(ch, sectionId);
    if (sec) walk(sec);
  } else walk(ch);
  return ids;
}

function analyzeSubject(tree, subjectLabel, options = {}) {
  const flat = flattenKnowledgeTree(tree.knowledge_tree);
  const typeCount = { KnowledgeNode: 0, KnowledgePoint: 0, TestingPoint: 0 };
  let catalogIdZero = 0;
  let catalogIdNonZero = 0;
  let hasCatalogName = 0;

  flat.forEach((n) => {
    typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    if (n.catalog_id === 0) catalogIdZero++;
    else catalogIdNonZero++;
    if (n.catalog_name?.trim()) hasCatalogName++;
  });

  // catalog mount stats
  let catalogMountTotal = 0;
  const catalogMountByType = { KnowledgeNode: 0, KnowledgePoint: 0, TestingPoint: 0 };
  const visitCat = (node) => {
    for (const p of node.knowledge_points ?? []) {
      catalogMountTotal++;
      catalogMountByType[p.type] = (catalogMountByType[p.type] || 0) + 1;
    }
    node.children?.forEach(visitCat);
  };
  tree.catalog_tree.forEach(visitCat);

  // Sample scopes
  const scopes = [];
  for (const ch of tree.catalog_tree) {
    const sections = options.englishOnlyUnit
      ? (ch.children ?? []).filter((s) => /^Unit\s+\d+/i.test(s.name))
      : options.chineseChapterOnly
        ? [{ catalog_id: ch.catalog_id, name: ch.name, knowledge_points: ch.knowledge_points }]
        : ch.children?.length
          ? ch.children
          : [{ catalog_id: ch.catalog_id, name: ch.name }];

    for (const sec of sections) {
      const secId = options.chineseChapterOnly ? undefined : sec.catalog_id;
      const catalogIds = collectCatalogIds(tree.catalog_tree, ch.catalog_id, secId);
      const mounts = collectCatalogPoints(tree.catalog_tree, catalogIds);
      const mountIds = new Set(mounts.map((p) => p.node_id));

      // What knowledge_tree adds beyond catalog mount (old algorithm simulation)
      const included = new Set(mountIds);
      flat.forEach((n) => {
        if (n.catalog_id !== 0 && catalogIds.has(n.catalog_id)) {
          const add = (node) => {
            included.add(node.node_id);
            node.children?.forEach(add);
          };
          add(n);
        }
      });
      // ancestors full chain
      const ensureAncestors = (nodeId) => {
        const node = flat.get(nodeId);
        if (!node || node.parent_id === 0) return;
        if (!included.has(node.parent_id)) {
          included.add(node.parent_id);
          ensureAncestors(node.parent_id);
        }
      };
      [...included].forEach(ensureAncestors);

      const extraFromTree = [...included].filter((id) => !mountIds.has(id));
      const extraNodes = extraFromTree.map((id) => flat.get(id)).filter(Boolean);

      scopes.push({
        chapter: ch.name,
        section: sec.name,
        mountCount: mounts.length,
        mountTypes: mounts.reduce((a, p) => {
          a[p.type] = (a[p.type] || 0) + 1;
          return a;
        }, {}),
        withAncestorsCount: included.size,
        extraFromTreeCount: extraFromTree.length,
        extraTypes: extraNodes.reduce((a, n) => {
          a[n.type] = (a[n.type] || 0) + 1;
          return a;
        }, {}),
        extraSamples: extraNodes.slice(0, 5).map((n) => `${n.name}(${n.type})`),
        mountSamples: mounts.slice(0, 5).map((p) => `${p.name}(${p.type},cat=${p.catalog_id})`),
      });
    }
  }

  return {
    subject: subjectLabel,
    textbook: tree.textbook_name,
    statistics: tree.statistics,
    knowledgeTree: {
      total: flat.size,
      typeCount,
      catalogIdZero,
      catalogIdNonZero,
      hasCatalogName,
    },
    catalogMount: { total: catalogMountTotal, byType: catalogMountByType },
    scopes,
  };
}

const chinese = analyzeSubject(
  load(path.join(root, 'data/knowledge_trees/demo/1_4_上册_4686.json')),
  '语文',
  { chineseChapterOnly: true }
);
const english = analyzeSubject(
  load(path.join(root, 'data/knowledge_trees/demo/3_4_上册_5275.json')),
  '英语',
  { englishOnlyUnit: true }
);

console.log('===== 语文 原始数据结构 =====');
console.log(JSON.stringify({
  textbook: chinese.textbook,
  fileStatistics: chinese.statistics,
  knowledgeTree: chinese.knowledgeTree,
  catalogMount: chinese.catalogMount,
  unitSamples: chinese.scopes.filter((s) => s.mountCount > 0).slice(0, 3),
  emptyUnits: chinese.scopes.filter((s) => s.mountCount === 0).length,
  totalUnits: chinese.scopes.length,
}, null, 2));

console.log('\n===== 语文 各单元明细 =====');
chinese.scopes.forEach((s) => {
  console.log(
    `${s.section.padEnd(10)} | 挂载${String(s.mountCount).padStart(2)} ${JSON.stringify(s.mountTypes)} | +祖先后${s.withAncestorsCount} (+${s.extraFromTreeCount}) | 挂载样例: ${s.mountSamples.join(', ') || '无'}`
  );
  if (s.extraFromTreeCount > 0) console.log(`  祖先/树补入: ${s.extraSamples.join(', ')}`);
});

console.log('\n===== 英语 原始数据结构 =====');
console.log(JSON.stringify({
  textbook: english.textbook,
  fileStatistics: english.statistics,
  knowledgeTree: english.knowledgeTree,
  catalogMount: english.catalogMount,
}, null, 2));

console.log('\n===== 英语 各 Unit 明细 =====');
english.scopes.forEach((s) => {
  console.log(
    `${s.section.padEnd(28)} | 挂载${String(s.mountCount).padStart(2)} ${JSON.stringify(s.mountTypes)} | +祖先后${s.withAncestorsCount} (+${s.extraFromTreeCount})`
  );
  console.log(`  挂载样例: ${s.mountSamples.join(', ')}`);
  if (s.extraFromTreeCount > 0) console.log(`  树补入样例: ${s.extraSamples.join(', ')}`);
});

// English letter bucket analysis in knowledge_tree
const engTree = load(path.join(root, 'data/knowledge_trees/demo/3_4_上册_5275.json'));
const flat = flattenKnowledgeTree(engTree.knowledge_tree);
let letterBuckets = 0;
let letterBucketChildren = 0;
flat.forEach((n) => {
  if (/^[A-Za-z]$/.test(n.name.trim()) && n.type === 'KnowledgePoint') {
    letterBuckets++;
    letterBucketChildren += n.children?.length ?? 0;
  }
});
console.log('\n===== 英语 knowledge_tree 字母桶 =====');
console.log(`字母桶 KnowledgePoint 数量: ${letterBuckets}`);
console.log(`字母桶下挂子节点总数: ${letterBucketChildren}`);
