#!/usr/bin/env python3
"""Parse the 2019 Revised Constitution of FUNAABSU .docx into structured JSON.

Run:  python3 tools/parse_docx.py
Reads: ../2019 Revised Constitution of FUNAABSU.docx
Writes: ../data/constitution.json
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
APP_DIR = Path(__file__).resolve().parent.parent          # .../constitution-app
ROOT = APP_DIR.parent                                   # .../constitution  (docx lives here)
DOCX = ROOT / "2019 Revised Constitution of FUNAABSU.docx"
OUT = APP_DIR / "data" / "constitution.json"

WORD_TO_NUM = {
    "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5, "SIX": 6,
    "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10, "ELEVEN": 11,
    "TWELVE": 12, "THIRTEEN": 13, "FOURTEEN": 14, "FIFTEEN": 15,
    "SIXTEEN": 16, "SEVENTEEN": 17, "EIGHTEEN": 18, "NINETEEN": 19,
    "TWENTY": 20, "TWENTY-ONE": 21, "TWENTY-TWO": 22,
}

SECTION_RE = re.compile(r"^S\.?\s*(\d+)\s*(.*)$", re.IGNORECASE)
ARTICLE_RE = re.compile(r"^ARTICLE\s+([A-Z\- ]+?)\s*$")
# Strict sub-heading: "A. The President", "B. HALL SECRETARY"
SUBHEAD_RE = re.compile(r"^([A-RT-Z])\.\s+(.+)$")
# Bare all-caps short line that may be a sub-heading without any letter prefix
# (e.g. "MINISTER OF SPORTS", "DIRECTOR OF TREASURY"). The letter was lost in
# the Word export. Guard with length and clause-keyword filters to avoid
# false positives.
_UPPER_SUBHEAD_RE = re.compile(r"^[A-Z][A-Z, '&/.–-]{2,55}$")
_UPPER_CLAUSE_PREFIXES = {
    "SHALL", "MUST", "ALL", "NO", "EVERY",
    "THE", "THERE",
}
# Known role/title words used to decide whether a glued leading letter (e.g.
# the "C" of "CMINISTER OF WELFARE") should be peeled off to become a label.
TITLE_WORDS = {
    "MINISTER", "DIRECTOR", "OFFICER", "OFFICERS", "CHAIRMAN", "CHAIRPERSON",
    "SECRETARY", "MEMBER", "MEMBERS", "COMMITTEE", "COMMITTEES", "COUNCIL",
    "HALL", "SENATE", "PRESIDENT", "VICE-PRESIDENT", "GENERAL", "ASSISTANT",
    "PUBLIC", "TREASURY", "FINANCE", "WELFARE", "SPORTS", "SOCIALS",
    "INFORMATION", "BUSINESS", "ELIGIBILITY", "FUNCTIONS", "APPOINTMENT",
    "STANDING", "AD-HOC", "ADVISORY", "ORDINARY", "MEMBERSHIP",
}


def _peel_glued_letter(line, expected):
    """Try to peel a leading continuation letter glued to a title.
    E.g. expected='C', line='CGeneral Secretary' -> ('C', 'General Secretary').
    Peels when the first char equals the expected letter AND the next char is
    an uppercase letter (so the remainder still starts a title word). Works for
    both "CGeneral Secretary" (mixed) and "CMINISTER OF WELFARE" (all caps).
    """
    if not line or len(line) < 2 or line[0] != expected:
        return None
    nxt = line[1]
    if not (nxt.isalpha() and nxt.isupper()):
        return None  # not glued to an uppercase title word
    rest = line[1:].strip()
    words = rest.split()
    first = words[0].rstrip(",.;:-").upper() if words else ""
    if first in TITLE_WORDS:
        return (expected, rest)
    return None


def detect_subhead(line, expected_label, section_re):
    """Return (label, title) if `line` is a sub-heading, else None.
    Tries, in order: strict "A. …", glued "AMINISTER …", bare all-caps title.
    `expected_label` is the next expected letter in the A,B,C… sequence, used
    to validate the glued variant so random uppercase words aren't mislabelled.
    """
    if section_re.match(line):
        return None
    m = SUBHEAD_RE.match(line)
    if m:
        return (m.group(1), m.group(2).strip())
    # Glued letter? Only accept if it matches the expected continuation letter.
    glued = _peel_glued_letter(line, expected_label)
    if glued:
        return glued
    # Bare all-caps title (letter lost entirely).
    if _UPPER_SUBHEAD_RE.match(line):
        first = line.split()[0].rstrip(",.;:-").upper()
        if first in _UPPER_CLAUSE_PREFIXES:
            return None
        return ("", line)
    return None


def paragraphs():
    with zipfile.ZipFile(DOCX) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    out = []
    for p in root.iter(W + "p"):
        ppr = p.find(W + "pPr")
        style = ""
        if ppr is not None:
            ps = ppr.find(W + "pStyle")
            if ps is not None:
                style = ps.get(W + "val", "")
        line = "".join(t.text for t in p.iter(W + "t") if t.text).strip()
        if line:
            out.append({"style": style, "text": line})
    return out


def is_anthem_start(line):
    up = line.upper()
    return up in ("FUNAAB STUDENT UNION ANTHEM", "FUNAAB ANTHEM", "NIGERIAN NATIONAL ANTHEM")


def split_title_body(rest):
    rest = rest.strip()
    if ":" in rest:
        t, b = rest.split(":", 1)
        return t.strip(), b.strip()
    # Look ahead for the start of a Title-case word (uppercase + lowercase),
    # which marks where the body begins (e.g. "...MEMBERSHIPAll FEC…" →
    # title "…MEMBERSHIP", body "All FEC…"). Fall back to end-of-string.
    m = re.match(r"^([A-Z0-9,/&\s()\.'-]+?)(?=[A-Z][a-z]|$)", rest)
    if m and len(m.group(1).strip()) > 2:
        head = m.group(1).strip()
        return head, rest[len(m.group(1)):].strip()
    return "", rest


def main():
    paras = paragraphs()
    data = {
        "meta": {
            "title": "FUNAABSU Constitution",
            "fullTitle": "The 2019 Revised Constitution of FUNAABSU",
            "subtitle": "Federal University of Agriculture, Abeokuta Student Union",
            "version": "2019 Revised Edition",
        },
        "preamble": {"title": "Preamble", "clauses": []},
        "articles": [],
        "appendices": [],
        "anthems": [],
        "signatures": [],
        "bills": [],
    }

    i = 0
    n = len(paras)
    while i < n and paras[i]["text"].upper() != "PREAMBLE":
        i += 1
    i += 1
    while i < n and not ARTICLE_RE.match(paras[i]["text"].upper()):
        data["preamble"]["clauses"].append(paras[i]["text"])
        i += 1

    cur_article = None
    cur_section = None
    collecting_intro = False

    def flush_section():
        nonlocal cur_section
        if cur_article and cur_section:
            cur_article["sections"].append(cur_section)
        cur_section = None

    def flush_article():
        nonlocal cur_article
        flush_section()
        if cur_article:
            # fall back: no distinct title -> use first section's title
            if not cur_article["title"] and cur_article["sections"]:
                cur_article["title"] = cur_article["sections"][0]["title"]
            data["articles"].append(cur_article)
        cur_article = None

    while i < n:
        up = paras[i]["text"].upper()
        m_art = ARTICLE_RE.match(up)
        if m_art:
            word = m_art.group(1).strip()
            num = WORD_TO_NUM.get(word)
            flush_article()
            nxt = paras[i + 1]["text"] if i + 1 < n else ""
            if SECTION_RE.match(nxt):
                # no separate title line: a section header follows immediately
                title = ""
                i += 1
            else:
                title = nxt
                i += 2
            cur_article = {
                "number": num or 0,
                "word": word,
                "title": title,
                "intro": [],
                "sections": [],
            }
            cur_section = None
            collecting_intro = True
            continue
        sm = SECTION_RE.match(paras[i]["text"])
        if sm and cur_article is not None:
            flush_section()
            num = int(sm.group(1))
            title, body = split_title_body(sm.group(2))
            cur_section = {"number": num, "title": title, "text": body, "subsections": [], "clauses": []}
            collecting_intro = False
            i += 1
            continue
        # Detect lettered sub-heading inside the current section.
        # `expected` keeps the A→B→C… chain honest so a random uppercase word
        # (like a clause starting with "All…") isn't mislabelled.
        if cur_section is not None:
            subs = cur_section["subsections"]
            if subs and subs[-1]["label"]:
                expected = chr(ord(subs[-1]["label"]) + 1)
            else:
                expected = "A"
            sub = detect_subhead(paras[i]["text"], expected, SECTION_RE)
            if sub:
                label, sub_title = sub
                subs.append({"label": label, "title": sub_title, "clauses": []})
                i += 1
                continue
        if cur_article is not None:
            if cur_section is not None:
                # attribute the clause to the current subsection if one is active
                if cur_section["subsections"]:
                    cur_section["subsections"][-1]["clauses"].append(paras[i]["text"])
                else:
                    cur_section["clauses"].append(paras[i]["text"])
            elif collecting_intro:
                cur_article["intro"].append(paras[i]["text"])
        i += 1
    flush_article()

    last_art_idx = 0
    for idx, p in enumerate(paras):
        if ARTICLE_RE.match(p["text"].upper()):
            last_art_idx = idx
    j = last_art_idx + 1
    while j < n and not paras[j]["text"].upper().startswith("APPENDIX") \
            and not is_anthem_start(paras[j]["text"]) \
            and not paras[j]["text"].upper().startswith("THIS 2019") \
            and not paras[j]["text"].upper().startswith("PRESIDENTIAL ASSENT"):
        j += 1

    while j < n:
        line = paras[j]["text"]
        up = line.upper()
        if up.startswith("APPENDIX"):
            k = j + 1
            buf = []
            while k < n and not paras[k]["text"].upper().startswith("APPENDIX") \
                    and not is_anthem_start(paras[k]["text"]):
                buf.append(paras[k]["text"])
                k += 1
            ap_title = buf[0] if buf else line
            ap_body = buf[1:]
            data["appendices"].append({
                "number": len(data["appendices"]) + 1,
                "label": line,
                "title": ap_title,
                "clauses": ap_body,
            })
            j = k
            continue
        if is_anthem_start(line):
            k = j + 1
            lines = []
            while k < n and not is_anthem_start(paras[k]["text"]) \
                    and not paras[k]["text"].upper().startswith("THIS 2019") \
                    and not paras[k]["text"].upper().startswith("PRESIDENTIAL ASSENT"):
                lines.append(paras[k]["text"])
                k += 1
            data["anthems"].append({"title": line, "lines": lines})
            j = k
            continue
        if up.startswith("THIS 2019") or up.startswith("PRESIDENTIAL ASSENT"):
            break
        j += 1

    while j < n:
        data["signatures"].append(paras[j]["text"])
        j += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print("wrote", OUT)
    print("articles:", len(data["articles"]))
    print("appendices:", len(data["appendices"]))
    print("anthems:", len(data["anthems"]))
    print("sig lines:", len(data["signatures"]))
    for a in data["articles"]:
        print(f"  Art {a['number']:>2} ({a['word']:<11}) sections={len(a['sections'])}  {a['title'][:60]}")


if __name__ == "__main__":
    main()