#!/usr/bin/env python3
"""
GothicMynx masterlist build script.

Pulls the Reddit and Patreon catalogs straight from their published
Google Sheet CSV URLs, normalizes everything, merges cross-posted audios
(same title on both platforms -> one card with both links), and writes a
single audios.json the website consumes at runtime.

Usage:
    python build.py

Config: set the two CSV URLs below (or via the REDDIT_CSV_URL /
PATREON_CSV_URL environment variables, which the GitHub Action uses).

To get a CSV URL: in the Google Sheet, File -> Share -> Publish to web ->
choose the sheet/tab -> Comma-separated values (.csv) -> Publish, then copy
the link it gives you.
"""

import csv
import io
import json
import os
import re
import sys
from datetime import datetime, date

import requests

# ----------------------------------------------------------------------
# Config  (env vars take priority so the Action can inject them)
# ----------------------------------------------------------------------
REDDIT_CSV_URL = os.environ.get(
    "REDDIT_CSV_URL",
    "PASTE_REDDIT_PUBLISHED_CSV_URL_HERE",
)
PATREON_CSV_URL = os.environ.get(
    "PATREON_CSV_URL",
    "PASTE_PATREON_PUBLISHED_CSV_URL_HERE",
)
OUTPUT_JSON = "audios.json"

COL = {
    "title": "Title",
    "persona": "1- Gothix/Mynx - 0",
    "category": "Category",
    "audience": "Audience",
    "tags": "Tags",
    "date": "Date",
    "duration": "Duration",
    "synopsis": "Synopsis",
    "writer": "Writer",
    "script": "Script link",
    "reddit_link": "Reddit Link",
    "patreon_link": "Patreon Link",
    "collab": "Collab Partner 1",
    "editor": "Editor",
}

PLACEHOLDERS = {"", "n/a", "na", "none", "-", "tbd"}
PT_MONTHS = {"jan": "01", "fev": "02", "mar": "03", "abr": "04", "mai": "05",
             "jun": "06", "jul": "07", "ago": "08", "set": "09", "out": "10",
             "nov": "11", "dez": "12"}


def clean(val):
    return "" if str(val).strip().lower() in PLACEHOLDERS else str(val).strip()


def to_iso(v):
    s = clean(v)
    if not s:
        return ""
    m = re.match(r"^(\d{1,2})\s+de\s+([a-zçãéê\.]+)\s+de\s+(\d{4})$", s, re.IGNORECASE)
    if m:
        d = int(m.group(1)); mon = m.group(2).lower().strip(".")[:3].replace("ç", "c")
        mm = PT_MONTHS.get(mon)
        if mm:
            return f"{int(m.group(3)):04d}-{mm}-{d:02d}"
    if "/" in s:
        try:
            d, mo, y = s.split("/")
            return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
        except ValueError:
            return s
    return s.split(" ")[0]


def parse_duration(v):
    s = clean(v)
    if not s:
        return ""
    parts = s.split(":")
    try:
        nums = [int(float(p)) for p in parts]
    except ValueError:
        return s
    if len(nums) == 2:
        return f"{nums[0]}:{nums[1]:02d}"
    if len(nums) == 3:
        if nums[2] == 0:
            return f"{nums[0]}:{nums[1]:02d}"
        return f"{nums[0]}:{nums[1]:02d}:{nums[2]:02d}"
    return s


def split_tags(raw):
    s = clean(raw)
    if not s:
        return []
    brackets = re.findall(r"\[([^\]]+)\]", s)
    parts = brackets if brackets else s.replace(";", ",").split(",")
    out, seen = [], set()
    for p in parts:
        t = p.strip().strip(",").strip()
        if t and t.lower() not in seen:
            out.append(t); seen.add(t.lower())
    return out


def norm_key(title):
    t = (title or "").strip().lower()
    t = re.sub(r"\s+", " ", t)
    return t.strip(" .!?,;:\"'")


def persona_label(v):
    s = clean(v)
    if s in ("1", "1.0"):
        return "Gothix"
    if s in ("0", "0.0"):
        return "Minxy"
    return None


def fetch_csv(url, label):
    if "PASTE_" in url:
        sys.exit(f"ERROR: {label} CSV URL is not set. Edit build.py or set the "
                 f"{label.upper()}_CSV_URL environment variable.")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return list(csv.DictReader(io.StringIO(resp.text)))


