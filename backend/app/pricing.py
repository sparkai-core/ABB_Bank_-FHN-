"""Reference prices are computed here. The model never multiplies money."""

from decimal import Decimal, ROUND_HALF_UP

MONEY = Decimal("0.01")
PERCENT = Decimal("0.1")

# Cabinet Decision No. 150 of 25 May 2021, as updated by Decision No. 422.
# Percents of the wage fund (workers + machinists), not of the whole direct cost.
NORMS = {
    "construction": {"overhead": Decimal("0.90"), "profit": Decimal("0.52")},
    "repair": {"overhead": Decimal("0.80"), "profit": Decimal("0.40")},
    "commissioning": {"overhead": Decimal("0.55"), "profit": Decimal("0.32")},
    "restoration": {"overhead": Decimal("0.90"), "profit": Decimal("0.52")},
}


def D(value):
    return Decimal(str(value))


def money(value):
    return D(value).quantize(MONEY, rounding=ROUND_HALF_UP)


def percent(value):
    return D(value).quantize(PERCENT, rounding=ROUND_HALF_UP)


def unit_rate(labor, machinist, machine, material, work_type="construction", index_factor=1):
    """Return the reference unit rate for one norm.

    labor, machinist, machine and material are money amounts for one unit of work.
    Machine is the operating cost with the machinist wage already taken out.
    Overhead and profit apply only to the wage fund.
    index_factor bridges an older price book. 1 means the book year matches the tender.
    """
    rates = NORMS[work_type]
    wage_fund = D(labor) + D(machinist)
    direct = wage_fund + D(machine) + D(material)
    overhead = wage_fund * rates["overhead"]
    profit = wage_fund * rates["profit"]
    base = direct + overhead + profit
    return money(base * D(index_factor))
