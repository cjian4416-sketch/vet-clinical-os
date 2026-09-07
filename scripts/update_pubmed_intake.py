#!/usr/bin/env python3
"""Fetch recent canine/feline clinical case-report metadata into the learning intake queue."""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "pubmed-intake.json"
QUERY = '("case reports"[Publication Type]) AND (dog OR canine OR cat OR feline) AND (veterinary OR animal)'
MAX_RESULTS = 40
KEEP_RECORDS = 80


def request_xml(endpoint: str, params: dict[str, str]) -> ET.Element:
    url = endpoint + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as response:
        return ET.fromstring(response.read())


def text(node: ET.Element | None) -> str:
    return " ".join(node.itertext()).strip() if node is not None else ""


def main() -> None:
    current = json.loads(TARGET.read_text(encoding="utf-8")) if TARGET.exists() else {"records": []}
    existing = {str(item.get("pmid")): item for item in current.get("records", [])}

    search = request_xml(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
        {"db": "pubmed", "term": QUERY, "retmax": str(MAX_RESULTS), "sort": "pub date", "retmode": "xml"},
    )
    pmids = [item.text for item in search.findall(".//IdList/Id") if item.text]
    if not pmids:
        raise RuntimeError("PubMed returned no records")

    fetched = request_xml(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
        {"db": "pubmed", "id": ",".join(pmids), "retmode": "xml"},
    )

    records = []
    for article in fetched.findall(".//PubmedArticle"):
        pmid = text(article.find(".//PMID"))
        article_node = article.find(".//Article")
        title = text(article_node.find("./ArticleTitle") if article_node is not None else None)
        abstract = " ".join(text(part) for part in article.findall(".//Abstract/AbstractText") if text(part))
        journal = text(article.find(".//Journal/Title"))
        date_node = article.find(".//ArticleDate") or article.find(".//PubDate")
        year = text(date_node.find("./Year") if date_node is not None else None)
        month = text(date_node.find("./Month") if date_node is not None else None)
        if not pmid or not title:
            continue
        prior = existing.get(pmid, {})
        records.append({
            "pmid": pmid,
            "title": title,
            "journal": journal,
            "publication_date": "-".join(value for value in (year, month) if value) or "日期待核对",
            "abstract": abstract or "PubMed 未提供摘要。",
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            "status": prior.get("status", "pending_review"),
            "review_note": prior.get(
                "review_note",
                "自动抓取的元数据线索；必须核对原文、物种、临床价值、影像授权和适用边界后才能进入训练池。",
            ),
        })

    # Keep existing reviewed metadata where still present, then newest fetched records.
    for pmid, old in existing.items():
        if pmid not in {item["pmid"] for item in records}:
            records.append(old)

    output = {
        "source": "PubMed E-utilities",
        "query": QUERY,
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "policy": "自动任务只更新待审核线索。任何病例必须完成结构化审核、来源核对和教学重构后，才可进入正式训练池。",
        "records": records[:KEEP_RECORDS],
    }
    TARGET.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {TARGET} with {len(output['records'])} records.")


if __name__ == "__main__":
    main()
