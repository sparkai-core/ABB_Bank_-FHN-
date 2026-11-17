"""Read a tender file into work lines. Prices stay a later step."""

import csv
import io
import re
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation

from pypdf import PdfReader

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

HEADERS = {
    "work": {"work", "name", "description", "item", "is", "iş", "tesvir", "təsvir", "ad", "наименование"},
    "unit": {"unit", "vahid", "ed", "ölçü", "olcu", "ед"},
    "qty": {"qty", "quantity", "miqdar", "miq", "кол"},
    "rate": {"rate", "price", "qiymet", "qiymət", "vahidqiymet", "цена"},
    "amount": {"amount", "sum", "mebleg", "məbləğ", "cemi", "cəmi", "сумма"},
    "code": {"code", "kod", "шифр", "desn"},
}


def read_file(filename, data):
    kind = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if kind == "csv":
        table = _csv_table(_text(data))
    elif kind == "txt":
        table = _csv_table(_text(data), prefer_plain=True)
    elif kind == "xlsx":
        table = _xlsx_table(data)
    elif kind == "docx":
        table = _docx_table(data)
    elif kind == "pdf":
        table = _csv_table(_pdf_text(data), prefer_plain=True)
    else:
        raise ValueError("Use a CSV, Excel, PDF, Word, or text file.")
    rows = _rows(table)
    if not rows:
        raise ValueError("No lines of work were found in this file.")
    return rows, kind


def _text(data):
    for encoding in ("utf-8-sig", "utf-8", "cp1254", "cp1251"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def _csv_table(text, prefer_plain=False):
    sample = text[:2000]
    delimiter = "\t" if sample.count("\t") > sample.count(";") else ";" if sample.count(";") > sample.count(",") else ","
    if prefer_plain and sample.count(delimiter) < 1:
        return [[line.strip()] for line in text.splitlines() if line.strip()]
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    return [row for row in reader if any(cell.strip() for cell in row)]


def _xlsx_table(data):
    try:
        book = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as err:
        raise ValueError("This Excel file could not be opened.") from err
    names = set(book.namelist())
    shared = []
    if "xl/sharedStrings.xml" in names:
        root = ET.fromstring(book.read("xl/sharedStrings.xml"))
        for item in root.findall(f"{{{MAIN}}}si"):
            shared.append("".join(node.text or "" for node in item.iter(f"{{{MAIN}}}t")))
    sheet_name = next((name for name in names if name.startswith("xl/worksheets/sheet")), "")
    if not sheet_name:
        raise ValueError("This Excel file has no sheet.")
    root = ET.fromstring(book.read(sheet_name))
    table = []
    for row in root.findall(f"{{{MAIN}}}sheetData/{{{MAIN}}}row"):
        values = []
        for cell in row.findall(f"{{{MAIN}}}c"):
            column = "".join(char for char in cell.attrib.get("r", "") if char.isalpha())
            index = 0
            for char in column:
                index = index * 26 + ord(char.upper()) - 64
            while len(values) < max(index, 1):
                values.append("")
            kind = cell.attrib.get("t")
            value = cell.find(f"{{{MAIN}}}v")
            text = value.text if value is not None and value.text else ""
            if kind == "s" and text.isdigit():
                text = shared[int(text)] if int(text) < len(shared) else text
            elif kind == "inlineStr":
                text = "".join(node.text or "" for node in cell.iter(f"{{{MAIN}}}t"))
            values[index - 1] = text
        if any(str(item).strip() for item in values):
            table.append(values)
    return table


def _docx_table(data):
    try:
        book = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as err:
        raise ValueError("This Word file could not be opened.") from err
    if "word/document.xml" not in book.namelist():
        raise ValueError("This Word file has no text.")
    root = ET.fromstring(book.read("word/document.xml"))
    lines = []
    for paragraph in root.iter(f"{{{WORD}}}p"):
        line = "".join(node.text or "" for node in paragraph.iter(f"{{{WORD}}}t")).strip()
        if line:
            lines.append(line)
    return _csv_table("\n".join(lines), prefer_plain=True)


def _pdf_text(data):
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as err:
        raise ValueError("This PDF could not be opened.") from err
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    if not text.strip():
        raise ValueError("This PDF has no text layer. A scanned page needs a text file or a spreadsheet.")
    return text


def _key(cell):
    return re.sub(r"[^0-9a-zəöüğışç]", "", str(cell).strip().lower())


def _number(value):
    text = str(value).strip().replace(" ", "").replace("\u00a0", "")
    if not text or text in {"-", ".", ","}:
        return None
    if text.count(",") == 1 and "." not in text:
        text = text.replace(",", ".")
    else:
        text = text.replace(",", "")
    try:
        return Decimal(text)
    except InvalidOperation:
        return None


def _rows(table):
    if not table:
        return []
    header_map = {}
    start = 0
    for column, cell in enumerate(table[0]):
        key = _key(cell)
        for field, names in HEADERS.items():
            if key in names:
                header_map[field] = column
    if len(header_map) >= 2:
        start = 1
    rows = []
    for raw in table[start:]:
        cells = [str(cell).strip() for cell in raw]
        if header_map:
            work = cells[header_map["work"]] if "work" in header_map and header_map["work"] < len(cells) else ""
            unit = cells[header_map["unit"]] if "unit" in header_map and header_map["unit"] < len(cells) else ""
            qty = _number(cells[header_map["qty"]]) if "qty" in header_map and header_map["qty"] < len(cells) else None
            rate = _number(cells[header_map["rate"]]) if "rate" in header_map and header_map["rate"] < len(cells) else None
            amount = _number(cells[header_map["amount"]]) if "amount" in header_map and header_map["amount"] < len(cells) else None
            code = cells[header_map["code"]] if "code" in header_map and header_map["code"] < len(cells) else ""
        else:
            texts = [cell for cell in cells if cell and _number(cell) is None]
            numbers = [_number(cell) for cell in cells]
            numbers = [number for number in numbers if number is not None]
            work = texts[0] if texts else ""
            unit = texts[1] if len(texts) > 1 and len(texts[1]) <= 12 else ""
            qty = numbers[0] if numbers else None
            rate = numbers[1] if len(numbers) > 1 else None
            amount = numbers[2] if len(numbers) > 2 else None
            code = ""
        if not work or _key(work) in HEADERS["work"]:
            continue
        if qty is None:
            qty = Decimal("1")
        if amount is None and rate is not None:
            amount = rate * qty
        rows.append({
            "name": work,
            "unit": unit,
            "qty": qty,
            "rate": rate,
            "amount": amount,
            "code": code.strip(),
        })
    return rows
