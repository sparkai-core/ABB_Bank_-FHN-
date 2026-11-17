import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "public" / "samples"
root.mkdir(parents=True, exist_ok=True)

earth = [
    ("01-01-001-01", "Excavation by excavator", "m3", 1200, 8.40),
    ("01-01-001-01", "Excavation for foundations", "m3", 860, 9.10),
    ("01-01-001-01", "Excavation for basement", "m3", 2400, 8.90),
    ("01-01-001-01", "Excavation for ramps", "m3", 320, 10.40),
    ("01-01-001-01", "Excavation for pits", "m3", 180, 11.20),
    ("01-01-021-01", "Trench excavation", "m3", 540, 12.40),
    ("01-01-021-01", "Service trench excavation", "m3", 310, 11.80),
    ("01-01-021-01", "Drainage trench", "m3", 260, 13.60),
    ("01-01-021-01", "Cable trench", "m3", 190, 12.90),
    ("01-01-021-01", "Trench beside retaining wall", "m3", 140, 14.20),
    ("01-01-028-01", "Manual excavation", "m3", 180, 14.20),
    ("01-01-028-01", "Manual excavation at pits", "m3", 95, 15.60),
    ("01-01-028-01", "Manual trim to formation", "m3", 70, 16.40),
    ("01-01-028-01", "Manual dig around services", "m3", 48, 18.00),
    ("01-01-033-01", "Compaction of fill", "m3", 400, 8.50),
    ("01-01-033-01", "Compaction under slabs", "m3", 260, 9.20),
    ("01-01-033-01", "Compaction in layers 200 mm", "m3", 510, 8.80),
    ("01-01-033-01", "Compaction behind walls", "m3", 120, 10.10),
    ("01-01-012-01", "Disposal of excavated soil", "m3", 900, 11.20),
    ("01-01-012-01", "Disposal off site 10 km", "m3", 640, 13.40),
    ("01-01-012-01", "Disposal of unsuitable fill", "m3", 280, 14.80),
    ("01-01-012-01", "Cart away surplus", "m3", 280, 12.00),
    ("01-01-041-01", "Backfill of excavated soil", "m3", 350, 9.10),
    ("01-01-041-01", "Backfill to trenches", "m3", 220, 8.70),
    ("01-01-041-01", "Backfill to foundations", "m3", 410, 9.40),
    ("01-01-055-01", "Gravel bedding", "m3", 140, 28.50),
    ("01-01-055-01", "Gravel under pipes", "m3", 80, 31.20),
    ("01-01-055-01", "Hardcore filling", "m3", 160, 27.40),
    ("01-01-055-01", "Hardcore to paths", "m3", 90, 26.80),
    ("", "Site stripping by machine", "m3", 1500, 4.80),
    ("", "Leveling of formation", "m2", 2400, 1.90),
    ("", "Temporary earth retaining", "m2", 210, 22.00),
    ("08-01-002-01", "Brick masonry", "m3", 180, 96.00),
    ("08-01-002-01", "Brick masonry to plinth", "m3", 64, 102.00),
    ("08-01-011-01", "Block masonry", "m3", 240, 72.50),
    ("08-01-011-01", "Block masonry to shafts", "m3", 38, 78.00),
    ("08-01-020-01", "Partition masonry", "m2", 620, 18.40),
    ("08-01-020-01", "Partition to corridors", "m2", 280, 17.60),
    ("08-02-003-01", "Lintel installation", "m", 86, 42.00),
    ("08-02-003-01", "Lintel over openings", "m", 40, 46.50),
    ("08-02-003-01", "Precast lintel to windows", "m", 54, 44.20),
    ("01-01-001-01", "Bulk reduce level", "m3", 3200, 7.60),
    ("01-01-033-01", "Proof roll formation", "m2", 1800, 1.40),
    ("01-01-012-01", "Double handling of spoil", "m3", 150, 6.80),
    ("", "Dewatering of excavation", "day", 12, 180.00),
    ("01-01-055-01", "Blinding gravel to trenches", "m3", 36, 30.50),
    ("08-01-011-01", "Blockwork below ground", "m3", 52, 74.00),
    ("08-01-002-01", "Facing brick to boundary", "m2", 210, 42.00),
    ("", "Setting out and protection", "lot", 1, 900.00),
]

