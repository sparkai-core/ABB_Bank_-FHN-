import {
  PRICE_BOOK,
  listNorms,
  sameUnit,
  scopeMissing,
  TENDER_PERIOD,
  buildBenchLines,
  buildSampleLines,
  normByCode,
} from "./catalog.js";
import { money, percent, rateParts } from "./pricing.js";
import { scoreLines } from "./scoring.js";
import { readFile } from "./extract.js";
import { readPrefs } from "./prefs.js";
import { desnFor } from "./desn.js";

const STORAGE_KEY = "smeta.projects.v1";

const STOP = new Set(["of", "and", "the", "for", "with", "by", "to", "in", "on", "a", "və", "ilə", "üçün", "the", "work", "works", "iş", "işləri", "işi"]);
const stem = (word) => (word.length > 5 ? word.slice(0, 5) : word);
const tokens = (text) => new Set(
  (String(text).toLowerCase().match(/[0-9a-zəöüğışçа-я]+/g) || [])
    .filter((word) => word.length > 1 && !STOP.has(word))
    .map(stem),
);

// Rule based description matching. Confidence is the cosine overlap of word stems (0 to 1).
// A person confirms every match below full confidence before it counts in the score.
const suggest = (name) => {
  const words = tokens(name);
  const book = listNorms();
  let best = book[0];
  let bestScore = 0;
  book.forEach((norm) => {
    const target = tokens(`${norm.name_en} ${norm.name_az}`);
    const shared = [...words].filter((word) => target.has(word)).length;
    const score = words.size && target.size ? shared / Math.sqrt(words.size * target.size) : 0;
    if (score > bestScore) {
      best = norm;
      bestScore = score;
    }
  });
  return { norm: best, score: Math.round(bestScore * 100) / 100 };
};

const sampleProject = () => ({
  id: "sample",
  title_en: "Sample tender: earthwork and concrete",
  title_az: "Nümunə tender: torpaq və beton",
  source: "sample",
  kind: "sample",
  lines: buildSampleLines(),
  decision: null,
  createdAt: Date.now(),
});

const benchProject = () => ({
  id: "bench",
  title_en: "Second tender: concrete and finish",
  title_az: "İkinci tender: beton və bitirmə",
  source: "sample",
  kind: "sample",
  lines: buildBenchLines(),
  decision: null,
  createdAt: Date.now(),
});

const blankState = () => ({
  projects: { sample: sampleProject(), bench: benchProject() },
  order: ["sample", "bench"],
  active: "sample",
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed?.projects?.sample) return blankState();
    if (!parsed.projects.bench) {
      parsed.projects.bench = benchProject();
      parsed.order = [...parsed.order.filter((id) => id !== "bench"), "bench"];
    }
    return parsed;
  } catch {
    return blankState();
  }
};

let state = loadState();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota
  }
};

const current = () => state.projects[state.active];

const flagRow = (row, referenceAmount, computedAmount) => {
  if (row.gap || row.contractor_rate == null) return { flag: "gap", deviation: null };
  if (referenceAmount === 0) return { flag: "close", deviation: null };
  const computed = Number(computedAmount);
  const deviation = percent(((computed - referenceAmount) / referenceAmount) * 100);
  if (row.contractor_amount != null && row.contractor_amount !== "") {
    const stated = Number(row.contractor_amount);
    const tolerance = Math.max(0.05, Math.abs(computed) * 0.0005);
    if (Math.abs(stated - computed) > tolerance) return { flag: "arithmetic", deviation };
  }
  const prefs = readPrefs();
  if (deviation <= prefs.under) return { flag: "under", deviation };
  if (deviation >= prefs.over) return { flag: "over", deviation };
  return { flag: "close", deviation };
};

