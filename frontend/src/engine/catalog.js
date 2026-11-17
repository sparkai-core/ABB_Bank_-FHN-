import { money, unitRate } from "./pricing.js";

export const INDEX_FACTOR = "1";
export const PRICE_BOOK = "NK 150 / 25.05.2021";
export const TENDER_PERIOD = "2026-Q2";

/** Sample norm book used as the local check database. Not official FHN prices. */
export const NORMS = [
  {
    code: "01-01-001-01",
    name_az: "Ekskavatorla torpaq qazılması",
    name_en: "Excavation by excavator",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "2.86",
    machinist: "1.51",
    machine: "6.48",
    material: "0",
  },
  {
    code: "01-01-033-01",
    name_az: "Qruntun sıxlaşdırılması",
    name_en: "Compaction of fill",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "1.20",
    machinist: "0.64",
    machine: "3.10",
    material: "0",
  },
  {
    code: "01-01-012-01",
    name_az: "Qazılmış qruntun daşınması",
    name_en: "Disposal of excavated soil",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "0.40",
    machinist: "0.90",
    machine: "8.20",
    material: "0",
  },
  {
    code: "01-01-041-01",
    name_az: "Qruntun doldurulması",
    name_en: "Backfill of excavated soil",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "1.85",
    machinist: "0.70",
    machine: "4.20",
    material: "0",
  },
  {
    code: "06-01-001-01",
    name_az: "Əsasaltı beton",
    name_en: "Blinding concrete",
    unit: "m³",
    section_az: "Beton",
    section_en: "Concrete",
    labor: "18.40",
    machinist: "4.10",
    machine: "12.00",
    material: "62.50",
  },
  {
    code: "06-01-015-01",
    name_az: "Bünövrə betonu",
    name_en: "Foundation concrete",
    unit: "m³",
    section_az: "Beton",
    section_en: "Concrete",
    labor: "22.10",
    machinist: "5.20",
    machine: "14.80",
    material: "78.00",
  },
  {
    code: "06-02-001-01",
    name_az: "Kalıp quraşdırılması",
    name_en: "Formwork installation",
    unit: "m²",
    section_az: "Beton",
    section_en: "Concrete",
    labor: "8.40",
    machinist: "0.20",
    machine: "1.10",
    material: "12.50",
  },
  {
    code: "11-01-001-01",
    name_az: "Suvaq işləri",
    name_en: "Plastering",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "4.80",
    machinist: "0",
    machine: "0.40",
    material: "3.20",
  },
  {
    code: "11-01-018-01",
    name_az: "Daxili boya",
    name_en: "Interior paint",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "3.10",
    machinist: "0",
    machine: "0.15",
    material: "2.40",
  },
  {
    code: "11-02-004-01",
    name_az: "Keramika döşəmə",
    name_en: "Ceramic floor tile",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "6.40",
    machinist: "0",
    machine: "0.30",
    material: "18.50",
  },
  {
    code: "08-01-002-01",
    name_az: "Kərpic hörgü",
    name_en: "Brick masonry",
    unit: "m³",
    section_az: "Hörgü",
    section_en: "Masonry",
    labor: "28.00",
    machinist: "1.20",
    machine: "4.40",
    material: "46.00",
  },
  {
    code: "08-01-011-01",
    name_az: "Blok hörgü",
    name_en: "Block masonry",
    unit: "m³",
    section_az: "Hörgü",
    section_en: "Masonry",
    labor: "16.50",
    machinist: "0.80",
    machine: "3.10",
    material: "38.00",
  },
  {
    code: "12-01-003-01",
    name_az: "Dam örtüyü",
    name_en: "Roof membrane",
    unit: "m²",
    section_az: "Dam",
    section_en: "Roof",
    labor: "5.20",
    machinist: "0.40",
    machine: "1.80",
    material: "14.60",
  },
  {
    code: "12-01-009-01",
    name_az: "İstilik izolyasiyası",
    name_en: "Roof insulation",
    unit: "m²",
    section_az: "Dam",
    section_en: "Roof",
    labor: "3.40",
    machinist: "0",
    machine: "0.60",
    material: "11.20",
  },
  {
    code: "16-01-001-01",
    name_az: "Daxili su xətti",
    name_en: "Internal water pipe",
    unit: "m",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "7.80",
    machinist: "0",
    machine: "0.90",
    material: "9.40",
  },
  {
    code: "16-02-004-01",
    name_az: "Elektrik kabeli",
    name_en: "Power cable",
    unit: "m",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "2.60",
    machinist: "0",
    machine: "0.20",
    material: "4.80",
  },
  {
    code: "16-03-002-01",
    name_az: "Radiator quraşdırılması",
    name_en: "Radiator installation",
    unit: "əd",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "18.00",
    machinist: "0",
    machine: "1.50",
    material: "86.00",
  },
  {
    code: "01-01-021-01",
    name_az: "Xəndək qazılması",
    name_en: "Trench excavation",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "3.40",
    machinist: "1.10",
    machine: "7.20",
    material: "0",
  },
  {
    code: "01-01-028-01",
    name_az: "Əl ilə qazıntı",
    name_en: "Manual excavation",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "9.60",
    machinist: "0",
    machine: "0.40",
    material: "0",
  },
  {
    code: "01-01-055-01",
    name_az: "Çınqıl yatağı",
    name_en: "Gravel bedding",
    unit: "m³",
    section_az: "Torpaq işləri",
    section_en: "Earthwork",
    labor: "2.10",
    machinist: "0.80",
    machine: "4.40",
    material: "18.00",
  },
  {
    code: "06-01-022-01",
    name_az: "Sütun betonu",
    name_en: "Column concrete",
    unit: "m³",
    section_az: "Beton",
    section_en: "Concrete",
    labor: "26.00",
    machinist: "6.20",
    machine: "16.40",
    material: "84.00",
  },
  {
    code: "06-01-030-01",
    name_az: "Örtük plitəsi",
    name_en: "Slab concrete",
    unit: "m³",
    section_az: "Beton",
    section_en: "Concrete",
    labor: "21.50",
    machinist: "5.40",
    machine: "15.20",
    material: "81.00",
  },
  {
    code: "06-01-041-01",
    name_az: "Armatur quraşdırılması",
    name_en: "Reinforcement fixing",
    unit: "t",
    section_az: "Beton",
    section_en: "Concrete",
    labor: "48.00",
    machinist: "4.00",
    machine: "18.00",
    material: "620.00",
  },
  {
    code: "08-01-020-01",
    name_az: "Arakəsmə hörgüsü",
    name_en: "Partition masonry",
    unit: "m²",
    section_az: "Hörgü",
    section_en: "Masonry",
    labor: "7.40",
    machinist: "0",
    machine: "0.30",
    material: "11.20",
  },
  {
    code: "08-02-003-01",
    name_az: "Lintel quraşdırılması",
    name_en: "Lintel installation",
    unit: "m",
    section_az: "Hörgü",
    section_en: "Masonry",
    labor: "6.20",
    machinist: "1.40",
    machine: "8.10",
    material: "22.00",
  },
  {
    code: "11-01-030-01",
    name_az: "Tavan suvağı",
    name_en: "Ceiling plaster",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "5.60",
    machinist: "0",
    machine: "0.20",
    material: "3.40",
  },
  {
    code: "11-01-044-01",
    name_az: "Xarici suvaq",
    name_en: "External render",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "6.80",
    machinist: "0.40",
    machine: "1.10",
    material: "4.60",
  },
  {
    code: "11-03-002-01",
    name_az: "Asma tavan",
    name_en: "Suspended ceiling",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "8.20",
    machinist: "0",
    machine: "0.50",
    material: "16.40",
  },
  {
    code: "11-04-001-01",
    name_az: "Qapı quraşdırılması",
    name_en: "Door installation",
    unit: "əd",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "14.00",
    machinist: "0",
    machine: "1.20",
    material: "95.00",
  },
  {
    code: "11-04-008-01",
    name_az: "Pəncərə quraşdırılması",
    name_en: "Window installation",
    unit: "m²",
    section_az: "Bitirmə",
    section_en: "Finishes",
    labor: "12.40",
    machinist: "0.60",
    machine: "2.80",
    material: "78.00",
  },
  {
    code: "12-01-020-01",
    name_az: "Nov və eniş borusu",
    name_en: "Gutters and downpipes",
    unit: "m",
    section_az: "Dam",
    section_en: "Roof",
    labor: "4.20",
    machinist: "0",
    machine: "0.40",
    material: "9.80",
  },
  {
    code: "12-02-001-01",
    name_az: "Dam kirəmiti",
    name_en: "Roof tiling",
    unit: "m²",
    section_az: "Dam",
    section_en: "Roof",
    labor: "7.10",
    machinist: "0.30",
    machine: "1.40",
    material: "18.60",
  },
  {
    code: "16-01-014-01",
    name_az: "Kanalizasiya xətti",
    name_en: "Drainage pipe",
    unit: "m",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "6.40",
    machinist: "0.80",
    machine: "3.20",
    material: "12.50",
  },
  {
    code: "16-01-022-01",
    name_az: "Sanitariya cihazı",
    name_en: "Sanitary fitting",
    unit: "əd",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "9.80",
    machinist: "0",
    machine: "0.60",
    material: "64.00",
  },
  {
    code: "16-02-011-01",
    name_az: "İşıq nöqtəsi",
    name_en: "Lighting point",
    unit: "əd",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "5.20",
    machinist: "0",
    machine: "0.20",
    material: "14.80",
  },
  {
    code: "16-02-020-01",
    name_az: "Paylayıcı lövhə",
    name_en: "Distribution board",
    unit: "əd",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "22.00",
    machinist: "0",
    machine: "1.10",
    material: "180.00",
  },
  {
    code: "16-03-010-01",
    name_az: "İstilik borusu",
    name_en: "Heating pipe",
    unit: "m",
    section_az: "Mühəndis",
    section_en: "Services",
    labor: "6.10",
    machinist: "0",
    machine: "0.70",
    material: "11.40",
  },
];

