import io
import zipfile

from app.extract import read_file
from app.review import load_rows, reset, snapshot


def test_csv_rows_keep_work_and_rate():
    raw = "work,unit,qty,rate\nExcavation by excavator,m3,10,12.5\nBlinding concrete,m3,2,100\n".encode()
    rows, kind = read_file("tender.csv", raw)
    assert kind == "csv"
    assert rows[0]["name"].startswith("Excavation")
    assert str(rows[0]["rate"]) == "12.5"
    assert len(rows) == 2


def test_xlsx_and_review_load():
    shared = """<?xml version="1.0" encoding="UTF-8"?>
    <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t>work</t></si><si><t>qty</t></si><si><t>Excavation by excavator</t></si><si><t>rate</t></si>
    </sst>"""
    sheet = """<?xml version="1.0" encoding="UTF-8"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>3</v></c></row>
        <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>8</v></c><c r="C2"><v>15.5</v></c></row>
      </sheetData>
    </worksheet>"""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as book:
        book.writestr("xl/sharedStrings.xml", shared)
        book.writestr("xl/worksheets/sheet1.xml", sheet)
    rows, kind = read_file("book.xlsx", buffer.getvalue())
    assert kind == "xlsx"
    assert str(rows[0]["qty"]) == "8"
    load_rows("book.xlsx", rows)
    try:
        snap = snapshot()
        assert snap["source"] == "upload"
        assert snap["title_en"] == "book.xlsx"
        assert snap["lines"][0]["name_en"].startswith("Excavation")
    finally:
        reset()
