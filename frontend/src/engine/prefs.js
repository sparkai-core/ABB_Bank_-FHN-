const KEY = "smeta.prefs.v1";

export const INDEXES = [1];
export const UNDERS = [-10, -15, -25];
export const OVERS = [10, 15, 25];
export const SEVERES = [-30, -40, -50];

export const THEMES = ["light", "dark"];
export const WORK_TYPES = ["construction", "repair", "commissioning", "restoration"];
export const YEARS = [2025, 2026, 2027];
export const DEFAULT_PREFS = {
  index: 1,
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
  tenderYear: 2026,
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
};

const pick = (value, allowed, fallback) => (allowed.includes(Number(value)) ? Number(value) : fallback);

export const readPrefs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") || {};
    return {
      index: pick(raw.index, INDEXES, DEFAULT_PREFS.index),
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
      tenderYear: YEARS.includes(Number(raw.tenderYear)) ? Number(raw.tenderYear) : DEFAULT_PREFS.tenderYear,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const savePrefs = (patch) => {
  const next = { ...readPrefs(), ...patch };
  const saved = {
    index: pick(next.index, INDEXES, DEFAULT_PREFS.index),
    under: pick(next.under, UNDERS, DEFAULT_PREFS.under),
    over: pick(next.over, OVERS, DEFAULT_PREFS.over),
    severe: pick(next.severe, SEVERES, DEFAULT_PREFS.severe),
    redArithmetic: next.redArithmetic !== false,
    redGap: next.redGap !== false,
    scopeOn: next.scopeOn !== false,
    reportLines: next.reportLines === "flagged" ? "flagged" : "all",
    theme: next.theme === "dark" ? "dark" : "light",
    workType: WORK_TYPES.includes(next.workType) ? next.workType : DEFAULT_PREFS.workType,
    org: String(next.org || "").slice(0, 80),
    tenderYear: YEARS.includes(Number(next.tenderYear)) ? Number(next.tenderYear) : DEFAULT_PREFS.tenderYear,
  };
  localStorage.setItem(KEY, JSON.stringify(saved));
  applyTheme(saved.theme);
  return readPrefs();
};