export const referenceRate = (norm, index = INDEX_FACTOR) => unitRate(
  norm.labor,
  norm.machinist,
  norm.machine,
  norm.material,
  "construction",
  index,
);

const NORM_KEY = "smeta.norms.v1";
const EDITABLE = ["labor", "machinist", "machine", "material"];

const UNIT_KEY = {
  m3: "m3",
  "m³": "m3",
  "м3": "m3",
  "м³": "m3",
  m2: "m2",
  "m²": "m2",
  "м²": "m2",
  m: "m",
  pcs: "pcs",
  pc: "pcs",
  əd: "pcs",
  ed: "pcs",
  шт: "pcs",
  t: "t",
  ton: "t",
  kg: "kg",
};

export const sameUnit = (left, right) => {
  const key = (unit) => {
    const text = String(unit || "").toLowerCase().replace(/[\s.]+/g, "");
    return UNIT_KEY[text] || text;
  };
  if (!String(left || "").trim() || !String(right || "").trim()) return true;
  return key(left) === key(right);
};

const SCOPE_RULES = [
  { test: (codes) => codes.some((code) => code.startsWith("01-")), need: "01-01-012-01" },
  { test: (codes) => codes.some((code) => code.startsWith("01-")), need: "01-01-041-01" },
  { test: (codes) => codes.some((code) => code.startsWith("06-")), need: "06-02-001-01" },
  { test: (codes) => codes.some((code) => code.startsWith("12-")), need: "12-01-009-01" },
];

