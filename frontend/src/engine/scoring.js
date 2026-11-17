import { money, percent } from "./pricing.js";

const formatPct = (value) => String(Math.abs(Number(value))).replace(/\.0$/, "");

const sentence = (lines, lang) => {
  const sections = new Map();
  lines.forEach((line) => {
    const reference = Number(line.reference_amount);
    if (!reference || line.flag === "gap") return;
    const key = line.section_en || line.name_en;
    const current = sections.get(key) || {
      name_en: line.section_en || line.name_en,
      name_az: line.section_az || line.name_az,
      contractor: 0,
      reference: 0,
    };
    current.contractor += Number(line.contractor_amount) || 0;
    current.reference += reference;
    sections.set(key, current);
  });
  const under = [...sections.values()]
    .map((section) => ({ ...section, deviation: ((section.contractor - section.reference) / section.reference) * 100 }))
    .filter((section) => section.deviation <= -5)
    .sort((a, b) => a.deviation - b.deviation);
  const parts = [];
  if (under.length) {
    const worst = under[0];
    const name = lang === "az" ? worst.name_az : worst.name_en;
    const shown = formatPct(percent(worst.deviation));
    parts.push(lang === "az"
      ? `${name} istinad qiymətindən ${shown}% aşağıdır.`
      : `${name} is ${shown}% under the reference price.`);
  }
  const over = [...sections.values()]
    .map((section) => ({ ...section, deviation: ((section.contractor - section.reference) / section.reference) * 100 }))
    .filter((section) => section.deviation > 0)
    .sort((a, b) => b.deviation - a.deviation);
  if (!under.length && over.length && over[0].deviation >= 5) {
    const worst = over[0];
    const name = lang === "az" ? worst.name_az : worst.name_en;
    const shown = formatPct(percent(worst.deviation));
    parts.push(lang === "az"
      ? `${name} istinad qiymətindən ${shown}% yuxarıdır.`
      : `${name} is ${shown}% over the reference price.`);
  }
  const gaps = lines.filter((line) => line.flag === "gap").length;
  const arithmetic = lines.filter((line) => line.flag === "arithmetic").length;
  if (gaps) {
    parts.push(lang === "az" ? `${gaps} iş smetada yoxdur.` : `${gaps} item${gaps === 1 ? "" : "s"} missing from the estimate.`);
  }
  if (arithmetic) {
    parts.push(lang === "az" ? `${arithmetic} sətirdə hesab səhvi var.` : `${arithmetic} line${arithmetic === 1 ? "" : "s"} with an arithmetic error.`);
  }
  if (!parts.length) {
    return lang === "az"
      ? "Yoxlanılan sətirlər istinad qiymətinə yaxındır."
      : "Checked lines sit close to the reference price.";
  }
  return parts.join(" ");
};

export const scoreLines = (lines, prefs = { under: -15, over: 15 }) => {
  const under = Number(prefs.under);
  const over = Number(prefs.over);
  const included = lines.filter((line) => line.included);
  if (!included.length) {
    return {
      light: "amber",
      contractor_total: "0.00",
      reference_total: "0.00",
      deviation_pct: null,
      sentence_az: "Hələ təsdiqlənmiş sətir yoxdur. Uyğunluqları təsdiq edin.",
      sentence_en: "No confirmed lines yet. Confirm the matches to get a score.",
      parts: { wage: 0, machine: 0, material: 0, overhead: 0, profit: 0 },
      empty: true,
    };
  }
  const sum = (pick) => money(included.reduce((total, line) => total + Number(pick(line) || 0), 0));
  const contractor = sum((line) => line.contractor_amount);
  const reference = sum((line) => line.reference_amount);
  const parts = {
    wage: sum((line) => line.parts?.wage),
    machine: sum((line) => line.parts?.machine),
    material: sum((line) => line.parts?.material),
    overhead: sum((line) => line.parts?.overhead),
    profit: sum((line) => line.parts?.profit),
  };
  const deviation = reference === 0 ? null : percent(((contractor - reference) / reference) * 100);
  const severeCut = Number(prefs.severe ?? -30);
  const hasArithmetic = prefs.redArithmetic !== false && included.some((line) => line.flag === "arithmetic");
  const hasGap = prefs.redGap !== false && included.some((line) => line.flag === "gap");
  const severeUnder = included.some((line) => line.flag === "under" && Number(line.deviation_pct) <= severeCut);
  const anyUnder = included.some((line) => line.flag === "under");
  let light = "green";
  if (hasArithmetic || hasGap || severeUnder || (deviation != null && deviation <= under)) light = "red";
  else if (anyUnder || (deviation != null && deviation < under / 3) || (deviation != null && deviation > over)) light = "amber";
  return {
    light,
    contractor_total: contractor.toFixed(2),
    reference_total: reference.toFixed(2),
    deviation_pct: deviation == null ? null : String(deviation),
    sentence_az: sentence(included, "az"),
    sentence_en: sentence(included, "en"),
    parts,
  };
};