concrete = [
    ("06-01-001-01", "Blinding concrete", "m3", 80, 155.00),
    ("06-01-001-01", "Blinding under walls", "m3", 46, 148.00),
    ("06-01-001-01", "Blinding to pits", "m3", 22, 162.00),
    ("06-01-001-01", "Blinding to ground beams", "m3", 18, 158.00),
    ("06-01-015-01", "Foundation concrete", "m3", 120, 210.00),
    ("06-01-015-01", "Foundation strip concrete", "m3", 95, 198.00),
    ("06-01-015-01", "Pad foundation concrete", "m3", 70, 215.00),
    ("06-01-015-01", "Raft concrete", "m3", 160, 188.00),
    ("06-01-022-01", "Column concrete", "m3", 64, 240.00),
    ("06-01-022-01", "Column concrete upper floors", "m3", 48, 255.00),
    ("06-01-022-01", "Column concrete core", "m3", 30, 268.00),
    ("06-01-030-01", "Slab concrete", "m3", 210, 190.00),
    ("06-01-030-01", "Slab concrete roof", "m3", 86, 205.00),
    ("06-01-030-01", "Slab concrete basement", "m3", 140, 198.00),
    ("06-01-041-01", "Reinforcement fixing", "t", 38, 780.00),
    ("06-01-041-01", "Reinforcement in walls", "t", 12, 740.00),
    ("06-01-041-01", "Reinforcement in slabs", "t", 22, 760.00),
    ("06-01-041-01", "Reinforcement in beams", "t", 9, 810.00),
    ("06-02-001-01", "Formwork installation", "m2", 460, 28.00),
    ("06-02-001-01", "Formwork to columns", "m2", 320, 32.50),
    ("06-02-001-01", "Formwork to slabs", "m2", 890, 24.80),
    ("06-02-001-01", "Formwork to walls", "m2", 540, 31.00),
    ("06-02-001-01", "Formwork to beams", "m2", 260, 34.20),
    ("11-01-001-01", "Plastering", "m2", 1400, 9.80),
    ("11-01-001-01", "Plaster to walls", "m2", 980, 10.40),
    ("11-01-001-01", "Plaster to shafts", "m2", 220, 12.60),
    ("11-01-018-01", "Interior paint", "m2", 1600, 6.40),
    ("11-01-018-01", "Paint to ceilings", "m2", 740, 7.10),
    ("11-01-018-01", "Paint to corridors", "m2", 510, 6.90),
    ("11-01-030-01", "Ceiling plaster", "m2", 740, 11.20),
    ("11-01-044-01", "External render", "m2", 1100, 14.60),
    ("11-01-044-01", "External render to parapet", "m2", 180, 16.80),
    ("11-02-004-01", "Ceramic floor tile", "m2", 640, 32.00),
    ("11-02-004-01", "Wall tile wet areas", "m2", 280, 36.50),
    ("11-02-004-01", "Floor tile to stairs", "m2", 90, 41.00),
    ("11-03-002-01", "Suspended ceiling", "m2", 520, 29.00),
    ("11-03-002-01", "Suspended ceiling to offices", "m2", 340, 31.50),
    ("11-04-001-01", "Door installation", "pcs", 46, 140.00),
    ("11-04-001-01", "Fire door installation", "pcs", 12, 260.00),
    ("11-04-008-01", "Window installation", "m2", 180, 96.00),
    ("11-04-008-01", "Curtain wall", "m2", 90, 180.00),
    ("", "Concrete stair flight", "m3", 18, 310.00),
    ("", "Expansion joint", "m", 240, 8.50),
    ("", "Waterproofing to basement", "m2", 860, 18.40),
    ("06-01-030-01", "Topping to slabs", "m3", 24, 175.00),
    ("11-01-018-01", "Exterior paint", "m2", 1100, 8.20),
    ("11-04-001-01", "Door frame only", "pcs", 20, 48.00),
    ("06-02-001-01", "Stop ends and kickers", "m", 160, 6.40),
    ("", "Making good after trades", "m2", 400, 3.20),
    ("11-02-004-01", "Skirting tile", "m", 520, 9.50),
]