def read_rows(records, source):
    link_key = COL["reddit_link"] if source == "reddit" else COL["patreon_link"]
    rows = []
    for r in records:
        title = clean(r.get(COL["title"], ""))
        if not title:
            continue
        link = clean(r.get(link_key, ""))
        rows.append({
            "title": title,
            "persona": persona_label(r.get(COL["persona"], "")),
            "category": clean(r.get(COL["category"], "")),
            "audience": clean(r.get(COL["audience"], "")),
            "tags": split_tags(r.get(COL["tags"], "")),
            "date": to_iso(r.get(COL["date"], "")),
            "duration": parse_duration(r.get(COL["duration"], "")),
            "synopsis": clean(r.get(COL["synopsis"], "")),
            "writer": clean(r.get(COL["writer"], "")),
            "scriptLink": clean(r.get(COL["script"], "")),
            "redditLink": link if source == "reddit" else "",
            "patreonLink": link if source == "patreon" else "",
            "collabPartner": clean(r.get(COL["collab"], "")),
            "editor": clean(r.get(COL["editor"], "")),
        })
    return rows


def merge_into(base, extra):
    base["redditLink"] = base["redditLink"] or extra.get("redditLink", "")
    base["patreonLink"] = base["patreonLink"] or extra.get("patreonLink", "")
    for f in ("duration", "synopsis", "writer", "category", "audience", "persona",
              "scriptLink", "collabPartner", "editor"):
        if not clean(base.get(f) or "") and clean(extra.get(f) or ""):
            base[f] = extra[f]
    seen = {t.lower() for t in base["tags"]}
    for t in extra.get("tags", []):
        if t.lower() not in seen:
            base["tags"].append(t); seen.add(t.lower())


def build():
    reddit = read_rows(fetch_csv(REDDIT_CSV_URL, "reddit"), "reddit")
    patreon = read_rows(fetch_csv(PATREON_CSV_URL, "patreon"), "patreon")

    merged, order = {}, []

    def add(entry):
        k = norm_key(entry["title"])
        if k in merged:
            merge_into(merged[k], entry)
        else:
            merged[k] = entry; order.append(k)

    for e in reddit:
        add(e)
    for e in patreon:
        add(e)

    audios = []
    for k in order:
        e = merged[k]
        if not e["redditLink"] and not e["patreonLink"]:
            continue
        obj = {"title": e["title"]}
        if e["persona"]:
            obj["persona"] = e["persona"]
        if clean(e["category"]):
            obj["category"] = e["category"]
        if clean(e["audience"]):
            obj["audience"] = e["audience"]
        tags = list(e["tags"])
        aud = clean(e["audience"])
        if aud and aud.lower() not in [t.lower() for t in tags]:
            tags.insert(0, aud)
        if tags:
            obj["tags"] = tags
        if e["date"]:
            obj["date"] = e["date"]
        if clean(e["duration"]):
            obj["duration"] = e["duration"]
        if clean(e["synopsis"]):
            obj["synopsis"] = e["synopsis"]
        if clean(e["writer"]):
            obj["writer"] = e["writer"]
        if clean(e["scriptLink"]).lower().startswith("http"):
            obj["scriptLink"] = e["scriptLink"]
        if e["redditLink"]:
            obj["redditLink"] = e["redditLink"]
        if e["patreonLink"]:
            obj["patreonLink"] = e["patreonLink"]
        if clean(e.get("collabPartner", "")):
            obj["collabPartner"] = e["collabPartner"]
        if clean(e.get("editor", "")):
            obj["editor"] = e["editor"]
        audios.append(obj)

    audios.sort(key=lambda a: a.get("date", ""), reverse=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(audios, f, ensure_ascii=False, indent=2)

    both = sum(1 for a in audios if a.get("redditLink") and a.get("patreonLink"))
    r_only = sum(1 for a in audios if a.get("redditLink") and not a.get("patreonLink"))
    p_only = sum(1 for a in audios if a.get("patreonLink") and not a.get("redditLink"))
    cats = sorted({a.get("category", "Uncategorized") for a in audios})
    print(f"Reddit rows: {len(reddit)}  |  Patreon rows: {len(patreon)}")
    print(f"Merged unique audios: {len(audios)}  "
          f"(both: {both}, reddit-only: {r_only}, patreon-only: {p_only})")
    print(f"Categories: {cats}")
    print(f"Wrote {OUTPUT_JSON}")


if __name__ == "__main__":
    build()
