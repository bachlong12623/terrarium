export const SUCCULENT = {
  id: 'succulent',
  name: 'Sen đá',
  description: 'Chịu khô, thích sáng. Cách chăm quyết định hình dáng cuối.',
  branches: [
    {
      id: 'rosette',
      label: 'Đồng minh',
      hint: 'Tưới vừa phải, ánh sáng đều',
      score: (care) => {
        const balanced = 100 - Math.abs(care.humid - care.radiant);
        return balanced * 1.2 + Math.min(care.humid, care.radiant) * 0.3;
      },
    },
    {
      id: 'desert',
      label: 'Sa mạc',
      hint: 'Ít tưới, nhiều nắng',
      score: (care) => care.radiant * 1.4 + (100 - care.humid) * 0.8,
    },
    {
      id: 'garden',
      label: 'Vườn',
      hint: 'Ẩm vừa, không tỉa, bón phân',
      score: (care) => care.humid * 1.1 + care.fertilizeCount * 25 + (care.pruneCount === 0 ? 30 : 0),
    },
  ],
};

export const PLANTS = {
  succulent: SUCCULENT,
};

export function getPlantDef(id) {
  return PLANTS[id] ?? SUCCULENT;
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