const present = (row) => {
  const prefs = readPrefs();
  const norm = normByCode(row.suggested_code) || listNorms()[0];
  const unit = rateParts(norm.labor, norm.machinist, norm.machine, norm.material, prefs.workType, prefs.index);
  const rate = unit.total;
  const qty = Number(row.qty);
  const scale = (value) => money(value * qty);
  const referenceAmount = scale(rate);
  const computedAmount = row.contractor_rate == null ? null : money(Number(row.contractor_rate) * qty);
  const unitClash = Boolean(row.unit && norm?.unit && !sameUnit(row.unit, norm.unit));
  let { flag, deviation } = flagRow(row, referenceAmount, computedAmount ?? referenceAmount);
  if (unitClash && row.match !== "confirmed") {
    flag = "unit";
    deviation = null;
  }
  const parts = {
    wage: scale(unit.wage),
    machine: scale(unit.machine),
    material: scale(unit.material),
    overhead: scale(unit.overhead),
    profit: scale(unit.profit),
  };
  parts.overhead = money(parts.overhead + referenceAmount - (parts.wage + parts.machine + parts.material + parts.overhead + parts.profit));
  return {
    id: row.id,
    code: row.suggested_code,
    name_az: row.source_name || norm.name_az,
    name_en: row.source_name || norm.name_en,
    section_az: norm.section_az,
    section_en: norm.section_en,
    unit: row.unit || norm.unit,
    qty: String(qty),
    contractor_rate: row.contractor_rate == null ? null : money(row.contractor_rate).toFixed(2),
    contractor_amount: row.contractor_amount != null && row.contractor_amount !== ""
      ? money(row.contractor_amount).toFixed(2)
      : (computedAmount == null ? null : computedAmount.toFixed(2)),
    computed_amount: computedAmount == null ? null : computedAmount.toFixed(2),
    reference_rate: rate.toFixed(2),
    reference_amount: referenceAmount.toFixed(2),
    parts: {
      wage: parts.wage.toFixed(2),
      machine: parts.machine.toFixed(2),
      material: parts.material.toFixed(2),
      overhead: parts.overhead.toFixed(2),
      profit: parts.profit.toFixed(2),
    },
    deviation_pct: deviation == null ? null : String(deviation),
    flag,
    match: row.match,
    confidence: row.confidence,
    ref_unit: norm.unit,
    unit_clash: unitClash,
    confirmed_by: row.confirmed_by || "",
    confirmed_at: row.confirmed_at || null,
    coded: Boolean(row.coded),
    included: Boolean(row.included && row.match === "confirmed"),
    gap: Boolean(row.gap),
    desn: desnFor(row.suggested_code, row.source_name || norm?.name_en || ""),
  };
};

const listProjects = () => state.order.map((projectId) => {
  const project = state.projects[projectId];
  const presented = project.lines.map(present);
  const scored = scoreLines(presented, readPrefs());
  return {
    id: project.id,
    title_en: project.title_en,
    title_az: project.title_az,
    source: project.source,
    kind: project.kind,
    lines: presented.length,
    waiting: presented.filter((line) => line.match === "needs_review").length,
    issues: {
      under: presented.filter((line) => line.included && line.flag === "under").length,
      over: presented.filter((line) => line.included && line.flag === "over").length,
      gap: presented.filter((line) => line.included && line.flag === "gap").length,
      arithmetic: presented.filter((line) => line.included && line.flag === "arithmetic").length,
    },
    light: scored.light,
    deviation_pct: scored.deviation_pct,
    decision: project.decision?.choice || "",
    active: projectId === state.active,
    createdAt: project.createdAt || 0,
  };
});

export const snapshot = (projectId = state.active) => {
  const project = state.projects[projectId];
  if (!project) return null;
  const prefs = readPrefs();
  const presented = project.lines.map(present);
  const scored = scoreLines(presented, prefs);
  return {
    id: project.id,
    title_az: project.title_az,
    title_en: project.title_en,
    catalog: "sample",
    source: project.source,
    kind: project.kind,
    projects: listProjects(),
    price_book: PRICE_BOOK,
    tender_period: TENDER_PERIOD,
    index_factor: String(prefs.index),
    notice_az: "Üstəlik xərc və smeta gəliri 25 may 2021-ci il tarixli 150 nömrəli Qərarın 1 və 2 nömrəli əlavələrindəndir. Vahid qiymətlər həmin qərarda və DESN siyahısında yoxdur.",
    notice_en: "Overhead and profit are from Annexes 1 and 2 of Decision No. 150 of 25 May 2021. Unit prices are not printed in that decision or in the DESN list.",
    lines: presented,
    score: scored,
    decision: project.decision,
    scope: readPrefs().scopeOn === false ? [] : scopeMissing(project.lines),
    norm_choices: listNorms().map((norm) => ({
      code: norm.code,
      name_az: norm.name_az,
      name_en: norm.name_en,
    })),
  };
};

