/**
 * Genetic Service for Genus Animus Backend
 * Manages gene mutation, costs, and antagonist penalties.
 * Identical calculations to frontend.
 */

const ANTAGONISTS = {
  cognition: { target: 'substrate', weak: true },
  adaptability: { target: 'cohesion', weak: false },
  cohesion: { target: 'adaptability', weak: false },
  metabolism: { target: 'collectiveMemory', weak: false },
  substrate: { target: 'cognition', weak: true },
  collectiveMemory: { target: 'metabolism', weak: false }
};

const getMutationDetails = (currentValue, isWeakTension = false) => {
  let cost = 10;
  let increase = 0.10;
  let decrease = 0.03;

  if (currentValue >= 0.80) {
    cost = 30;
    decrease = 0.05;
  } else if (currentValue >= 0.60) {
    cost = 20;
    decrease = 0.04;
  }

  if (isWeakTension) {
    decrease = Math.round((decrease / 2) * 100) / 100;
  }

  return { cost, increase, decrease };
};

const mutateGene = (genes, geneName, dnaFragments) => {
  const currentVal = genes[geneName];
  if (currentVal >= 1.00) {
    return { error: 'gene_already_maximized' };
  }

  const antagonistInfo = ANTAGONISTS[geneName];
  const { cost, increase, decrease } = getMutationDetails(currentVal, antagonistInfo?.weak);

  if (dnaFragments < cost) {
    return { error: 'insufficient_fragments' };
  }

  const newGenes = { ...genes };
  newGenes[geneName] = Math.min(1.00, Math.round((currentVal + increase) * 100) / 100);

  if (antagonistInfo) {
    const antName = antagonistInfo.target;
    const antVal = genes[antName];
    const newAntVal = Math.max(0.01, Math.round((antVal - decrease) * 100) / 100);
    newGenes[antName] = newAntVal;
  }

  return {
    genes: newGenes,
    cost
  };
};

module.exports = {
  ANTAGONISTS,
  getMutationDetails,
  mutateGene
};