export const scopeMissing = (lines) => {
  const codes = lines
    .filter((line) => line.coded || line.match === "confirmed")
    .map((line) => line.suggested_code)
    .filter(Boolean);
  const present = new Set(codes);
  return SCOPE_RULES
    .filter((rule) => rule.test(codes) && !present.has(rule.need))
    .map((rule) => normByCode(rule.need))
    .filter(Boolean);
};

export const importNormPrices = (text) => {
  const rows = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (rows.length < 2) return 0;
  const header = rows[0].split(/[,;]/).map((cell) => cell.trim().toLowerCase());
  const col = (...names) => header.findIndex((cell) => names.includes(cell));
  const codeCol = col("code", "kod");
  if (codeCol < 0) return 0;
  const fields = {
    labor: col("labor", "labour", "wage"),
    machinist: col("machinist", "operator"),
    machine: col("machine", "machinery"),
    material: col("material", "materials"),
  };
  const known = new Set(NORMS.map((norm) => norm.code));
  const all = readOverrides();
  let count = 0;
  rows.slice(1).forEach((line) => {
    const cells = line.split(/[,;]/).map((cell) => cell.trim());
    const code = cells[codeCol];
    if (!known.has(code)) return;
    const next = {};
    EDITABLE.forEach((field) => {
      const index = fields[field];
      if (index < 0 || cells[index] === "" || cells[index] == null) return;
      const number = Number(cells[index]);
      if (Number.isFinite(number) && number >= 0) next[field] = String(number);
    });
    if (!Object.keys(next).length) return;
    all[code] = { ...(all[code] || {}), ...next };
    count += 1;
  });
  if (count) localStorage.setItem(NORM_KEY, JSON.stringify(all));
  return count;
};

const readOverrides = () => {
  try {
    return JSON.parse(localStorage.getItem(NORM_KEY) || "{}");
  } catch {
    return {};
  }
};

export const listNorms = () => NORMS.map((norm) => ({ ...norm, ...(readOverrides()[norm.code] || {}), code: norm.code }));

export const normByCode = (code) => listNorms().find((norm) => norm.code === code) || null;

