const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { root } = require('./helpers/theme.cjs');

function python(code) {
  const result = spawnSync(process.env.PYTHON_EXECUTABLE || 'python3', ['-c', code], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return JSON.parse(result.stdout);
}

test('catalog audit flags exact substantial HTML repetition without suggesting content deletion', () => {
  const data = python(`import json,runpy
m=runpy.run_path('scripts/audit-catalog.py')
p=m['DescriptionAudit']()
fragment='<section><h2>Fitment</h2><p>'+('Verified source content. '*20)+'</p><img src="source.jpg"></section>'
p.feed(fragment+fragment)
print(json.dumps(p.duplicates()))`);
  assert.equal(data[0].copies, 2);
  assert.ok(data[0].characters > 200);
  assert.ok(data.every((row) => Object.keys(row).sort().join() === 'characters,copies'));
});

test('catalog audit ignores changed warnings, short repeated labels and malformed nesting', () => {
  const data = python(`import json,runpy
m=runpy.run_path('scripts/audit-catalog.py')
out=[]
for html in ['<p>Label</p>'*3, '<p>'+('A'*210)+'</p><p>'+('B'*210)+'</p>', '<div><p>'+('A'*210)+'</div></p>'*2]:
 p=m['DescriptionAudit'](); p.feed(html); out.append(p.duplicates())
print(json.dumps(out))`);
  assert.deepEqual(data, [[], [], []]);
});

test('catalog report excludes drafts, variant duplicates, raw descriptions and commercial columns', () => {
  const data = python(`import csv,json,runpy,tempfile
from pathlib import Path
m=runpy.run_path('scripts/audit-catalog.py')
with Path('tests/fixtures/fitment.csv').open(newline='') as stream:
 rows=list(csv.DictReader(stream))
with tempfile.TemporaryDirectory() as directory:
 source=Path(directory)/'products.csv'
 with source.open('w',newline='') as stream:
  writer=csv.DictWriter(stream,fieldnames=list(rows[0])+['Vendor']); writer.writeheader()
  for row in rows: writer.writerow(dict(row,Vendor='Supplier'))
 v,r=m['audit'](source)
 report=m['markdown'](source,v,r)
print(json.dumps({'products':sum(v.values()),'report':report}))`);
  assert.equal(data.products, 3);
  assert.match(data.report, /read-only review/);
  assert.match(data.report, /fresh backup/);
  assert.equal(/PRIVATE-SKU|123\.45|67\.89|<table|Body \(HTML\)/.test(data.report), false);
});
