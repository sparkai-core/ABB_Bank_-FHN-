const HEADERS = {
  work: new Set(["work", "name", "description", "item", "is", "ish", "iş", "tesvir", "təsvir", "ad", "itemdescription", "descriptionofwork", "workname", "itemname", "nameofwork", "наименование"]),
  unit: new Set(["unit", "vahid", "ed", "olcu", "ölçü", "ед", "measure", "uom"]),
  qty: new Set(["qty", "quantity", "miqdar", "miqdari", "miq", "кол", "count", "volume"]),
  rate: new Set(["rate", "price", "qiymet", "qiymət", "qiymeti", "vahidqiymet", "vahidqiymeti", "unitprice", "unitrate", "цена"]),
  amount: new Set(["amount", "sum", "mebleg", "məbləğ", "cemi", "cəmi", "сумма", "total", "value"]),
  code: new Set(["code", "kod", "шифр", "desn", "norm", "itemcode"]),
};

const SKIP_WORK = new Set(["total", "subtotal", "grandtotal", "cemi", "yekun", "итого", "sum", "cəmi"]);

const key = (cell) => String(cell ?? "")
  .replace(/İ/g, "i")
  .replace(/I/g, "i")
  .replace(/ı/g, "i")
  .trim()
  .toLowerCase()
  .replace(/[^0-9a-zəöüğışç]/g, "");

const asNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (/[a-zA-Zəöüğıİşç]/.test(raw)) return null;
  let text = raw.replace(/[\s\u00a0]/g, "");
  if (!text || /^[-.,()]+$/.test(text)) return null;
  const negative = text.startsWith("-") || (text.startsWith("(") && text.endsWith(")"));
  text = text.replace(/[^\d,.]/g, "");
  if (!text) return null;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    text = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const groups = text.split(",");
    text = groups.slice(1).every((part) => part.length === 3)
      ? groups.join("")
      : `${groups.slice(0, -1).join("")}.${groups.at(-1)}`;
  } else if ((text.match(/\./g) || []).length > 1) {
    const groups = text.split(".");
    if (groups.slice(1).every((part) => part.length === 3)) text = groups.join("");
  }
  const number = Number(text);
  if (!Number.isFinite(number)) return null;
  return negative ? -Math.abs(number) : number;
};

const decodeText = (bytes) => {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(data).replace(/^\uFEFF/, "");
  }
  if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(data).replace(/^\uFEFF/, "");
  }
  const encodings = ["utf-8", "windows-1254", "windows-1251"];
  for (const encoding of encodings) {
    try {
      const text = new TextDecoder(encoding, { fatal: true }).decode(data);
      if (text) return text.replace(/^\uFEFF/, "");
    } catch {
      // try the next encoding
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(data).replace(/^\uFEFF/, "");
};

const unescapeXml = (value) => String(value)
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const parseCsv = (text, preferPlain = false) => {
  const sample = text.slice(0, 4000);
  const delimiter = sample.split("\t").length > sample.split(";").length
    ? "\t"
    : sample.split(";").length > sample.split(",").length
      ? ";"
      : ",";
  if (preferPlain && !sample.includes(delimiter)) {
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => [line]);
  }
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((item) => String(item).trim())) rows.push(row);
      row = [];
      cell = "";
      if (char === "\r") i += 1;
      continue;
    }
    if (char === "\r") {
      row.push(cell);
      if (row.some((item) => String(item).trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell);
  if (row.some((item) => String(item).trim())) rows.push(row);
  return rows;
};

const u16 = (view, offset) => view.getUint16(offset, true);
const u32 = (view, offset) => view.getUint32(offset, true);

const inflateRaw = async (data) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot open compressed Office files. Use CSV or TXT.");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const inflateZlib = async (data) => {
  if (typeof DecompressionStream === "undefined") return null;
  let slice = data;
  while (slice.length && (slice[slice.length - 1] === 10 || slice[slice.length - 1] === 13 || slice[slice.length - 1] === 32)) {
    slice = slice.subarray(0, slice.length - 1);
  }
  for (const format of ["deflate", "deflate-raw"]) {
    try {
      const stream = new Blob([slice]).stream().pipeThrough(new DecompressionStream(format));
      const out = new Uint8Array(await new Response(stream).arrayBuffer());
      if (out.length) return out;
    } catch {
      // try the other deflate format
    }
  }
  return null;
};

