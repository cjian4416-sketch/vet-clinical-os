#!/usr/bin/env python3
"""Builds browser-readable data.js from local reviewed and intake data."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cases = json.loads((ROOT / "data" / "cases.json").read_text(encoding="utf-8"))
intake_path = ROOT / "data" / "pubmed-intake.json"
intake = json.loads(intake_path.read_text(encoding="utf-8")) if intake_path.exists() else {"records": [], "updated_at": None}
payload = {"catalog": cases, "intake": intake}
(ROOT / "data.js").write_text("window.VET_CLINICAL_DATA = " + json.dumps(payload, ensure_ascii=False) + ";\n", encoding="utf-8")
print("Built data.js")
