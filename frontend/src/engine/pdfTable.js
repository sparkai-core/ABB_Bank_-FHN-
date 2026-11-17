// Rebuilds table rows from a PDF with pdf.js: text items on the same line become one row,
// and a wide horizontal gap starts a new cell. Loaded only when a PDF is uploaded.
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_PAGES = 200;

export const pdfTable = async (bytes) => {
  const doc = await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  const rows = [];
  const pages = Math.min(doc.numPages, MAX_PAGES);
  for (let number = 1; number <= pages; number += 1) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => item.str && item.str.trim())
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        size: Math.abs(item.transform[3]) || 10,
      }));
    // Group by baseline, top of the page first
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    items.forEach((item) => {
      const line = lines.find((entry) => Math.abs(entry.y - item.y) <= Math.max(2, item.size * 0.35));
      if (line) line.items.push(item);
      else lines.push({ y: item.y, items: [item] });
    });
    lines.forEach((line) => {
      line.items.sort((a, b) => a.x - b.x);
      const cells = [];
      let cell = "";
      let end = null;
      line.items.forEach((item) => {
        const gap = end == null ? 0 : item.x - end;
        if (end != null && gap > item.size * 1.2) {
          cells.push(cell.trim());
          cell = "";
        } else if (end != null && gap > item.size * 0.15 && !cell.endsWith(" ")) {
          cell += " ";
        }
        cell += item.text;
        end = item.x + item.width;
      });
      if (cell.trim()) cells.push(cell.trim());
      if (cells.length) rows.push(cells);
    });
    page.cleanup();
  }
  await doc.destroy();
  return rows;
};