export const compareBoard = () => {
  const prefs = readPrefs();
  const files = state.order.map((id) => {
    const project = state.projects[id];
    const lines = project.lines.map(present);
    return {
      id: project.id,
      title_en: project.title_en,
      title_az: project.title_az,
      kind: project.kind,
      score: scoreLines(lines, prefs),
      lines,
    };
  });
  const grouped = new Map();
  files.forEach((file) => {
    file.lines.forEach((line) => {
      if (!grouped.has(line.code)) {
        grouped.set(line.code, {
          code: line.code,
          name_en: line.name_en,
          name_az: line.name_az,
          unit: line.unit,
          reference_rate: Number(line.reference_rate),
          offers: {},
        });
      }
      grouped.get(line.code).offers[file.id] = {
        rate: line.contractor_rate == null ? null : Number(line.contractor_rate),
        deviation: line.deviation_pct,
        flag: line.flag,
      };
    });
  });
  const rows = [...grouped.values()].map((row) => {
    const rates = Object.values(row.offers).map((offer) => offer.rate).filter((rate) => rate != null);
    const lowest = rates.length ? Math.min(...rates) : null;
    const spread = rates.length > 1 && row.reference_rate
      ? percent(((Math.max(...rates) - Math.min(...rates)) / row.reference_rate) * 100)
      : null;
    return { ...row, lowest, spread };
  }).sort((a, b) => (b.spread || 0) - (a.spread || 0));
  return { files, rows };
};

export const openProject = (projectId) => {
  if (!state.projects[projectId]) return null;
  state = { ...state, active: projectId };
  persist();
  return snapshot(projectId);
};

export const resetSample = () => {
  state = {
    ...state,
    projects: { ...state.projects, sample: sampleProject() },
    active: "sample",
  };
  persist();
  return snapshot("sample");
};

export const confirmLine = (lineId, code, projectId = state.active, actor = "") => {
  const project = state.projects[projectId];
  if (!project || !normByCode(code)) return null;
  project.lines = project.lines.map((row) => {
    if (row.id !== lineId) return row;
    return {
      ...row,
      suggested_code: code,
      match: "confirmed",
      included: row.gap ? row.included !== false : true,
      confidence: "1",
      confirmed_by: actor,
      confirmed_at: Date.now(),
    };
  });
  state = { ...state, active: projectId, projects: { ...state.projects, [projectId]: project } };
  persist();
  return snapshot(projectId);
};

export const setGap = (lineId, required, projectId = state.active) => {
  const project = state.projects[projectId];
  if (!project) return null;
  project.lines = project.lines.map((row) => (row.id === lineId && row.gap ? { ...row, included: required } : row));
  state = { ...state, active: projectId, projects: { ...state.projects, [projectId]: project } };
  persist();
  return snapshot(projectId);
};

export const decide = (choice, note, projectId = state.active, actor = "") => {
  if (!["accept", "query", "reject"].includes(choice)) return null;
  const project = state.projects[projectId];
  if (!project) return null;
  project.decision = { choice, note: note || "", by: actor, at: Date.now() };
  state = { ...state, active: projectId, projects: { ...state.projects, [projectId]: project } };
  persist();
  return snapshot(projectId);
};

export const removeProject = (projectId) => {
  if (projectId === "sample" || !state.projects[projectId]) return snapshot();
  const { [projectId]: _removed, ...projects } = state.projects;
  const order = state.order.filter((id) => id !== projectId);
  const active = state.active === projectId ? (order[0] || "sample") : state.active;
  state = { projects, order, active };
  persist();
  return snapshot(active);
};

export const clearUploads = () => {
  const projects = {
    sample: state.projects.sample || sampleProject(),
    bench: state.projects.bench || benchProject(),
  };
  state = { projects, order: ["sample", "bench"], active: "sample" };
  persist();
  return snapshot("sample");
};