const unzipLocal = async (bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = {};
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (u32(view, offset) !== 0x04034b50) break;
    const method = u16(view, offset + 8);
    const compressed = u32(view, offset + 18);
    const nameLen = u16(view, offset + 26);
    const extraLen = u16(view, offset + 28);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    const data = bytes.subarray(dataStart, dataStart + compressed);
    if (method === 0) files[name] = data;
    else if (method === 8) files[name] = await inflateRaw(data);
    else throw new Error("This Office file could not be opened.");
    offset = dataStart + compressed;
  }
  return files;
};

const unzip = async (bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  const min = Math.max(0, bytes.length - 22 - 65535);
  for (let i = bytes.length - 22; i >= min; i -= 1) {
    if (i + 4 <= bytes.length && u32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return unzipLocal(bytes);
  const count = u16(view, eocd + 10);
  let cursor = u32(view, eocd + 16);
  const files = {};
  for (let n = 0; n < count && cursor + 46 <= bytes.length; n += 1) {
    if (u32(view, cursor) !== 0x02014b50) break;
    const method = u16(view, cursor + 10);
    const compressed = u32(view, cursor + 20);
    const nameLen = u16(view, cursor + 28);
    const extraLen = u16(view, cursor + 30);
    const commentLen = u16(view, cursor + 32);
    const local = u32(view, cursor + 42);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));
    if (local + 30 <= bytes.length) {
      const localNameLen = u16(view, local + 26);
      const localExtraLen = u16(view, local + 28);
      const dataStart = local + 30 + localNameLen + localExtraLen;
      const data = bytes.subarray(dataStart, Math.min(bytes.length, dataStart + compressed));
      if (method === 0) files[name] = data;
      else if (method === 8 && data.length) files[name] = await inflateRaw(data);
    }
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return Object.keys(files).length ? files : unzipLocal(bytes);
};

const sharedStrings = (xml) => {
  const items = [];
  const blocks = xml.match(/<si[\s\S]*?<\/si>/g) || [];
  blocks.forEach((block) => {
    const parts = [...block.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => unescapeXml(match[1]));
    items.push(parts.join(""));
  });
  return items;
};

const sheetRows = (xml, shared) => {
  const rows = [];
  const rowBlocks = xml.match(/<row[\s\S]*?<\/row>/g) || [];
  rowBlocks.forEach((block) => {
    const values = [];
    const cells = block.match(/<c[\s\S]*?(?:\/>|<\/c>)/g) || [];
    cells.forEach((cell) => {
      const ref = (cell.match(/r="([A-Z]+)\d+"/i) || [])[1] || "";
      let index = 0;
      for (const char of ref) index = index * 26 + char.toUpperCase().charCodeAt(0) - 64;
      while (values.length < Math.max(index, 1)) values.push("");
      const kind = (cell.match(/\st="([^"]+)"/) || [])[1];
      let text = "";
      if (kind === "inlineStr") {
        text = [...cell.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join("");
      } else {
        const value = (cell.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || "";
        text = kind === "s" && /^\d+$/.test(value) ? (shared[Number(value)] || "") : value;
      }
      if (index > 0) values[index - 1] = unescapeXml(text);
    });
    if (values.some((item) => String(item).trim())) rows.push(values);
  });
  return rows;
};

const xlsxTable = async (bytes) => {
  const files = await unzip(bytes);
  return xlsxFromFiles(files);
};

const xlsxFromFiles = (files) => {
  const shared = files["xl/sharedStrings.xml"] ? sharedStrings(decodeText(files["xl/sharedStrings.xml"])) : [];
  const sheets = Object.keys(files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  if (!sheets.length) throw new Error("This Excel file has no sheet.");
  let best = [];
  sheets.forEach((name) => {
    const rows = sheetRows(decodeText(files[name]), shared);
    if (rows.length > best.length) best = rows;
  });
  return best;
};

const wordText = (xml) => [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => unescapeXml(match[1])).join("");

const docxFromFiles = (files) => {
  if (!files["word/document.xml"]) throw new Error("This Word file has no text.");
  const xml = decodeText(files["word/document.xml"]);
  const tableRows = [];
  const tables = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  tables.forEach((table) => {
    const tableRowsXml = table.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    tableRowsXml.forEach((tableRow) => {
      const cells = (tableRow.match(/<w:tc[\s\S]*?<\/w:tc>/g) || []).map((cell) => wordText(cell).trim());
      if (cells.some(Boolean)) tableRows.push(cells);
    });
  });
  if (tableRows.length) return tableRows;
  const lines = [];
  const paragraphs = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  paragraphs.forEach((paragraph) => {
    const line = wordText(paragraph).trim();
    if (line) lines.push(line);
  });
  return parseCsv(lines.join("\n"), true);
};

const docxTable = async (bytes) => docxFromFiles(await unzip(bytes));

const pdfStrings = (text) => {
  const chunks = [];
  const tokens = text.match(/\((?:\\.|[^\\)])*\)/g) || [];
  tokens.forEach((token) => {
    const value = token.slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, "\t")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    if (value.trim()) chunks.push(value);
  });
  return chunks;
};

const findBytes = (bytes, text, from = 0) => {
  const needle = [...text].map((char) => char.charCodeAt(0));
  for (let i = from; i <= bytes.length - needle.length; i += 1) {
    let found = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (bytes[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
};

const pdfText = async (bytes) => {
  const chunks = pdfStrings(decodeText(bytes));
  let cursor = 0;
  while (cursor < bytes.length) {
    const at = findBytes(bytes, "stream", cursor);
    if (at < 0) break;
    const before = decodeText(bytes.subarray(Math.max(0, at - 240), at));
    let start = at + "stream".length;
    if (bytes[start] === 13 && bytes[start + 1] === 10) start += 2;
    else if (bytes[start] === 10 || bytes[start] === 13) start += 1;
    const end = findBytes(bytes, "endstream", start);
    if (end < 0) break;
    if (before.includes("FlateDecode")) {
      const inflated = await inflateZlib(bytes.subarray(start, end));
      if (inflated) chunks.push(...pdfStrings(decodeText(inflated)));
    }
    cursor = end + "endstream".length;
  }
  const text = chunks.join("\n").trim();
  if (!text) throw new Error("This PDF has no readable text layer. Export CSV, Excel, or a text file.");
  return text;
};

const htmlTable = (text) => {
  const rows = [];
  const tableRows = text.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  tableRows.forEach((tableRow) => {
    const cells = [...tableRow.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((match) => unescapeXml(match[1].replace(/<[^>]+>/g, "")).trim());
    if (cells.some(Boolean)) rows.push(cells);
  });
  if (rows.length) return rows;
  const sheetRowsXml = text.match(/<Row[\s\S]*?<\/Row>/g) || [];
  sheetRowsXml.forEach((tableRow) => {
    const cells = [...tableRow.matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/g)].map((match) => unescapeXml(match[1]).trim());
    if (cells.some(Boolean)) rows.push(cells);
  });
  return rows;
};

const looksLikeHtml = (text) => /^\s*(<!doctype|<html|<table|<\?xml)/i.test(text);

const rowsFromTable = (table) => {
  if (!table.length) return [];
  let headerAt = -1;
  let best = 1;
  table.slice(0, 15).forEach((raw, index) => {
    const score = raw.reduce((total, cell) => {
      const fieldKey = key(cell);
      return total + (Object.values(HEADERS).some((names) => names.has(fieldKey)) ? 1 : 0);
    }, 0);
    if (score > best) {
      best = score;
      headerAt = index;
    }
  });
  const headerMap = {};
  let start = 0;
  if (headerAt >= 0) {
    table[headerAt].forEach((cell, column) => {
      const fieldKey = key(cell);
      Object.entries(HEADERS).forEach(([field, names]) => {
        if (names.has(fieldKey) && headerMap[field] == null) headerMap[field] = column;
      });
    });
    start = headerAt + 1;
  }
  const rows = [];
  table.slice(start).forEach((raw) => {
    const cells = raw.map((cell) => String(cell ?? "").trim());
    let work = "";
    let unit = "";
    let qty = null;
    let rate = null;
    let amount = null;
    let code = "";
    if (Object.keys(headerMap).length) {
      work = headerMap.work != null ? (cells[headerMap.work] || "") : "";
      unit = headerMap.unit != null ? (cells[headerMap.unit] || "") : "";
      qty = headerMap.qty != null ? asNumber(cells[headerMap.qty]) : null;
      rate = headerMap.rate != null ? asNumber(cells[headerMap.rate]) : null;
      amount = headerMap.amount != null ? asNumber(cells[headerMap.amount]) : null;
      code = headerMap.code != null ? (cells[headerMap.code] || "") : "";
    } else {
      const bits = (cells.length === 1 ? cells[0].split(/\s+/) : cells).map((cell) => String(cell).trim()).filter(Boolean);
      const numbers = [];
      while (bits.length && asNumber(bits.at(-1)) != null) numbers.unshift(asNumber(bits.pop()));
      if (bits.length && bits.at(-1).length <= 8 && /[a-zA-Zəöüğı0-9³²]/.test(bits.at(-1))) unit = bits.pop();
      work = bits.join(" ");
      qty = numbers[0] ?? null;
      rate = numbers[1] ?? null;
      amount = numbers[2] ?? null;
    }
    if (!work || HEADERS.work.has(key(work)) || SKIP_WORK.has(key(work))) return;
    const bare = !code && !unit && rate == null && amount == null && qty == null;
    if (bare) return;
    if (qty == null) qty = 1;
    if (amount == null && rate != null) amount = rate * qty;
    rows.push({ name: work, unit, qty, rate, amount, code: code.trim() });
  });
  return rows;
};

const sniff = (bytes) => {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) return "zip";
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  if (bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "ole";
  return "";
};

export const readFile = async (filename, bytes) => {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (!data.length) throw new Error("The file is empty.");
  const kind = filename.includes(".") ? filename.toLowerCase().split(".").pop() : "";
  const kindOf = sniff(data);
  if (kindOf === "ole" || kind === "xls") {
    const text = decodeText(data.slice(0, 400));
    if (!looksLikeHtml(text) && kindOf === "ole") {
      throw new Error("This is an old Excel file. Save it as .xlsx and upload that.");
    }
  }
  let table;
  if (kindOf === "zip" || kind === "xlsx" || kind === "xlsm" || kind === "docx") {
    const files = kindOf === "zip" || kind === "xlsx" || kind === "xlsm" || kind === "docx" ? await unzip(data) : null;
    if (files?.["word/document.xml"]) table = docxFromFiles(files);
    else if (files && Object.keys(files).some((name) => name.startsWith("xl/worksheets/"))) table = xlsxFromFiles(files);
    else if (kind === "docx") table = await docxTable(data);
    else if (kind === "xlsx" || kind === "xlsm") table = await xlsxTable(data);
    else throw new Error("This Office file could not be opened.");
  } else if (kindOf === "pdf" || kind === "pdf") table = parseCsv(await pdfText(data), true);
  else if (kind === "csv" || kind === "txt" || kind === "xls" || kind === "") {
    const text = decodeText(data);
    if (looksLikeHtml(text)) table = htmlTable(text);
    else table = parseCsv(text, kind === "txt" || kind === "");
  } else throw new Error("Use a CSV, Excel, PDF, Word, or text file.");
  const rows = rowsFromTable(table || []);
  if (!rows.length) throw new Error("No lines of work were found in this file.");
  return { rows, kind: kind || kindOf || "file" };
};
