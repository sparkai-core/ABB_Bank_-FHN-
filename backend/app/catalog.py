"""Sample norms. Prices are fictional and must stay labeled as a sample."""

from app.pricing import money, unit_rate

# 2024 Q4 book bridged to a 2026 Q2 tender with a sample construction index.
# This is an illustration of the bridge, not a State Statistics Committee figure.
INDEX_FACTOR = "1.04"
PRICE_BOOK = "2024-Q4"
TENDER_PERIOD = "2026-Q2"

# Amounts are for one unit, before the index. Machinist wage is separate from the machine.
NORMS = [
    {
        "code": "01-01-001-01",
        "name_az": "Ekskavatorla torpaq qazılması",
        "name_en": "Excavation by excavator",
        "unit": "m³",
        "section_az": "Torpaq işləri",
        "section_en": "Earthwork",
        "labor": "2.86",
        "machinist": "1.51",
        "machine": "6.48",
        "material": "0",
    },
    {
        "code": "01-01-033-01",
        "name_az": "Qruntun sıxlaşdırılması",
        "name_en": "Compaction of fill",
        "unit": "m³",
        "section_az": "Torpaq işləri",
        "section_en": "Earthwork",
        "labor": "1.20",
        "machinist": "0.64",
        "machine": "3.10",
        "material": "0",
    },
    {
        "code": "01-01-012-01",
        "name_az": "Qazılmış qruntun daşınması",
        "name_en": "Disposal of excavated soil",
        "unit": "m³",
        "section_az": "Torpaq işləri",
        "section_en": "Earthwork",
        "labor": "0.40",
        "machinist": "0.90",
        "machine": "8.20",
        "material": "0",
    },
    {
        "code": "06-01-001-01",
        "name_az": "Əsasaltı beton",
        "name_en": "Blinding concrete",
        "unit": "m³",
        "section_az": "Beton",
        "section_en": "Concrete",
        "labor": "18.40",
        "machinist": "4.10",
        "machine": "12.00",
        "material": "62.50",
    },
]


def reference_rate(norm):
    return unit_rate(
        norm["labor"],
        norm["machinist"],
        norm["machine"],
        norm["material"],
        index_factor=INDEX_FACTOR,
    )


def norm_by_code(code):
    for norm in NORMS:
        if norm["code"] == code:
            return norm
    return None


def build_review_lines():
    """One contractor file. Numbers are a worked example, not a real tender."""
    rates = {norm["code"]: reference_rate(norm) for norm in NORMS}
    excavation = rates["01-01-001-01"]
    # About 30% under the indexed reference, on purpose, so the flag is visible.
    low_excavation = money(excavation * money("0.70") / money("1"))

    rows = [
        {
            "id": "l1",
            "code": "01-01-001-01",
            "qty": "1200",
            "contractor_rate": str(low_excavation),
            "contractor_amount": str(money(low_excavation * 1200)),
            "match": "needs_review",
            "confidence": "0.62",
            "suggested_code": "01-01-001-01",
            "included": False,
        },
        {
            "id": "l2",
            "code": "01-01-033-01",
            "qty": "400",
            "contractor_rate": "8.50",
            # 400 * 8.50 = 3,400. The file says 3,000. That is the arithmetic error.
            "contractor_amount": "3000.00",
            "match": "confirmed",
            "confidence": "0.98",
            "suggested_code": "01-01-033-01",
            "included": True,
        },
    ]
    # Disposal is in the earthwork section and absent from the contractor file.
    rows.append({
        "id": "gap-disposal",
        "code": "01-01-012-01",
        "qty": "900",
        "contractor_rate": None,
        "contractor_amount": None,
        "match": "confirmed",
        "confidence": "1",
        "suggested_code": "01-01-012-01",
        "included": True,
        "gap": True,
    })
    rows.append({
        "id": "l3",
        "code": "06-01-001-01",
        "qty": "80",
        "contractor_rate": "160.00",
        "contractor_amount": "12800.00",
        "match": "confirmed",
        "confidence": "0.95",
        "suggested_code": "06-01-001-01",
        "included": True,
    })
    return rows
