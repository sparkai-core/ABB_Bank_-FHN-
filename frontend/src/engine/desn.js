import catalogue from "./desn-catalogue.json";

const byCode = new Map(catalogue.map((item) => [item.code, item]));

const byCodeRules = [
  [/^16-03/, "DESN-91-02-18-2021-D1"],
  [/^16-02/, "DESNt-91-04-66-2021-D1"],
  [/^16-01/, "DESN-91-02-17-2021-D1"],
  [/^12-/, "DESN-91-02-12-2021-D1"],
  [/^11-02/, "DESN-91-02-11-2021-D1"],
  [/^11-/, "DESN-91-02-15-2021-D1"],
  [/^08-/, "DESN-91-02-08-2021-D1"],
  [/^06-/, "DESN-91-02-06-2021-D1"],
  [/^01-/, "DESN-91-02-01-2021-D1"],
];

const byNameRules = [
  [/excav|trench|qaz|torpaq|backfill|gravel|compaction|spoil|dig|hardcore/, "DESN-91-02-01-2021-D1"],
  [/concrete|beton|formwork|reinforc|stair|joint|waterproof/, "DESN-91-02-06-2021-D1"],
  [/brick|block|mason|lintel|cill/, "DESN-91-02-08-2021-D1"],
  [/tile|skirting|floor/, "DESN-91-02-11-2021-D1"],
  [/plaster|paint|door|window|render|ceiling|ironmong/, "DESN-91-02-15-2021-D1"],
  [/roof|gutter|membrane|tiling|vapour/, "DESN-91-02-12-2021-D1"],
  [/heat|radiator|valve|manifold/, "DESN-91-02-18-2021-D1"],
  [/cable|light|socket|board|earthing|alarm|data/, "DESNt-91-04-66-2021-D1"],
  [/pipe|drain|sanitar|water|gully|basin|stack/, "DESN-91-02-17-2021-D1"],
];

export const desnFor = (code = "", name = "") => {
  const coded = byCodeRules.find(([pattern]) => pattern.test(code));
  const named = byNameRules.find(([pattern]) => pattern.test(String(name).toLowerCase()));
  const id = (coded && coded[1]) || (named && named[1]) || "";
  return byCode.get(id) || null;
};