const b64ToBytes = (content) => {
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const hasFile = (filename) => state.order.some((id) => state.projects[id].title_en === filename);

export const dedupeProjects = () => {
  const seen = new Set();
  const order = state.order.filter((id) => {
    const name = state.projects[id]?.title_en;
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
  if (order.length === state.order.length) return snapshot();
  const projects = {};
  order.forEach((id) => { projects[id] = state.projects[id]; });
  const active = projects[state.active] ? state.active : (order[0] || "sample");
  state = { projects, order, active };
  persist();
  return snapshot(active);
};

export const extractedRows = () => state.order.flatMap((id) => {
  const project = state.projects[id];
  return project.lines.map(present).map((line) => ({
    ...line,
    project_id: project.id,
    project_en: project.title_en,
    project_az: project.title_az,
    file_kind: project.kind,
  }));
});

export const uploadProject = async ({ filename, content, bytes }) => {
  const data = bytes || b64ToBytes(content);
  const { rows, kind } = await readFile(filename, data);
  const built = rows.map((item, index) => {
    const exact = normByCode(item.code || "");
    const coded = Boolean(String(item.code || "").trim());
    if (exact) {
      const clash = item.unit && !sameUnit(item.unit, exact.unit);
      return {
        id: `u${index + 1}`,
        qty: String(item.qty ?? 1),
        contractor_rate: item.rate == null ? null : String(item.rate),
        contractor_amount: item.amount == null ? null : String(item.amount),
        match: clash ? "needs_review" : "confirmed",
        confidence: clash ? "0.4" : "1",
        suggested_code: exact.code,
        included: !clash,
        gap: item.rate == null,
        coded,
        source_name: item.name,
        unit: item.unit || "",
      };
    }
    const { norm, score } = suggest(item.name);
    return {
      id: `u${index + 1}`,
      qty: String(item.qty ?? 1),
      contractor_rate: item.rate == null ? null : String(item.rate),
      contractor_amount: item.amount == null ? null : String(item.amount),
      match: "needs_review",
      confidence: String(score),
      suggested_code: norm.code,
      included: item.rate == null,
      gap: item.rate == null,
      coded,
      source_name: item.name,
      unit: item.unit || "",
    };
  });
  const existingId = state.order.find((id) => state.projects[id]?.title_en === filename);
  const projectId = existingId || `p${Date.now().toString(36)}`;
  const project = {
    id: projectId,
    title_en: filename,
    title_az: filename,
    source: "upload",
    kind: kind || "file",
    lines: built,
    decision: null,
    createdAt: existingId ? state.projects[existingId].createdAt : Date.now(),
  };
  state = {
    projects: { ...state.projects, [projectId]: project },
    order: [projectId, ...state.order.filter((id) => id !== projectId)],
    active: projectId,
  };
  persist();
  return snapshot(projectId);
};

export const reportCsv = (projectId = state.active) => {
  const snap = snapshot(projectId);
  if (!snap) return "";
  const header = ["work", "unit", "qty", "contractor_rate", "reference_rate", "deviation_pct", "status", "match"];
  const lines = snap.lines.map((line) => [
    line.name_en,
    line.unit,
    line.qty,
    line.contractor_rate || "",
    line.reference_rate,
    line.deviation_pct || "",
    line.flag,
    line.match,
  ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","));
  return [header.join(","), ...lines].join("\n");
};

export const reportText = (projectId = state.active) => {
  const snap = snapshot(projectId);
  if (!snap) return "";
  const decision = snap.decision?.choice || "none";
  const note = snap.decision?.note || "";
  const lines = [
    "Smeta Yoxlama",
    snap.title_en,
    snap.notice_en,
    "",
    `Contractor total: ${snap.score.contractor_total}`,
    `Reference total: ${snap.score.reference_total}`,
    `Difference: ${snap.score.deviation_pct || ""}`,
    `Code: ${{ red: "S1", amber: "S2", green: "S3" }[snap.score.light] || ""}`,
    snap.score.sentence_en,
    snap.score.sentence_az,
    `Decision: ${decision}`,
    `Note: ${note}`,
    "",
    "Lines",
    ...snap.lines.map((line) => `${line.name_en} | ${line.unit} | ${line.qty} | ${line.contractor_rate || ""} | ${line.reference_rate} | ${line.deviation_pct || ""} | ${line.flag}`),
  ];
  return `${lines.join("\n")}\n`;
};

export const downloadBlob = (filename, text, type = "text/plain") => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
