const KEY = "smeta.prefs.v1";

export const UNDERS = [-10, -15, -25];
export const OVERS = [10, 15, 25];
export const SEVERES = [-30, -40, -50];

export const THEMES = ["light", "dark"];
export const WORK_TYPES = ["construction", "repair", "commissioning", "restoration"];
export const BASE_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
export const DEFAULT_PREFS = {
  baseYear: 2026,
  tenderYear: 2026,
  annualIndex: 0,
  under: -15,
  over: 15,
  severe: -30,
  redArithmetic: true,
  redGap: true,
  scopeOn: true,
  reportLines: "all",
  theme: "light",
  workType: "construction",
  org: "",
};

/*
 * Price index between the year the database prices were set and the tender year.
 * index = (1 + annual change) ^ (tender year - database year), rounded to 4 places.
 * The annual change must come from the official series the client chooses.
 */
export const priceIndex = ({ baseYear, tenderYear, annualIndex }) => {
  const years = Number(tenderYear) - Number(baseYear);
  const rate = Number(annualIndex) / 100;
  const factor = (1 + rate) ** years;
  if (!Number.isFinite(factor) || factor <= 0) return 1;
  return Math.round(Math.min(Math.max(factor, 0.5), 3) * 10000) / 10000;
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
};

const pick = (value, allowed, fallback) => (allowed.includes(Number(value)) ? Number(value) : fallback);

const clampRate = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_PREFS.annualIndex;
  return Math.round(Math.min(Math.max(number, -20), 50) * 100) / 100;
};

const clean = (raw) => {
  const prefs = {
    baseYear: pick(raw.baseYear, BASE_YEARS, DEFAULT_PREFS.baseYear),
    tenderYear: pick(raw.tenderYear, YEARS, DEFAULT_PREFS.tenderYear),
    annualIndex: clampRate(raw.annualIndex ?? DEFAULT_PREFS.annualIndex),
    under: pick(raw.under, UNDERS, DEFAULT_PREFS.under),
    over: pick(raw.over, OVERS, DEFAULT_PREFS.over),
    severe: pick(raw.severe, SEVERES, DEFAULT_PREFS.severe),
    redArithmetic: raw.redArithmetic !== false,
    redGap: raw.redGap !== false,
    scopeOn: raw.scopeOn !== false,
    reportLines: raw.reportLines === "flagged" ? "flagged" : "all",
    theme: raw.theme === "dark" ? "dark" : "light",
    workType: WORK_TYPES.includes(raw.workType) ? raw.workType : DEFAULT_PREFS.workType,
    org: String(raw.org || "").slice(0, 80),
  };
  return { ...prefs, index: priceIndex(prefs) };
};

export const readPrefs = () => {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY) || "null") || {});
  } catch {
    return clean({});
  }
};

export const savePrefs = (patch) => {
  const { index: _derived, ...saved } = clean({ ...readPrefs(), ...patch });
  localStorage.setItem(KEY, JSON.stringify(saved));
  applyTheme(saved.theme);
  return readPrefs();
};
