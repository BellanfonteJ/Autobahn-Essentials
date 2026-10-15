#!/usr/bin/env python3
"""Extract explicit supplier fitment tables; never infer fits from titles or prices."""
import argparse
import csv
import hashlib
import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self.table = self.row = self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.table = []
        elif tag == "tr" and self.table is not None:
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = []
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).replace("\ufeff", "").split()))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            if any(self.row):
                self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.table is not None:
            self.tables.append(self.table)
            self.table = None


MAKES = {"bmw": "BMW", "audi": "Audi", "vw": "Volkswagen", "volkswagen": "Volkswagen", "toyota": "Toyota"}
PLATFORM = re.compile(r"\b([EFG]\d{2}|[BCD]\d(?:\.\d)?|8[PV])\b", re.I)
ENGINE_CODES = re.compile(r"^([NBS]\d{2}[A-Z]?(?:/[NBS]\d{2}[A-Z]?)*)(?:\s+\d(?:\.\d)?L)?$", re.I)


def records_for_row(row):
    make = MAKES.get(row.get("make", "").lower())
    model, chassis = row.get("model", ""), row.get("chassis", "")
    variant, engine = row.get("submodel", ""), row.get("engine", "")
    if not make or not model or not engine:
        raise ValueError("Missing or unrecognized make/model/engine")
    if variant.lower() == "all":
        variant = ""
    # This supplier layout uses the Model column for a platform code.
    if not chassis and make == "BMW" and PLATFORM.fullmatch(model):
        if not variant:
            raise ValueError("Platform row has no specific vehicle model")
        chassis, model, variant = model.upper(), variant, ""
    elif not chassis and make == "Audi":
        platform = PLATFORM.search(model)
        if platform:
            chassis = platform.group(1).upper()
            model = " ".join(PLATFORM.sub("", model).split())
    if chassis and not PLATFORM.fullmatch(chassis):
        raise ValueError("Unrecognized chassis value: " + chassis)
    if not model or "/" in model or re.search(r"\b(?:19|20)\d{2}\b", model):
        raise ValueError("Compound model or embedded year needs review")
    model = re.sub(r"^1\s+M\b", "1M", model)
    codes = ENGINE_CODES.fullmatch(engine)
    if codes:
        engines = codes.group(1).upper().split("/")
    elif "/" in engine or re.search(r"coupe|cabriolet", engine, re.I):
        raise ValueError("Compound engine or body restriction needs review: " + engine)
    else:
        engines = [engine]
    return [{"make": make, "model": model, "chassis": chassis.upper(), "engine": value,
             "variant": variant, "years": None} for value in engines]


