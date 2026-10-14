const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { root } = require('./helpers/theme.cjs');

function python(code) {
  const result = spawnSync(process.env.PYTHON_EXECUTABLE || 'python3', ['-c', code], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return JSON.parse(result.stdout);
}

test('CSV import keeps explicit alternatives, rejects guesses and excludes drafts and commercial fields', () => {
  const data = python("import json,runpy; from pathlib import Path; m=runpy.run_path('scripts/import-fitment.py'); d,r=m['extract'](Path('tests/fixtures/fitment.csv')); print(json.dumps({'data':d,'review':r}))");
  assert.equal(data.data.meta.exportProducts, 4);
  assert.equal(data.data.meta.publishedProducts, 3);
  assert.equal(data.data.meta.excludedUnpublishedProducts, 1);
  assert.equal(data.data.meta.productsWithRecords, 2);
  assert.equal(data.data.vehicles.length, 3, 'Repeated fitment rows are deduplicated');
  assert.deepEqual(data.data.vehicles.slice(0, 2).map((vehicle) => vehicle.engine), ['N54', 'N55']);
  assert.deepEqual(data.data.vehicles[2], { make: 'Audi', model: 'A3', chassis: '8P', engine: '2.0T', variant: 'FWD', years: null });
  assert.equal(data.data.products.partial.review, true);
  assert.deepEqual(data.data.products.guessed.records, []);
  assert.equal(data.data.products.draft, undefined);
  assert.equal(/PRIVATE-SKU|123\.45|67\.89|Body \(HTML\)/.test(JSON.stringify(data.data)), false);
});

test('ambiguous engines, years, compound models and typo makes are reported rather than silently accepted', () => {
  const result = python(`import json,runpy
m=runpy.run_path('scripts/import-fitment.py')
rows=[
  {'make':'BMW','chassis':'F30','model':'335i','engine':'N55'},
  {'make':'BMW','model':'F30','submodel':'335i','engine':'N55'},
  {'make':'BMW','model':'F10','submodel':'550i','engine':'N63/TU 4.4L'},
  {'make':'Audi','model':'MK3 TT (2014+)','engine':'2.0T'},
  {'make':'BWM','model':'335i','engine':'N55'},
  {'make':'BMW','model':'X5/X6','engine':'N55'},
]
out=[]
for row in rows:
  try: out.append(m['records_for_row'](row))
  except ValueError as e: out.append({'error':str(e)})
print(json.dumps(out))`);
  assert.deepEqual(result[0], result[1], 'Known supplier platform/submodel layout is normalized');
  assert.ok(result.slice(2).every((row) => row.error));
});

test('import command produces deterministic public data and a review report', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ae-fitment-test-'));
  try {
    const args = ['scripts/import-fitment.py', 'tests/fixtures/fitment.csv', '--root', temporary];
    const run = () => {
      const result = spawnSync(process.env.PYTHON_EXECUTABLE || 'python3', args, { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || result.error?.message);
      return fs.readFileSync(path.join(temporary, 'assets/fitment-data.js'), 'utf8');
    };
    assert.equal(run(), run());
    const report = fs.readFileSync(path.join(temporary, 'FITMENT-IMPORT.md'), 'utf8');
    assert.match(report, /Model-year ranges are not supplied/);
    assert.match(report, /restrictions/);
    assert.match(report, /No explicit fitment table/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('shipped catalog has valid indices, published handles and no fabricated year ranges', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/fitment-data.js'), 'utf8'), context);
  const data = context.window.AEFitmentData;
  assert.equal(Object.keys(data.products).length, data.meta.publishedProducts);
  assert.equal(data.vehicles.length, data.meta.configurations);
  assert.equal(data.meta.reviewProducts, Object.values(data.products).filter((product) => product.review).length);
  assert.ok(data.vehicles.every((vehicle) => vehicle.make && vehicle.model && vehicle.engine && vehicle.years === null));
  assert.ok(Object.values(data.products).every((product) => product.records.every((id) => Number.isInteger(id) && data.vehicles[id])));
  assert.equal(data.meta.yearRangesProvided, false);
  assert.equal(data.meta.sha256.length, 64);
});

test('manufacturer reviews attach provenance only to exact rows and matching part numbers', () => {
  const data = python(`import json,runpy
from pathlib import Path
m=runpy.run_path('scripts/import-fitment.py')
review=json.loads(Path('data/fitment-source-reviews.json').read_text())['products']['135i-5-intercooler-fmic']
records=[record for row in review['rows'] for record in m['records_for_row'](row)]
before=json.dumps(records,sort_keys=True)
out=m['source_review'](review,{'Variant SKU':'335FMIC'},records)
print(json.dumps({'source':out,'unchanged':before==json.dumps(records,sort_keys=True)}))`);
  assert.equal(data.unchanged, true);
  assert.equal(data.source.scope, 'model-engine');
  assert.equal(data.source.reviewedAt, '2026-10-14');
  assert.equal(data.source.recordsSha256.length, 64);
  assert.equal('partNumber' in data.source, false, 'Exported SKU fields are not copied into the storefront asset');
});

test('manufacturer reviews reject mismatched rows, guessed years, unsafe URLs and malformed dates', () => {
  const data = python(`import copy,json,runpy
from pathlib import Path
m=runpy.run_path('scripts/import-fitment.py')
review=json.loads(Path('data/fitment-source-reviews.json').read_text())['products']['135i-5-intercooler-fmic']
records=[record for row in review['rows'] for record in m['records_for_row'](row)]
cases=[]
for url in ['javascript:alert(1)','https://armmotorsports.com.attacker.test/products/a','https://user:pass@armmotorsports.com/products/a','https://armmotorsports.com/products/a?private=secret']:
 r=copy.deepcopy(review); r['url']=url; cases.append(r)
r=copy.deepcopy(review); r['rows'][0]['years']=[2010]; cases.append(r)
r=copy.deepcopy(review); r['rows'].pop(); cases.append(r)
r=copy.deepcopy(review); r['partNumber']='Different'; cases.append(r)
r=copy.deepcopy(review); r['reviewedAt']='20261014'; cases.append(r)
r=copy.deepcopy(review); r['reviewedAt']='2026-02-31'; cases.append(r)
r=copy.deepcopy(review); r['scope']='guaranteed'; cases.append(r)
out=[]
for item in cases:
 try: m['source_review'](item,{'Variant SKU':'335FMIC'},records); out.append(False)
 except ValueError: out.append(True)
print(json.dumps(out))`);
  assert.equal(data.length, 10);
  assert.ok(data.every(Boolean));
});

test('stale source reviews are flagged without clearing existing fitment or upgrading year claims', () => {
  const data = python(`import json,runpy,tempfile
from pathlib import Path
m=runpy.run_path('scripts/import-fitment.py')
with tempfile.TemporaryDirectory() as directory:
 source=Path(directory)/'reviews.json'
 source.write_text(json.dumps({'version':1,'products':{'explicit':{'supplier':'ARM Motorsports','url':'https://armmotorsports.com/products/test','scope':'model-engine','reviewedAt':'2026-10-14','partNumber':'CHANGED','rows':[{'make':'BMW','chassis':'E90','model':'335i','engine':'N54/N55'}]}}}))
 data,review=m['extract'](Path('tests/fixtures/fitment.csv'),source)
 print(json.dumps({'data':data,'review':review}))`);
  assert.deepEqual(data.data.products.explicit.records, [0, 1]);
  assert.equal(data.data.products.explicit.review, true);
  assert.equal(data.data.products.explicit.sourceReview, undefined);
  assert.equal(data.data.meta.sourceReviewedProducts, 0);
  assert.equal(data.data.meta.yearRangesProvided, false);
  assert.ok(data.review.find((item) => item.handle === 'explicit').issues.some((issue) => issue.includes('source review invalid')));
});
