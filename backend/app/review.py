"""Assemble one review. State lives in memory for this local checker."""

import re

from app.catalog import (
    INDEX_FACTOR,
    NORMS,
    PRICE_BOOK,
    TENDER_PERIOD,
    build_review_lines,
    norm_by_code,
    reference_rate,
)
from app.pricing import D, money, percent
from app.scoring import score_lines

def _sample_project():
    return {
        "id": "sample",
        "title_en": "Sample tender: earthwork and concrete",
        "title_az": "Nümunə tender: torpaq və beton",
        "source": "sample",
        "kind": "sample",
        "lines": build_review_lines(),
        "decision": None,
    }


_projects = {"sample": _sample_project()}
_order = ["sample"]
_active = "sample"


def _current():
    return _projects[_active]


def reset():
    global _active
    _projects["sample"] = _sample_project()
    _active = "sample"


def _tokens(text):
    return set(re.findall(r"[0-9a-zəöüğışç]+", text.lower()))


def _suggest(name):
    words = _tokens(name)
    best = NORMS[0]
    best_score = -1
    for norm in NORMS:
        score = len(words & _tokens(f"{norm['name_en']} {norm['name_az']} {norm['code']}"))
        if score > best_score:
            best = norm
            best_score = score
    return best, best_score


def load_rows(filename, parsed, kind=""):
    global _active
    built = []
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else "file"
    for index, item in enumerate(parsed, start=1):
        exact = norm_by_code(item.get("code") or "")
        if exact is not None:
            norm = exact
            match = "confirmed"
            included = item.get("rate") is not None
            confidence = "1"
        else:
            norm, score = _suggest(item["name"])
            match = "needs_review"
            included = False
            confidence = "0.55" if score else "0.2"
        rate = item.get("rate")
        amount = item.get("amount")
        built.append({
            "id": f"u{index}",
            "qty": str(item.get("qty") or "1"),
            "contractor_rate": None if rate is None else str(rate),
            "contractor_amount": None if amount is None else str(amount),
            "match": match,
            "confidence": confidence,
            "suggested_code": norm["code"],
            "included": included,
            "gap": rate is None,
            "source_name": item["name"],
            "unit": item.get("unit") or "",
        })
    project_id = f"p{len(_projects)}"
    _projects[project_id] = {
        "id": project_id,
        "title_en": filename,
        "title_az": filename,
        "source": "upload",
        "kind": kind or suffix,
        "lines": built,
        "decision": None,
    }
    _order.insert(0, project_id)
    _active = project_id


def _flag(row, reference_amount, computed_amount):
    if row.get("gap") or row["contractor_rate"] is None:
        return "gap", None
    stated = D(row["contractor_amount"])
    if abs(stated - D(computed_amount)) > D("0.05"):
        return "arithmetic", percent((stated - D(reference_amount)) / D(reference_amount) * 100)
    deviation = percent((stated - D(reference_amount)) / D(reference_amount) * 100)
    if deviation <= -15:
        return "under", deviation
    if deviation >= 15:
        return "over", deviation
    return "close", deviation


def _present(row):
    norm = norm_by_code(row["suggested_code"])
    rate = reference_rate(norm)
    qty = D(row["qty"])
    reference_amount = money(rate * qty)
    computed_amount = None
    if row["contractor_rate"] is not None:
        computed_amount = money(D(row["contractor_rate"]) * qty)
    flag, deviation = _flag(row, reference_amount, computed_amount if computed_amount is not None else reference_amount)
    return {
        "id": row["id"],
        "code": row["suggested_code"],
        "name_az": row.get("source_name") or norm["name_az"],
        "name_en": row.get("source_name") or norm["name_en"],
        "section_az": norm["section_az"],
        "section_en": norm["section_en"],
        "unit": row.get("unit") or norm["unit"],
        "qty": format(D(row["qty"]), "f"),
        "contractor_rate": None if row["contractor_rate"] is None else str(money(row["contractor_rate"])),
        "contractor_amount": None if row["contractor_amount"] is None else str(money(row["contractor_amount"])),
        "computed_amount": None if computed_amount is None else str(computed_amount),
        "reference_rate": str(rate),
        "reference_amount": str(reference_amount),
        "deviation_pct": None if deviation is None else str(deviation),
        "flag": flag,
        "match": row["match"],
        "confidence": row["confidence"],
        "included": row["included"] and row["match"] == "confirmed",
        "gap": bool(row.get("gap")),
    }


