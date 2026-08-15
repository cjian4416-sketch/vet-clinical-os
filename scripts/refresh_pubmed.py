#!/usr/bin/env python3
"""Refreshes a metadata-only veterinary case-report intake queue from PubMed.

This script intentionally stores citation metadata and abstracts only; it does
not copy full articles. New records are 'pending_review' and cannot enter the
training pool until a qualified reviewer structures and approves them.
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "pubmed-intake.json"
TERM = '"case reports"[Publication Type] AND (dog OR canine OR cat OR feline) AND (veterinary OR animal)'
BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

def request(path: str, params: dict[str, str]) -> bytes:
    url = BASE + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "VetClinicalOS/1.0 (educational local tool)"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()

def text(node: ET.Element | None, default: str = "") -> str:
    return "".join(node.itertext()).strip() if node is not None else default

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max", type=int, default=20)
    args = parser.parse_args()
    ids = json.loads(request("/esearch.fcgi", {"db":"pubmed", "term":TERM, "retmode":"json", "sort":"pub_date", "retmax":str(args.max)}).decode("utf-8"))["esearchresult"]["idlist"]
    if not ids:
        raise SystemExit("PubMed returned no records")
    root = ET.fromstring(request("/efetch.fcgi", {"db":"pubmed", "id":",".join(ids), "retmode":"xml"}))
    records = []
    for article in root.findall(".//PubmedArticle"):
        pmid = text(article.find(".//PMID"))
        title = text(article.find(".//ArticleTitle"))
        abstract = " ".join(text(node) for node in article.findall(".//Abstract/AbstractText"))
        journal = text(article.find(".//Journal/Title"))
        pubdate = article.find(".//PubDate")
        date = "-".join(filter(None, [text(pubdate.find("Year")) if pubdate is not None else "", text(pubdate.find("Month")) if pubdate is not None else "", text(pubdate.find("Day")) if pubdate is not None else ""]))
        records.append({"pmid":pmid,"title":title,"journal":journal,"publication_date":date,"abstract":abstract,"url":f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/","status":"pending_review","review_note":"Metadata intake only. Validate species, clinical relevance, evidence and local applicability before training use."})
    payload = {"source":"PubMed E-utilities","query":TERM,"updated_at":datetime.now(timezone.utc).isoformat(),"policy":"Pending records are never used in daily training until manually structured and approved.","records":records}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {OUT} with {len(records)} pending-review records.")
    time.sleep(0.34)

if __name__ == "__main__":
    main()