services = [
    ("12-01-003-01", "Roof membrane", "m2", 820, 24.50),
    ("12-01-003-01", "Roof membrane upstands", "m2", 140, 28.00),
    ("12-01-003-01", "Roof membrane to terraces", "m2", 260, 27.40),
    ("12-01-009-01", "Roof insulation", "m2", 820, 16.20),
    ("12-01-009-01", "Roof insulation perimeter", "m2", 160, 18.40),
    ("12-01-009-01", "Inverted roof insulation", "m2", 260, 21.00),
    ("12-01-020-01", "Gutters and downpipes", "m", 210, 16.80),
    ("12-01-020-01", "Downpipes internal", "m", 90, 19.50),
    ("12-01-020-01", "Rainwater outlets", "pcs", 24, 42.00),
    ("12-02-001-01", "Roof tiling", "m2", 640, 29.00),
    ("12-02-001-01", "Ridge and hip tiles", "m", 86, 22.40),
    ("12-02-001-01", "Valley tiles", "m", 40, 26.00),
    ("16-01-001-01", "Internal water pipe", "m", 460, 19.40),
    ("16-01-001-01", "Cold water riser", "m", 180, 21.00),
    ("16-01-001-01", "Hot water pipe", "m", 320, 22.50),
    ("16-01-014-01", "Drainage pipe", "m", 320, 24.80),
    ("16-01-014-01", "Drainage under slab", "m", 140, 27.50),
    ("16-01-014-01", "Soil stack", "m", 96, 31.00),
    ("16-01-022-01", "Sanitary fitting", "pcs", 36, 86.00),
    ("16-01-022-01", "Kitchen sanitary set", "pcs", 8, 140.00),
    ("16-01-022-01", "WC suite", "pcs", 24, 110.00),
    ("16-01-022-01", "Wash basin", "pcs", 24, 68.00),
    ("16-02-004-01", "Power cable", "m", 1100, 8.10),
    ("16-02-004-01", "Power cable to risers", "m", 420, 9.40),
    ("16-02-004-01", "Fire alarm cable", "m", 680, 6.20),
    ("16-02-011-01", "Lighting point", "pcs", 160, 22.50),
    ("16-02-011-01", "Emergency lighting point", "pcs", 24, 34.00),
    ("16-02-011-01", "External lighting point", "pcs", 18, 48.00),
    ("16-02-020-01", "Distribution board", "pcs", 6, 240.00),
    ("16-02-020-01", "Sub distribution board", "pcs", 4, 190.00),
    ("16-02-020-01", "Main switchboard", "pcs", 1, 1800.00),
    ("16-03-002-01", "Radiator installation", "pcs", 48, 120.00),
    ("16-03-002-01", "Radiator large rooms", "pcs", 12, 145.00),
    ("16-03-010-01", "Heating pipe", "m", 680, 18.60),
    ("16-03-010-01", "Heating pipe risers", "m", 120, 21.40),
    ("16-03-010-01", "Heating manifolds", "pcs", 8, 210.00),
    ("", "Soil dig by machine", "m3", 300, 7.20),
    ("", "Testing and commissioning of systems", "lot", 1, 2400.00),
    ("", "Lightning protection", "m", 240, 14.00),
    ("12-02-001-01", "Roof access hatches", "pcs", 4, 320.00),
    ("16-01-014-01", "Gullies and traps", "pcs", 30, 38.00),
    ("16-02-011-01", "Socket outlet", "pcs", 220, 16.40),
    ("16-02-004-01", "Data cable", "m", 900, 4.80),
    ("16-03-002-01", "Towel rail", "pcs", 10, 95.00),
    ("12-01-020-01", "Overflow pipes", "m", 40, 12.00),
    ("", "Builders work in connection", "lot", 1, 1600.00),
    ("16-01-001-01", "Insulation to pipes", "m", 780, 6.50),
    ("12-01-009-01", "Vapour barrier", "m2", 820, 4.20),
    ("16-02-020-01", "Earthing bar", "pcs", 2, 160.00),
    ("", "As-built drawings", "lot", 1, 450.00),
]