def list_projects():
    items = []
    for project_id in _order:
        project = _projects[project_id]
        presented = [_present(row) for row in project["lines"]]
        scored = score_lines(presented)
        items.append({
            "id": project["id"],
            "title_en": project["title_en"],
            "title_az": project["title_az"],
            "source": project["source"],
            "kind": project["kind"],
            "lines": len(presented),
            "waiting": sum(1 for line in presented if line["match"] == "needs_review"),
            "light": scored["light"],
            "deviation_pct": None if scored["deviation_pct"] is None else str(scored["deviation_pct"]),
            "decision": "" if not project["decision"] else project["decision"]["choice"],
            "active": project_id == _active,
        })
    return items


def open_project(project_id):
    global _active
    if project_id not in _projects:
        return False
    _active = project_id
    return True


def snapshot(project_id=None):
    project = _projects.get(project_id or _active)
    if project is None:
        return None
    presented = [_present(row) for row in project["lines"]]
    scored = score_lines(presented)
    return {
        "id": project["id"],
        "title_az": project["title_az"],
        "title_en": project["title_en"],
        "catalog": "sample",
        "source": project["source"],
        "kind": project["kind"],
        "projects": list_projects(),
        "price_book": PRICE_BOOK,
        "tender_period": TENDER_PERIOD,
        "index_factor": INDEX_FACTOR,
        "notice_az": (
            "Sətirlər fayldan oxunub. " if project["source"] == "upload" else ""
        ) + "Nümunə kataloqu. Rəsmi FHN qiyməti yüklənməyib. İndeks nümunədir və Dövlət Statistika Komitəsinin rəqəmi deyil.",
        "notice_en": (
            "Lines were read from the file. " if project["source"] == "upload" else ""
        ) + "Sample catalog. Official FHN prices are not loaded. The index is a sample and is not a State Statistics Committee figure.",
        "lines": presented,
        "score": {
            "light": scored["light"],
            "contractor_total": str(scored["contractor_total"]),
            "reference_total": str(scored["reference_total"]),
            "deviation_pct": None if scored["deviation_pct"] is None else str(scored["deviation_pct"]),
            "sentence_az": scored["sentence_az"],
            "sentence_en": scored["sentence_en"],
        },
        "decision": project["decision"],
        "norm_choices": [
            {"code": norm["code"], "name_az": norm["name_az"], "name_en": norm["name_en"]}
            for norm in NORMS
        ],
    }


def confirm(line_id, code, project_id=None):
    if project_id and not open_project(project_id):
        return False
    if norm_by_code(code) is None:
        return False
    for row in _current()["lines"]:
        if row["id"] == line_id and not row.get("gap"):
            row["suggested_code"] = code
            row["match"] = "confirmed"
            row["included"] = True
            row["confidence"] = "1"
            return True
    return False


def set_gap(line_id, required, project_id=None):
    if project_id and not open_project(project_id):
        return False
    for row in _current()["lines"]:
        if row["id"] == line_id and row.get("gap"):
            row["included"] = required
            return True
    return False


def decide(choice, note, project_id=None):
    if project_id and not open_project(project_id):
        return False
    if choice not in {"accept", "query", "reject"}:
        return False
    _current()["decision"] = {"choice": choice, "note": note or ""}
    return True


def report_csv(project_id):
    snap = snapshot(project_id)
    if snap is None:
        return None
    import csv
    import io
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["work", "unit", "qty", "contractor_rate", "reference_rate", "deviation_pct", "status", "match"])
    for line in snap["lines"]:
        writer.writerow([
            line["name_en"], line["unit"], line["qty"], line["contractor_rate"] or "",
            line["reference_rate"], line["deviation_pct"] or "", line["flag"], line["match"],
        ])
    return buffer.getvalue()


def report_text(project_id):
    snap = snapshot(project_id)
    if snap is None:
        return None
    decision = snap["decision"]["choice"] if snap["decision"] else "none"
    note = snap["decision"]["note"] if snap["decision"] else ""
    lines = [
        "Smeta Yoxlama",
        snap["title_en"],
        snap["notice_en"],
        "",
        f"Contractor total: {snap['score']['contractor_total']}",
        f"Reference total: {snap['score']['reference_total']}",
        f"Difference: {snap['score']['deviation_pct'] or ''}",
        f"Risk: {snap['score']['light']}",
        snap["score"]["sentence_en"],
        snap["score"]["sentence_az"],
        f"Decision: {decision}",
        f"Note: {note}",
        "",
        "Lines",
    ]
    for line in snap["lines"]:
        lines.append(
            f"{line['name_en']} | {line['unit']} | {line['qty']} | {line['contractor_rate'] or ''} | {line['reference_rate']} | {line['deviation_pct'] or ''} | {line['flag']}"
        )
    return "\n".join(lines) + "\n"
