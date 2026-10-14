"""Read-only catalog review. Never rewrites descriptions or uploads product data."""
import argparse
import csv
import hashlib
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


class DescriptionAudit(HTMLParser):
    VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.fragments = Counter()

    def handle_starttag(self, tag, attrs):
        token = ('start', tag, tuple(sorted(attrs)))
        for entry in self.stack:
            entry['tokens'].append(token)
        if tag not in self.VOID:
            self.stack.append({'tag': tag, 'tokens': [token], 'text': []})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        if not data.strip():
            return
        for entry in self.stack:
            entry['tokens'].append(('text', data))
            entry['text'].append(data)

    def handle_endtag(self, tag):
        # Malformed nesting is not a safe basis for a duplicate-content finding.
        if not self.stack or self.stack[-1]['tag'] != tag:
            self.stack.clear()
            return
        for entry in self.stack:
            entry['tokens'].append(('end', tag))
        entry = self.stack.pop()
        length = len(''.join(entry['text']).strip())
        if length >= 200:
            digest = hashlib.sha256(repr(entry['tokens']).encode()).hexdigest()
            self.fragments[(digest, length)] += 1

    def duplicates(self):
        return sorted(({'characters': length, 'copies': count}
                       for (_, length), count in self.fragments.items() if count > 1),
                      key=lambda item: (-item['characters'], -item['copies']))


def audit(source):
    products = {}
    with source.open(newline='', encoding='utf-8-sig') as stream:
        reader = csv.DictReader(stream)
        required = {'Handle', 'Body (HTML)', 'Vendor', 'Published', 'Status'}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError('Expected a Shopify product export with Handle, Body (HTML), Vendor, Published and Status')
        for row in reader:
            handle = row['Handle'].strip()
            if handle and handle not in products:
                products[handle] = row
    vendors = Counter()
    review = []
    for handle, row in sorted(products.items()):
        if row['Published'].strip().lower() != 'true' or row['Status'].strip().lower() != 'active':
            continue
        vendors[row['Vendor'].strip()] += 1
        parser = DescriptionAudit()
        parser.feed(row['Body (HTML)'])
        duplicates = parser.duplicates()
        if duplicates:
            review.append({'handle': handle, 'largest': duplicates[0]})
    return vendors, review


def markdown(source, vendors, review):
    lines = ['# Catalog Content Review', '',
             f'Source SHA-256: `{hashlib.sha256(source.read_bytes()).hexdigest()}`', '',
             f'Published active products: {sum(vendors.values())}.',
             f'Products with repeated substantial HTML fragments: {len(review)}.', '',
             'This is a read-only review, not a cleanup import. Original descriptions, prices, inventory and customer data are not included. Identical parsed HTML subtrees with at least 200 text characters are flagged; nested findings may overlap. Similar but nonidentical sections are not detected. Repetition may be intentional.', '',
             'Before editing Shopify, export a fresh backup, compare the current description with this source, and manually review each candidate. Preserve fitment tables, restrictions, warnings, media and links. No automatic deletion is proposed.', '',
             '## Supplier Labels', '', '| Label | Products |', '| --- | ---: |']
    for vendor, count in sorted(vendors.items()):
        lines.append(f'| {vendor.replace(chr(124), chr(92) + chr(124))} | {count} |')
    lines += ['', 'Normalize supplier labels only after checking fresh Shopify data. `armmotorsports` and `ARM Motorsports` should be reviewed as one supplier before enabling Brand filters.', '',
              '## Description Candidates', '', '| Product Handle | Largest Repeated Fragment (Text Characters) | Copies |', '| --- | ---: | ---: |']
    for item in review:
        handle = item['handle'].replace('|', '\\|')
        lines.append(f"| {handle} | {item['largest']['characters']} | {item['largest']['copies']} |")
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    parser.add_argument('--output', type=Path, default=Path('CATALOG-REVIEW.md'))
    args = parser.parse_args()
    if args.output.resolve() == args.csv.resolve():
        parser.error('The report cannot overwrite the source export')
    vendors, review = audit(args.csv)
    args.output.write_text(markdown(args.csv, vendors, review), encoding='utf-8')
    print(f'{sum(vendors.values())} published products; {len(review)} description candidates. No products modified.')


if __name__ == '__main__':
    main()