export const updateNormField = (code, field, value) => {
  if (!EDITABLE.includes(field) || !normByCode(code)) return listNorms();
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return listNorms();
  const all = readOverrides();
  all[code] = { ...(all[code] || {}), [field]: String(number) };
  localStorage.setItem(NORM_KEY, JSON.stringify(all));
  return listNorms();
};

export const resetNorm = (code) => {
  const all = readOverrides();
  delete all[code];
  localStorage.setItem(NORM_KEY, JSON.stringify(all));
  return listNorms();
};

export const resetAllNorms = () => {
  localStorage.removeItem(NORM_KEY);
  return listNorms();
};

export const buildSampleLines = () => {
  const excavation = referenceRate(NORMS[0]);
  const low = money(excavation * 0.7);
  return [
    {
      id: "l1",
      qty: "1200",
      contractor_rate: String(low),
      contractor_amount: String(money(low * 1200)),
      match: "needs_review",
      confidence: "0.62",
      suggested_code: "01-01-001-01",
      included: false,
    },
    {
      id: "l2",
      qty: "400",
      contractor_rate: "8.50",
      contractor_amount: "3000.00",
      match: "confirmed",
      confidence: "0.98",
      suggested_code: "01-01-033-01",
      included: true,
    },
    {
      id: "gap-disposal",
      qty: "900",
      contractor_rate: null,
      contractor_amount: null,
      match: "confirmed",
      confidence: "1",
      suggested_code: "01-01-012-01",
      included: true,
      gap: true,
    },
    {
      id: "l3",
      qty: "80",
      contractor_rate: "160.00",
      contractor_amount: "12800.00",
      match: "confirmed",
      confidence: "0.95",
      suggested_code: "06-01-001-01",
      included: true,
    },
  ];
};

export const buildBenchLines = () => {
  const blinding = referenceRate(normByCode("06-01-001-01"));
  const foundation = referenceRate(normByCode("06-01-015-01"));
  const tile = referenceRate(normByCode("11-02-004-01"));
  const paint = referenceRate(normByCode("11-01-018-01"));
  const lowBlind = money(blinding * 0.88);
  const lowFound = money(foundation * 0.78);
  const highTile = money(tile * 1.18);
  const closePaint = money(paint * 1.02);
  return [
    {
      id: "b1",
      qty: "80",
      contractor_rate: String(lowBlind),
      contractor_amount: String(money(lowBlind * 80)),
      match: "confirmed",
      confidence: "1",
      suggested_code: "06-01-001-01",
      included: true,
    },
    {
      id: "b2",
      qty: "120",
      contractor_rate: String(lowFound),
      contractor_amount: String(money(lowFound * 120)),
      match: "confirmed",
      confidence: "1",
      suggested_code: "06-01-015-01",
      included: true,
    },
    {
      id: "b3",
      qty: "640",
      contractor_rate: String(highTile),
      contractor_amount: String(money(highTile * 640)),
      match: "confirmed",
      confidence: "1",
      suggested_code: "11-02-004-01",
      included: true,
    },
    {
      id: "b4",
      qty: "900",
      contractor_rate: String(closePaint),
      contractor_amount: String(money(closePaint * 900)),
      match: "confirmed",
      confidence: "1",
      suggested_code: "11-01-018-01",
      included: true,
    },
  ];
};

export const SAMPLES = [
  {
    id: "earthwork",
    file: "/samples/earthwork-tender.csv",
    filename: "earthwork-tender.csv",
    title_en: "Earthwork tender",
    title_az: "Torpaq tenderi",
    kind: "csv",
    hint_en: "Underprice + missing disposal",
    hint_az: "Aşağı qiymət + çatışmayan daşınma",
  },
  {
    id: "concrete",
    file: "/samples/concrete-tender.csv",
    filename: "concrete-tender.csv",
    title_en: "Concrete tender",
    title_az: "Beton tenderi",
    kind: "csv",
    hint_en: "Close rates, one over",
    hint_az: "Yaxın qiymət, bir yuxarı",
  },
  {
    id: "mixed",
    file: "/samples/mixed-tender.xlsx",
    filename: "mixed-tender.xlsx",
    title_en: "Mixed works",
    title_az: "Qarışıq işlər",
    kind: "xlsx",
    hint_en: "Needs match review",
    hint_az: "Uyğunluq gözləyir",
  },
  {
    id: "services",
    file: "/samples/services-tender.csv",
    filename: "services-tender.csv",
    title_en: "Roof and services",
    title_az: "Dam və mühəndis",
    kind: "csv",
    hint_en: "Roof, pipes, power",
    hint_az: "Dam, boru, elektrik",
  },
];
