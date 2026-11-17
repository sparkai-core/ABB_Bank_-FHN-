"""Traffic light from numbers the pricing code already stored."""

from decimal import Decimal

from app.pricing import D, money, percent


def score_lines(lines):
    """lines are included rows with deviation_pct (None for a gap) and flags."""
    included = [line for line in lines if line["included"]]
    contractor = money(sum((D(line["contractor_amount"] or 0) for line in included), Decimal("0")))
    reference = money(sum((D(line["reference_amount"] or 0) for line in included), Decimal("0")))
    deviation = None
    if reference != 0:
        deviation = percent((contractor - reference) / reference * 100)

    has_arithmetic = any(line["flag"] == "arithmetic" for line in included)
    has_gap = any(line["flag"] == "gap" for line in included)
    severe_under = any(
        line["flag"] == "under" and line["deviation_pct"] is not None and D(line["deviation_pct"]) <= -30
        for line in included
    )
    any_under = any(line["flag"] == "under" for line in included)

    if has_arithmetic or has_gap or severe_under or (deviation is not None and deviation <= -15):
        light = "red"
    elif any_under or (deviation is not None and deviation < -5) or (deviation is not None and deviation > 15):
        light = "amber"
    else:
        light = "green"

    return {
        "light": light,
        "contractor_total": contractor,
        "reference_total": reference,
        "deviation_pct": deviation,
        "sentence_az": _sentence(included, "az"),
        "sentence_en": _sentence(included, "en"),
    }


def _sentence(lines, lang):
    under = [
        line for line in lines
        if line["flag"] == "under" and line["deviation_pct"] is not None
    ]
    under.sort(key=lambda line: D(line["deviation_pct"]))
    parts = []
    if under:
        worst = under[0]
        name = worst["name_az"] if lang == "az" else worst["name_en"]
        pct = abs(D(worst["deviation_pct"]))
        shown = format(pct, "f").rstrip("0").rstrip(".")
        if lang == "az":
            parts.append(f"{name} istinad qiymətindən {shown}% aşağıdır.")
        else:
            parts.append(f"{name} is {shown}% under the reference price.")
    if any(line["flag"] == "gap" for line in lines):
        parts.append("Bir iş smetada yoxdur." if lang == "az" else "One item is missing from the estimate.")
    if any(line["flag"] == "arithmetic" for line in lines):
        parts.append("Bir sətirdə hesab səhvi var." if lang == "az" else "One line has an arithmetic error.")
    if not parts:
        return "Yoxlanılan sətirlər istinad qiymətinə yaxındır." if lang == "az" else "Checked lines sit close to the reference price."
    return " ".join(parts)