def source_review(review, product, records):
    hosts = {"ARM Motorsports": "armmotorsports.com"}
    url = urlsplit(review.get("url", ""))
    expected_host = hosts.get(review.get("supplier"))
    if not expected_host or url.scheme != "https" or url.hostname != expected_host or url.username or url.password or url.port or url.query or url.fragment or not url.path.startswith("/products/"):
        raise ValueError("Manufacturer source URL needs review")
    if review.get("scope") != "model-engine":
        raise ValueError("Only model/engine source reviews are supported; years remain unverified")
    reviewed_at = review.get("reviewedAt", "")
    if not isinstance(reviewed_at, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", reviewed_at):
        raise ValueError("Source review date must use YYYY-MM-DD")
    date.fromisoformat(reviewed_at)
    if not review.get("partNumber") or review["partNumber"].strip().casefold() != product.get("Variant SKU", "").strip().casefold():
        raise ValueError("Manufacturer part number does not match the exported product SKU")
    checked = []
    for row in review.get("rows", []):
        if set(row) - {"make", "model", "chassis", "engine", "submodel"}:
            raise ValueError("Source rows cannot contain years or unsupported fields")
        checked.extend(records_for_row(row))
    key = lambda row: json.dumps(row, sort_keys=True)
    if not checked or {key(row) for row in checked} != {key(row) for row in records}:
        raise ValueError("Manufacturer source rows differ from the current imported fitment")
    notes = review.get("notes", "")
    if not isinstance(notes, str) or len(notes) > 1000:
        raise ValueError("Manufacturer installation notes need review")
    return {"supplier": review["supplier"], "url": review["url"], "reviewedAt": review["reviewedAt"],
            "scope": "model-engine", "notes": notes, "recordsSha256": hashlib.sha256("\n".join(sorted({key(row) for row in checked})).encode()).hexdigest()}


def extract(source, source_reviews=None):
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not {"Handle", "Title", "Body (HTML)", "Published", "Status"}.issubset(reader.fieldnames or []):
            raise ValueError("Expected a Shopify product export")
        rows = list(reader)
    products = {}
    for row in rows:
        if row["Title"]:
            if row["Handle"] in products:
                raise ValueError("Duplicate primary product row: " + row["Handle"])
            products[row["Handle"]] = row
    active = {key: value for key, value in products.items()
              if value["Published"].lower() == "true" and value["Status"].lower() == "active"}
    reviews = {}
    if source_reviews is not None:
        manifest = json.loads(source_reviews.read_text(encoding="utf-8"))
        if manifest.get("version") != 1 or not isinstance(manifest.get("products"), dict):
            raise ValueError("Invalid manufacturer source-review manifest")
        reviews = manifest["products"]
    configurations, lookup, output, review = [], {}, {}, []
    tables_count = 0
    for handle, product in active.items():
        parser = TableParser()
        parser.feed(product["Body (HTML)"])
        product_ids, issues, found = set(), set(), False
        for table in parser.tables:
            headers = [re.sub(r"[^a-z]", "", cell.lower()) for cell in table[0]] if table else []
            if not {"make", "model", "engine"}.issubset(headers):
                continue
            found = True
            for cells in table[1:]:
                if len(cells) != len(headers):
                    issues.add("Uneven fitment row")
                    continue
                try:
                    records = records_for_row(dict(zip(headers, cells)))
                except ValueError as error:
                    issues.add(str(error))
                    continue
                for record in records:
                    key = json.dumps(record, sort_keys=True)
                    if key not in lookup:
                        lookup[key] = len(configurations)
                        configurations.append(record)
                    product_ids.add(lookup[key])
        if found:
            tables_count += 1
        else:
            issues.add("No explicit fitment table")
        restrictions = bool(re.search(r"does not fit|will not fit|not compatible|not for|exclud|except|warning|stock turbo", product["Body (HTML)"], re.I))
        if restrictions:
            issues.add("Description contains restrictions; confirm installation notes")
        output[handle] = {"records": sorted(product_ids), "review": bool(issues) or restrictions}
        if handle in reviews:
            try:
                output[handle]["sourceReview"] = source_review(reviews[handle], product, [configurations[index] for index in sorted(product_ids)])
            except (ValueError, TypeError, AttributeError) as error:
                issues.add("Manufacturer source review invalid: " + str(error))
                output[handle]["review"] = True
        if issues:
            review.append({"handle": handle, "title": product["Title"], "issues": sorted(issues)})
    meta = {"source": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "exportProducts": len(products), "publishedProducts": len(active), "productsWithTables": tables_count,
            "productsWithRecords": sum(bool(value["records"]) for value in output.values()),
            "excludedUnpublishedProducts": len(products) - len(active), "reviewProducts": len(review),
            "configurations": len(configurations), "yearRangesProvided": False,
            "sourceReviewedProducts": sum("sourceReview" in product for product in output.values())}
    return {"version": 1, "meta": meta, "vehicles": configurations, "products": output}, review


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--source-reviews", type=Path)
    args = parser.parse_args()
    reviews = args.source_reviews or args.root / "data" / "fitment-source-reviews.json"
    if args.source_reviews and not reviews.is_file():
        parser.error("The supplied source-review file does not exist")
    data, review = extract(args.source, reviews if reviews.is_file() else None)
    assets = args.root / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=True, separators=(",", ":"))
    (assets / "fitment-data.js").write_text("window.AEFitmentData = " + payload + ";\n", encoding="utf-8")
    report = args.root / "FITMENT-IMPORT.md"
    lines = ["# Fitment Import", "", "Source: `" + args.source.name + "`.", "",
             "Only published, active products and explicit description-table rows are included. Prices, costs, inventory, image URLs, and raw descriptions are not exported to the fitment asset.", "",
             "Model-year ranges are not supplied. Listed matches require year and installation-note confirmation; they are not a fitment guarantee.", "",
             "```json", json.dumps(data["meta"], indent=2), "```", "", "## Manufacturer Source Reviews", "",
             "Source reviews cover exact model/engine rows and matching part numbers only, never model years or a physical-fit guarantee. Invalid or changed source mappings are flagged for review.", ""]
    lines += ["- `" + handle + "`: [" + product["sourceReview"]["supplier"] + "](" + product["sourceReview"]["url"] + "), reviewed " + product["sourceReview"]["reviewedAt"]
              for handle, product in data["products"].items() if "sourceReview" in product]
    lines += ["", "## Needs Review", ""]
    lines += ["- `" + item["handle"] + "`: " + "; ".join(item["issues"]) for item in review]
    report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({**data["meta"], "configurations": len(data["vehicles"]), "reviewProducts": len(review)}, indent=2))


if __name__ == "__main__":
    main()
