import json
import re
from pathlib import Path

parts = []
folder = Path(r"d:\FHN\frontend\public\sources")
for name in ("arxkom-smeta.html", "arxkom-smeta-2.html", "arxkom-smeta-3.html"):
    path = folder / name
    if path.exists():
        parts.append(path.read_text(encoding="utf-8", errors="replace"))
html = "\n".join(parts)
pattern = re.compile(
    r'href="(https://arxkom.gov.az/qanunvericilik/normativler/smeta-normalari/[^"]+)"[^>]*>(.*?)</a>',
    re.S,
)
seen = set()
items = []
for href, inner in pattern.findall(html):
    if href in seen:
        continue
    seen.add(href)
    text = re.sub(r"<[^>]+>", " ", inner)
    text = re.sub(r"\s+", " ", text).strip()
    if not text or text in {"AZ", "EN", "RU"}:
        continue
    items.append({"title": text, "href": href})

out = Path(r"d:\FHN\frontend\src\engine\arxkom-smeta.json")
out.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(items))
