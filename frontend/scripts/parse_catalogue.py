import json
import re
from pathlib import Path

text = Path(r"C:\Users\Mustafa Subhani\.cursor\projects\d-FHN\agent-tools\40ce60df-9afd-4f91-9986-8137c7da6399.txt").read_text(encoding="utf-8", errors="replace")
start = text.find("##### 4. Smeta normaları")
end = text.find("##### 5.", start)
chunk = text[start:end if end > start else start + 20000]
lines = [re.sub(r"\s+", " ", line).strip(" |") for line in chunk.splitlines()]
lines = [line for line in lines if line and not line.startswith("---") and line != "-“-"]

items = []
code = ""
title = []
approval = "FHN, 7 iyun 2022, № 20/01-002"

def flush():
    global code, title
    if code:
        name = " ".join(title).replace("-“-", "").strip(" -")
        name = re.sub(r"Azərbaycan Respublikası.*", "", name).strip(" -")
        if name:
            items.append({"code": re.sub(r"\s+", "", code), "title": name, "approval": approval})
    code = ""
    title = []

for line in lines:
    if line.startswith("#####"):
        flush()
        continue
    if re.match(r"DESN", line) and not line.startswith("DESN "):
        flush()
        parts = line.split()
        code = parts[0]
        rest = " ".join(parts[1:]).strip()
        if rest and rest != "-“-":
            title.append(rest)
        continue
    if line.startswith("| DESN"):
        flush()
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if cells:
            code = cells[0]
            if len(cells) > 1:
                title.append(cells[1])
        continue
    if code and line and not line.startswith("Azərbaycan Respublikası Fövqəladə"):
        if line in {"-“-", "-“- (Kitab 1)", "(Kitab 1; kitab 2)"}:
            continue
        title.append(line)

flush()
unique = []
seen = set()
for item in items:
    if item["code"] in seen:
        continue
    seen.add(item["code"])
    unique.append(item)

out = Path(r"d:\FHN\frontend\src\engine\desn-catalogue.json")
out.write_text(json.dumps(unique, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(unique))
for item in unique[:12]:
    print(item["code"], item["title"][:80])
