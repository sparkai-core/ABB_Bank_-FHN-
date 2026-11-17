import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { copy, money, signed } from "../copy.js";
import { readPrefs } from "./prefs.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 32;

const ink = rgb(0.06, 0.07, 0.09);
const muted = rgb(0.38, 0.41, 0.46);
const line = rgb(0.86, 0.88, 0.91);
const brand = rgb(0.106, 0.388, 0.929);
const soft = rgb(0.95, 0.96, 0.98);
const flagColor = {
  under: rgb(0.75, 0.15, 0.1),
  gap: rgb(0.75, 0.15, 0.1),
  arithmetic: rgb(0.75, 0.15, 0.1),
  over: rgb(0.1, 0.31, 0.77),
  close: rgb(0.06, 0.48, 0.38),
};

const fold = (value) => String(value ?? "")
  .replaceAll("Ə", "E")
  .replaceAll("ə", "e")
  .replaceAll("Ö", "O")
  .replaceAll("ö", "o")
  .replaceAll("Ü", "U")
  .replaceAll("ü", "u")
  .replaceAll("Ğ", "G")
  .replaceAll("ğ", "g")
  .replaceAll("İ", "I")
  .replaceAll("I", "I")
  .replaceAll("ı", "i")
  .replaceAll("Ş", "S")
  .replaceAll("ş", "s")
  .replaceAll("Ç", "C")
  .replaceAll("ç", "c")
  .replaceAll("—", "-")
  .replaceAll("−", "-");

const wrapText = (font, text, size, maxWidth) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const pieces = [];
    let piece = "";
    [...word].forEach((char) => {
      const next = piece + char;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) piece = next;
      else {
        if (piece) pieces.push(piece);
        piece = char;
      }
    });
    if (piece) pieces.push(piece);
    pieces.forEach((part) => {
      const next = current ? `${current} ${part}` : part;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
      else {
        if (current) lines.push(current);
        current = part;
      }
    });
  });
  if (current) lines.push(current);
  return lines;
};

