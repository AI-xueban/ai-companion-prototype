"""Build the teacher review shell. Student mode uses the live tablet preview."""
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
source = Path(__file__).with_name('hivemate-v2.fragment.html').read_text(encoding='utf-8')
page = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HiveMate 3.0 · 师生共创平台</title>
<style>body{margin:0;padding:22px;background:#eef0f8;color-scheme:light}#hive-next{max-width:1520px;margin:auto}@media(max-width:600px){body{padding:0}}</style>
</head><body>''' + source + '</body></html>'
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(page, encoding='utf-8')
print(args.output)
