export const CACTUS = {
  id: 'cactus',
  name: 'Xương rồng',
  icon: '🌵',
  description: 'Chịu khô, thân mọng. Cách chăm quyết định hình dáng cuối.',
  branches: [
    {
      id: 'column',
      label: 'Cột',
      hint: 'Tưới vừa, ánh sáng đều — thân thẳng cao',
      score: (care) => {
        const balanced = 100 - Math.abs(care.humid - care.radiant);
        return balanced * 1.2 + Math.min(care.humid, care.radiant) * 0.3;
      },
    },
    {
      id: 'saguaro',
      label: 'Tay vươn',
      hint: 'Ít tưới, nhiều nắng — mọc cánh tay',
      score: (care) => care.radiant * 1.4 + (100 - care.humid) * 0.8,
    },
    {
      id: 'cluster',
      label: 'Bụi',
      hint: 'Ẩm vừa, bón phân — mọc thành cụm',
      score: (care) => care.humid * 1.1 + care.fertilizeCount * 25 + (care.pruneCount === 0 ? 30 : 0),
    },
  ],
};

export const FERN = {
  id: 'fern',
  name: 'Dương xỉ',
  icon: '🍃',
  description: 'Ưa ẩm, lá mềm. Nước và ánh sáng định hình tán lá.',
  branches: [
    {
      id: 'canopy',
      label: 'Rừng',
      hint: 'Ẩm cao + bón phân — tán rộng',
      score: (care) => care.humid * 1.3 + care.fertilizeCount * 22 + care.mistCount * 8,
    },
    {
      id: 'cascade',
      label: 'Thác',
      hint: 'Phun sương + xoay bình — lá rủ',
      score: (care) => care.mistCount * 18 + care.rotateCount * 14 + care.humid * 0.6,
    },
    {
      id: 'column',
      label: 'Cột',
      hint: 'Sáng vừa, ít tưới — vươn cao',
      score: (care) => care.radiant * 1.2 + (100 - care.humid) * 0.7,
    },
  ],
};

export const PLANTS = {
  cactus: CACTUS,
  fern: FERN,
};

const LEGACY_SPECIES = { succulent: 'cactus' };
const LEGACY_BRANCHES = {
  succulent: { rosette: 'column', desert: 'saguaro', garden: 'cluster' },
};

export function normalizeSpeciesId(id) {
  return LEGACY_SPECIES[id] ?? id ?? 'cactus';
}

export function normalizeBranch(speciesId, branchId) {
  if (!branchId) return branchId;
  const species = normalizeSpeciesId(speciesId);
  const legacy = LEGACY_BRANCHES[speciesId] ?? LEGACY_BRANCHES.succulent;
  if (species === 'cactus' && legacy[branchId]) return legacy[branchId];
  return branchId;
}

export function getPlantDef(id) {
  return PLANTS[normalizeSpeciesId(id)] ?? CACTUS;
}

export function resolveBranch(speciesId, care) {
  const plantDef = getPlantDef(speciesId);
  let best = plantDef.branches[0];
  let bestScore = -1;

  for (const branch of plantDef.branches) {
    const score = branch.score(care);
    if (score > bestScore) {
      bestScore = score;
      best = branch;
    }
  }

  return best.id;
}

export function getBranchScores(speciesId, care) {
  const plantDef = getPlantDef(speciesId);
  return plantDef.branches.map((b) => ({
    id: b.id,
    label: b.label,
    hint: b.hint,
    score: b.score(care),
  }));
}
