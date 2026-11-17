// Cabinet Decision No. 150 of 25 May 2021, Annexes 1 and 2.
// Percents of the wage fund (workers + machinists). Restoration follows Annex 1.1.4 / 2.1.4.
const NORMS = {
  construction: { overhead: 0.9, profit: 0.52 },
  repair: { overhead: 0.8, profit: 0.4 },
  commissioning: { overhead: 0.55, profit: 0.32 },
  restoration: { overhead: 0.9, profit: 0.52 },
};

const D = (value) => Number(value);

export const money = (value) => Math.round(D(value) * 100 + Number.EPSILON) / 100;

export const percent = (value) => Math.round(D(value) * 10 + Number.EPSILON) / 10;

export const rateParts = (labor, machinist, machine, material, workType = "construction", indexFactor = 1) => {
  const rates = NORMS[workType];
  const scale = D(indexFactor);
  const wage = (D(labor) + D(machinist)) * scale;
  const machineCost = D(machine) * scale;
  const materialCost = D(material) * scale;
  const overhead = (D(labor) + D(machinist)) * rates.overhead * scale;
  const profit = (D(labor) + D(machinist)) * rates.profit * scale;
  return {
    wage: money(wage),
    machine: money(machineCost),
    material: money(materialCost),
    overhead: money(overhead),
    profit: money(profit),
    total: money(wage + machineCost + materialCost + overhead + profit),
  };
};

export const unitRate = (labor, machinist, machine, material, workType = "construction", indexFactor = 1) => (
  rateParts(labor, machinist, machine, material, workType, indexFactor).total
);
