"""Extract catalog/Points only; never copy explanations or cached question counts."""
import json
import sys
import zipfile
from pathlib import Path

out = Path(__file__).resolve().parents[1] / 'data' / 'learning-books'
out.mkdir(parents=True, exist_ok=True)

def catalog(node):
    return {
        'id': node['ID'], 'name': node['Name'],
        'children': [catalog(c) for c in node.get('Children', [])],
        'points': list({str(p['No']): {'id': str(p['No']), 'name': p['Name']}
                        for p in node.get('Points', [])}.values()),
    }

with zipfile.ZipFile(sys.argv[1]) as archive:
    for name in archive.namelist():
        if '_book2_' not in name or not name.endswith('.json'):
            continue
        code = Path(name).name.split('_book2_')[0]
        raw = json.loads(archive.read(name))
        books = [{
            'id': b['ID'], 'name': b['Name'], 'edition': b.get('EditionName') or '',
            'grade': b.get('GradeName') or '', 'term': b.get('TermName') or '',
            'children': [catalog(c) for c in b.get('Children', [])],
        } for b in raw['response']]
        (out / f'{code}.json').write_text(json.dumps(books, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(code, len(books))
