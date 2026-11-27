import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'components/PersonalizedLearning/bookLearningGraph.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { buildBookGraph } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const point = (id, name = id, children) => ({ id, name, children });
const catalog = (id, name, points = [], children = []) => ({ id, name, points, children });
const scope = catalog('directory', '所选节', [point('own')], [catalog('sub', '子节', [point('child')])]);
assert.deepEqual(buildBookGraph(scope)[0].points.map(p => p.id), ['own', 'child']);
const duplicate = catalog('dir', '所选节', [point('same')], [catalog('sub', '子节', [point('same', 'same', [point('nested')])])]);
assert.deepEqual(buildBookGraph(duplicate)[0].points.map(p => p.id), ['same', 'nested']);
const absent = catalog('directory-only', '只有目录标题', [], [catalog('sub', '子节', [point('actual')])]);
assert.deepEqual(buildBookGraph(absent)[0].points.map(p => p.id), ['actual']);
assert.deepEqual(buildBookGraph(catalog('no-point', '没有知识点')), []);
assert.equal(buildBookGraph(catalog('different-ids', '其他标题', [point('a', '同名'), point('b', '同名')]))[0].points.length, 2);

let directories = 0;
const data = path.join(root, 'data/learning-books');
for (const folder of [data, path.join(data, 'grade7-first-term')]) {
  for (const name of fs.readdirSync(folder).filter(n => /^(?:math3?|physics|chemistry|bio|geography|history|politics3?|science3?)\.json$/.test(n))) {
    for (const book of JSON.parse(fs.readFileSync(path.join(folder, name)))) {
      const check = scope => {
        const ids = new Set();
        const collectPoint = p => { ids.add(p.id); p.children?.forEach(collectPoint); };
        const collect = n => { n.points.forEach(collectPoint); n.children.forEach(collect); };
        collect(scope);
        const actual = buildBookGraph(scope).flatMap(g => g.points);
        assert.deepEqual(new Set(actual.map(p => p.id)), ids, `${name}/${scope.name}: explicit membership`);
        assert.equal(actual.length, ids.size, `${name}/${scope.name}: duplicate`);
        // Named leaf anchors and the confirmed absolute-value children keep their existing hierarchy.
        if (scope.children.length && scope.points.length && !['22116', '22118'].includes(scope.points[0].id)) {
          assert.equal(actual[0].id, scope.points[0].id, `${name}/${scope.name}: own point priority`);
        }
        directories++;
        scope.children.forEach(check);
      };
      book.children.forEach(check);
    }
  }
}
const north = JSON.parse(fs.readFileSync(path.join(data, 'grade7-first-term/math.json'))).find(b => b.edition === '北师大版（2024）');
const first = north.children[0].children[0];
assert.deepEqual(buildBookGraph(first)[0].points.map(p => p.name), ['认识立体图形', '点、线、面、体']);
console.log(`PASS: own Points first, duplicate children preserved, no title-generated nodes, same names/different IDs retained, ${directories} real directories retain exact JSON membership; screenshot section still has exactly two explicit points.`);