export const buildReportPdf = async (review, lang, fontBytes) => {
  const text = copy[lang] || copy.en;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const embedded = fontBytes ? await pdf.embedFont(fontBytes, { subset: true }) : null;
  const font = embedded || await pdf.embedFont(StandardFonts.Helvetica);
  const show = (value) => (embedded ? String(value ?? "") : fold(value));
  const title = lang === "az" ? review.title_az : review.title_en;
  const sentence = lang === "az" ? review.score.sentence_az : review.score.sentence_en;
  const notice = lang === "az" ? review.notice_az : review.notice_en;
  const decisionKey = review.decision?.choice;
  const decision = decisionKey && text[decisionKey] ? text[decisionKey] : text.noDecision;
  const note = review.decision?.note || "";
  const reportLines = readPrefs().reportLines === "flagged"
    ? review.lines.filter((item) => ["under", "over", "arithmetic", "unit", "gap"].includes(item.flag) || item.match === "needs_review")
    : review.lines;
  const columns = [
    { label: text.work, width: 196 },
    { label: text.unit, width: 42 },
    { label: text.qty, width: 48 },
    { label: text.theirRate, width: 74 },
    { label: text.refRate, width: 74 },
    { label: text.deviation, width: 58 },
    { label: text.status, width: 62 },
  ];
  const contentWidth = columns.reduce((sum, column) => sum + column.width, 0);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensure = (height) => {
    if (y - height < 48) newPage();
  };

  const drawLines = (lines, size, color, gap = 3) => {
    lines.forEach((row) => {
      ensure(size + gap);
      page.drawText(show(row), { x: MARGIN, y: y - size, size, font, color });
      y -= size + gap;
    });
  };

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: brand });
  drawLines(wrapText(font, show(text.product), 11, contentWidth), 11, brand, 2);
  y -= 4;
  drawLines(wrapText(font, show(title), 18, contentWidth), 18, ink, 3);
  y -= 6;
  drawLines(wrapText(font, show(notice), 8.5, contentWidth), 8.5, muted, 2);
  y -= 10;

  const facts = [
    [text.contractor, money(review.score.contractor_total)],
    [text.reference, money(review.score.reference_total)],
    [text.difference, signed(review.score.deviation_pct) || ""],
    [text.codeLabel, text.light[review.score.light] || ""],
  ];
  ensure(36);
  facts.forEach((fact, index) => {
    const x = MARGIN + (index % 4) * (contentWidth / 4);
    page.drawText(show(fact[0]), { x, y: y - 9, size: 8, font, color: muted });
    page.drawText(show(fact[1]), { x, y: y - 24, size: 12, font, color: ink });
  });
  y -= 40;
  drawLines(wrapText(font, show(sentence), 10, contentWidth), 10, ink, 3);
  y -= 4;
  const decidedAt = review.decision?.at
    ? new Date(review.decision.at).toLocaleString(lang === "az" ? "az-AZ" : "en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "";
  drawLines(wrapText(font, show(`${text.saved}: ${decision}${review.decision?.by ? `, ${review.decision.by}` : ""}${decidedAt ? `, ${decidedAt}` : ""}${note ? `. ${note}` : ""}`), 9, contentWidth), 9, muted, 2);
  reportLines.filter((item) => item.confirmed_by).forEach((item) => {
    const when = item.confirmed_at
      ? new Date(item.confirmed_at).toLocaleString(lang === "az" ? "az-AZ" : "en-GB", { dateStyle: "medium", timeStyle: "short" })
      : "";
    drawLines(wrapText(font, show(`${text.confirm}: ${item.code}, ${item.confirmed_by}${when ? `, ${when}` : ""}`), 8, contentWidth), 8, muted, 1);
  });
  y -= 12;

  const drawHeader = () => {
    ensure(22);
    page.drawRectangle({ x: MARGIN, y: y - 18, width: contentWidth, height: 18, color: soft });
    let x = MARGIN + 4;
    columns.forEach((column) => {
      page.drawText(show(column.label), { x, y: y - 13, size: 8, font, color: muted });
      x += column.width;
    });
    y -= 18;
  };

  drawHeader();
  reportLines.forEach((item) => {
    const name = lang === "az" ? item.name_az : item.name_en;
    const cells = [
      `${item.code}  ${name}`,
      item.unit || "",
      String(item.qty ?? ""),
      money(item.contractor_rate),
      money(item.reference_rate),
      signed(item.deviation_pct) || "",
      text.flags[item.flag] || "",
    ].map((cell, index) => wrapText(font, show(cell), 8, columns[index].width - 8));
    const rowHeight = Math.max(...cells.map((rows) => rows.length)) * 11 + 8;
    if (y - rowHeight < 48) {
      newPage();
      drawHeader();
    }
    let x = MARGIN;
    cells.forEach((rows, index) => {
      const color = index === 6 ? (flagColor[item.flag] || ink) : ink;
      rows.forEach((row, rowIndex) => {
        const alignRight = index >= 2 && index <= 5;
        const textWidth = font.widthOfTextAtSize(row, 8);
        const textX = alignRight ? x + columns[index].width - 6 - textWidth : x + 4;
        page.drawText(row, { x: textX, y: y - 12 - rowIndex * 11, size: 8, font, color });
      });
      x += columns[index].width;
    });
    y -= rowHeight;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + contentWidth, y },
      thickness: 0.4,
      color: line,
    });
  });

  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    item.drawText(show(`${text.independent}   ${index + 1} / ${pages.length}`), {
      x: MARGIN,
      y: 22,
      size: 8,
      font,
      color: muted,
    });
  });

  return pdf.save();
};

export const downloadReportPdf = async (review, lang) => {
  const response = await fetch("/fonts/NotoSans-Regular.ttf");
  const fontBytes = response.ok ? await response.arrayBuffer() : null;
  const bytes = await buildReportPdf(review, lang, fontBytes);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const title = (lang === "az" ? review.title_az : review.title_en) || "report";
  link.href = url;
  const base = title.replace(/\.(csv|txt|xlsx?|xlsm|pdf|docx?)$/i, "").replace(/[\\/:*?"<>|]+/g, " ").trim();
  link.download = `${base} report.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
