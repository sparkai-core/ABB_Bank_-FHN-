from decimal import Decimal

from app.pricing import unit_rate
from app.scoring import score_lines


def test_construction_rate_uses_wage_fund_only_for_overhead_and_profit():
    # direct 50 + overhead 90% of 15 + profit 52% of 15 = 71.30
    rate = unit_rate(labor="10", machinist="5", machine="20", material="15")
    assert rate == Decimal("71.30")


def test_index_bridge_is_applied_after_the_norm_rate():
    rate = unit_rate(labor="10", machinist="5", machine="20", material="15", index_factor="1.04")
    assert rate == Decimal("74.15")


def test_repair_uses_the_lower_percents():
    rate = unit_rate(labor="10", machinist="5", machine="20", material="15", work_type="repair")
    # overhead 12.00 + profit 6.00 + direct 50 = 68.00
    assert rate == Decimal("68.00")


def test_severe_underprice_turns_the_light_red():
    scored = score_lines([
        {
            "included": True,
            "flag": "under",
            "deviation_pct": "-30.0",
            "contractor_amount": "70",
            "reference_amount": "100",
            "name_az": "Torpaq işləri",
            "name_en": "Earthwork",
        }
    ])
    assert scored["light"] == "red"
    assert "30" in scored["sentence_az"]


def test_close_lines_stay_green():
    scored = score_lines([
        {
            "included": True,
            "flag": "close",
            "deviation_pct": "-2.0",
            "contractor_amount": "98",
            "reference_amount": "100",
            "name_az": "Beton",
            "name_en": "Concrete",
        }
    ])
    assert scored["light"] == "green"


def test_arithmetic_error_turns_the_light_red():
    scored = score_lines([
        {
            "included": True,
            "flag": "arithmetic",
            "deviation_pct": "0",
            "contractor_amount": "100",
            "reference_amount": "100",
            "name_az": "Sıxlaşma",
            "name_en": "Compaction",
        }
    ])
    assert scored["light"] == "red"
    assert "hesab" in scored["sentence_az"]
