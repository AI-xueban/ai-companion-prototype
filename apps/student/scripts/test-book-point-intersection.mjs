import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'components/PersonalizedLearning/pointTrace.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { buildBookPointIntersection, getPointTrace, hasPointPredecessor } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const p = (id, children = []) => ({ id, name: id, children });
const catalog = ids => [{ id: 'chapter', name: 'chapter', points: [], children: [
  { id: 'section', name: 'section', points: ids.map(id => ({ id, name: `book-${id}` })), children: [] },
] }];
const tree = [p('group', [p('a'), p('b'), p('c'), p('d')]), p('other', [p('x'), p('y')])];
// Removing b must reconnect c to a, despite textbook order being reversed; never cross groups.
const intersection = buildBookPointIntersection(catalog(['d', 'c', 'a', 'y', 'missing', 'a']), tree);
assert.equal(intersection.roots[0].inBook, false);
assert.deepEqual(intersection.roots[0].children.map(n => n.id), ['a', 'c', 'd']);
assert.deepEqual(getPointTrace(intersection.index, p('d')).map(n => n.id), ['d', 'c', 'a']);
assert.equal(intersection.index.c.previousId, 'a');
assert.equal(intersection.index.c.name, 'c');
assert.equal(intersection.index.c.parentId, 'group');
assert.equal(hasPointPredecessor(intersection.index, 'a'), false);
assert.equal(hasPointPredecessor(intersection.index, 'y'), false);
assert.equal(intersection.index.group, undefined);
assert.equal(intersection.index.missing, undefined);
assert.deepEqual(buildBookPointIntersection([], tree), { roots: [], index: {} });
assert.deepEqual(buildBookPointIntersection(catalog(['a']), []), { roots: [], index: {} });
const nested = buildBookPointIntersection(catalog(['leaf1', 'leaf3', 'outer']), [p('outer', [p('structural', [p('leaf1'), p('leaf2'), p('leaf3')])])]);
assert.deepEqual(getPointTrace(nested.index, p('leaf3')).map(n => n.id), ['leaf3', 'leaf1']);
assert.equal(nested.index.leaf1.previousId, undefined); // Do not trace to the matched ancestor outer.
assert.equal(nested.roots[0].children[0].id, 'structural');
assert(nested.index.outer); // Explicit chapter/section points remain in the intersection.
assert.equal(nested.index.outer.isLeaf, false);
assert.equal(hasPointPredecessor(nested.index, 'outer'), false);
assert.deepEqual(getPointTrace(nested.index, p('outer')), []);
const chapterAndSection = [{ id: 'directory', name: '章标题', points: [p('category2')], children: [
  { id: 'section-directory', name: '节标题', points: [p('category1'), p('leafA'), p('leafB')], children: [] },
] }];
const categories = buildBookPointIntersection(chapterAndSection, [
  p('category1', [p('not-in-book')]), p('category2', [p('leafA'), p('leafB')]),
]);
assert.deepEqual(new Set(Object.keys(categories.index)), new Set(['category1', 'category2', 'leafA', 'leafB']));
assert.equal(categories.roots[0].children.length, 0);
assert.equal(categories.roots[0].isLeaf, false); // Pruned classification is still non-leaf.
assert.equal(categories.index.category2.previousId, undefined);
assert.equal(hasPointPredecessor(categories.index, 'category2'), false);
assert.deepEqual(getPointTrace(categories.index, p('category2')), []);
assert.deepEqual(getPointTrace(categories.index, p('leafB')).map(p => p.id), ['leafB', 'leafA']);
const mixed = buildBookPointIntersection(catalog(['a', 'category', 'b']), [p('group', [p('a'), p('category', [p('absent')]), p('b')])]);
assert.equal(mixed.index.b.previousId, 'a'); // A category is never an endpoint in a leaf trace.
assert.equal(mixed.index.category.previousId, undefined);
const chapterLeaves = buildBookPointIntersection([
  { id: 'chapter-directory', name: '章标题', points: [p('a'), p('b')], children: [] },
], [p('group', [p('a'), p('b')])]);
assert.equal(hasPointPredecessor(chapterLeaves.index, 'b'), true); // Directory depth does not decide leaf status.
assert.deepEqual(getPointTrace(chapterLeaves.index, p('b')).map(p => p.id), ['b', 'a']);

let booksChecked = 0, pointsChecked = 0, changedPredecessors = 0, categoriesChecked = 0;
const examples = [];
const data = path.join(root, 'data/learning-books');
for (const file of fs.readdirSync(path.join(data, 'point-trees'))) {
  const code = path.basename(file, '.json');
  const pointTree = JSON.parse(fs.readFileSync(path.join(data, 'point-trees', file)));
  const sourceIndex = new Map();
  const indexSource = (siblings, parentId) => siblings.forEach((point, i) => {
    sourceIndex.set(point.id, { parentId, previousId: siblings[i - 1]?.id, name: point.name, isLeaf: !point.children.length });
    indexSource(point.children, point.id);
  });
  indexSource(pointTree);
  for (const filePath of [path.join(data, `${code}.json`), path.join(data, 'grade7-first-term', `${code}.json`)].filter(fs.existsSync)) {
    for (const book of JSON.parse(fs.readFileSync(filePath))) {
      const bookIds = new Set();
      const collect = node => { node.points.forEach(point => bookIds.add(point.id)); node.children.forEach(collect); };
      book.children.forEach(collect);
      const { index } = buildBookPointIntersection(book.children, pointTree);
      const expectedIds = [...bookIds].filter(id => sourceIndex.has(id));
      assert.deepEqual(new Set(Object.keys(index)), new Set(expectedIds), `${code}/${book.name}: membership`);
      const checkSiblings = siblings => {
        const matched = siblings.filter(point => bookIds.has(point.id) && !point.children.length);
        matched.forEach((point, i) => {
          assert.equal(index[point.id].previousId, matched[i - 1]?.id);
          assert.equal(index[point.id].parentId, sourceIndex.get(point.id).parentId);
        });
        siblings.forEach(point => checkSiblings(point.children));
      };
      checkSiblings(pointTree);
      for (const [id, point] of Object.entries(index)) {
        assert.equal(point.isLeaf, sourceIndex.get(id).isLeaf);
        const chain = getPointTrace(index, point);
        if (!point.isLeaf) {
          assert.equal(point.previousId, undefined);
          assert.equal(hasPointPredecessor(index, id), false);
          assert.deepEqual(chain, []);
          categoriesChecked++;
        }
        assert.equal(new Set(chain.map(p => p.id)).size, chain.length);
        assert(chain.every(p => p.isLeaf && bookIds.has(p.id) && p.parentId === point.parentId));
        if (point.previousId !== sourceIndex.get(id).previousId) {
          changedPredecessors++;
          if (code === 'math' && examples.length < 3) examples.push({ book: `${book.edition} ${book.grade} ${book.term}`, point: point.name, old: sourceIndex.get(sourceIndex.get(id).previousId)?.name ?? null, current: index[point.previousId]?.name ?? null });
        }
        pointsChecked++;
      }
      booksChecked++;
    }
  }
}
console.log(`PASS: chapter/section Points retained, original non-leaves excluded from tracing (including pruned categories), ${booksChecked} books, ${pointsChecked} matched points, ${categoriesChecked} non-leaves, ${changedPredecessors} predecessor changes; every chain contains only in-book leaves within its original parent.`);
console.log(JSON.stringify(examples, null, 2));