mixed = [
    ("01-01-001-01", "Excavation by excavator", "m3", 480, 9.20),
    ("01-01-021-01", "Trench excavation", "m3", 220, 13.10),
    ("01-01-028-01", "Manual excavation", "m3", 60, 16.00),
    ("01-01-033-01", "Compaction of fill", "m3", 160, 8.80),
    ("01-01-012-01", "Disposal of excavated soil", "m3", 300, 12.40),
    ("01-01-041-01", "Backfill of excavated soil", "m3", 140, 9.60),
    ("01-01-055-01", "Gravel bedding", "m3", 40, 29.00),
    ("06-01-001-01", "Blinding concrete", "m3", 28, 150.00),
    ("06-01-015-01", "Foundation concrete", "m3", 54, 205.00),
    ("06-01-022-01", "Column concrete", "m3", 18, 248.00),
    ("06-01-030-01", "Slab concrete", "m3", 72, 198.00),
    ("06-01-041-01", "Reinforcement fixing", "t", 6.4, 760.00),
    ("06-02-001-01", "Formwork installation", "m2", 210, 30.00),
    ("08-01-002-01", "Brick masonry", "m3", 42, 98.00),
    ("08-01-011-01", "Block masonry", "m3", 36, 74.00),
    ("08-01-020-01", "Partition masonry", "m2", 180, 19.20),
    ("08-02-003-01", "Lintel installation", "m", 36, 44.00),
    ("11-01-001-01", "Plastering", "m2", 420, 10.10),
    ("11-01-018-01", "Interior paint", "m2", 420, 6.80),
    ("11-01-030-01", "Ceiling plaster", "m2", 200, 12.00),
    ("11-01-044-01", "External render", "m2", 260, 15.40),
    ("11-02-004-01", "Ceramic floor tile", "m2", 150, 34.00),
    ("11-03-002-01", "Suspended ceiling", "m2", 160, 30.00),
    ("11-04-001-01", "Door installation", "pcs", 14, 150.00),
    ("11-04-008-01", "Window installation", "m2", 48, 102.00),
    ("12-01-003-01", "Roof membrane", "m2", 210, 26.00),
    ("12-01-009-01", "Roof insulation", "m2", 210, 17.50),
    ("12-01-020-01", "Gutters and downpipes", "m", 60, 18.00),
    ("12-02-001-01", "Roof tiling", "m2", 180, 31.00),
    ("16-01-001-01", "Internal water pipe", "m", 120, 20.40),
    ("16-01-014-01", "Drainage pipe", "m", 80, 25.00),
    ("16-01-022-01", "Sanitary fitting", "pcs", 10, 90.00),
    ("16-02-004-01", "Power cable", "m", 260, 8.60),
    ("16-02-011-01", "Lighting point", "pcs", 40, 24.00),
    ("16-02-020-01", "Distribution board", "pcs", 2, 220.00),
    ("16-03-002-01", "Radiator installation", "pcs", 12, 128.00),
    ("16-03-010-01", "Heating pipe", "m", 160, 19.20),
    ("", "Provisional site clearance", "m2", 600, 2.40),
    ("", "Builders work in connection", "lot", 1, 1200.00),
    ("01-01-012-01", "Cart away from mixed works", "m3", 80, 13.00),
    ("06-02-001-01", "Formwork to stairs", "m2", 40, 38.00),
    ("11-04-001-01", "Ironmongery set", "pcs", 14, 35.00),
    ("16-02-011-01", "Socket outlet", "pcs", 50, 18.00),
    ("12-01-003-01", "Waterproofing to wet rooms", "m2", 80, 22.00),
    ("08-02-003-01", "Precast cill", "m", 28, 18.50),
    ("", "Temporary protection", "lot", 1, 700.00),
    ("11-01-044-01", "Render beads and stops", "m", 180, 4.60),
    ("16-03-010-01", "Heating valves", "pcs", 12, 28.00),
    ("01-01-055-01", "Make up levels", "m3", 24, 32.00),
    ("", "Preliminaries share", "lot", 1, 3500.00),
]


def money(qty, rate, index, force=None):
    if index in {4, 21}:
        return round(qty * rate - 250, 2)
    return round(qty * rate, 2)


def as_rows(items):
    lines = [("code", "work", "unit", "qty", "rate", "amount")]
    for index, (code, work, unit, qty, rate) in enumerate(items):
        amount = money(qty, rate, index, round(qty * rate, 2) - 400 if index % 17 == 0 else None)
        lines.append((code, work, unit, f"{qty:g}", f"{rate:.2f}", f"{amount:.2f}"))
    return lines


def write_csv(path, items):
    body = []
    for row in as_rows(items):
        body.append(",".join(row))
    path.write_text("\n".join(body) + "\n", encoding="utf-8")
    print(path.name, len(items))


def column(index):
    name = ""
    number = index
    while number:
        number, remainder = divmod(number - 1, 26)
        name = chr(65 + remainder) + name
    return name


def cell(ref, value, as_text):
    if value == "":
        return f'<c r="{ref}"/>'
    if as_text:
        safe = value.replace("&", "&amp;").replace("<", "&lt;")
        return f'<c r="{ref}" t="inlineStr"><is><t>{safe}</t></is></c>'
    return f'<c r="{ref}"><v>{value}</v></c>'


def write_xlsx(path, items):
    rows = as_rows(items)
    sheet_rows = []
    for row_index, row in enumerate(rows, start=1):
        cells = []
        for col_index, value in enumerate(row, start=1):
            ref = f"{column(col_index)}{row_index}"
            cells.append(cell(ref, value, row_index == 1 or col_index <= 3))
        sheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')
    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData></worksheet>'
    )
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""
    workbook = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Tender" sheetId="1" r:id="rId1"/></sheets>
</workbook>"""
    workbook_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>"""
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", rels)
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
    print(path.name, len(items))


write_csv(root / "earthwork-tender.csv", earth)
write_csv(root / "concrete-tender.csv", concrete)
write_csv(root / "services-tender.csv", services)
write_xlsx(root / "mixed-tender.xlsx", mixed)
