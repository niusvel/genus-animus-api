const gameModel = require('../models/gameModel');
const geneticService = require('../services/geneticService');
const { calculatePhenotype } = require('../services/phenotypeCalculator');
const checkpointModel = require('../models/checkpointModel');
const crypto = require('crypto');

const isSameInventory = (inv1, inv2) => {
  if (!inv1 || !inv2 || inv1.length !== inv2.length) return false;
  const serialize = items => [...items].map(i => `${i.id || i.name}:${!!i.equipped}`).sort().join('|');
  return serialize(inv1) === serialize(inv2);
};

const isSameFlags = (flags1, flags2) => {
  if (!flags1 || !flags2) return false;
  const keys1 = Object.keys(flags1).filter(k => flags1[k]);
  const keys2 = Object.keys(flags2).filter(k => flags2[k]);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(k => flags1[k] === flags2[k]);
};

// Mapping of Spanish request gene names to English variables
const GENE_NAME_MAP = {
  cognicion: 'cognition',
  cognition: 'cognition',
  adaptabilidad: 'adaptability',
  adaptability: 'adaptability',
  cohesion: 'cohesion',
  metabolismo: 'metabolism',
  metabolism: 'metabolism',
  sustrato: 'substrate',
  substrate: 'substrate',
  memoria_colectiva: 'collectiveMemory',
  collectiveMemory: 'collectiveMemory',
};

const getState = async (req, res) => {
  const userId = req.user.id;
  try {
    const game = await gameModel.findByUserId(userId);
    if (!game) {
      return res.status(404).json({ error: 'game_not_found' });
    }

    // Format DB fields to API contract (Spanish)
    return res.status(200).json({
      escena_actual: game.current_scene,
      checkpoint_actual: game.current_checkpoint,
      fenotipo_dominante: game.dominant_phenotype,
      fragmentos_adn: game.dna_fragments,
      enemigos_derrotados: game.defeated_enemies,
      genes: {
        cognicion: game.gene_cognition,
        adaptabilidad: game.gene_adaptability,
        cohesion: game.gene_cohesion,
        metabolismo: game.gene_metabolism,
        sustrato: game.gene_substrate,
        memoria_colectiva: game.gene_collective_memory,
      },
      inventario: game.inventory,
      flags: game.flags,
    });
  } catch (err) {
    console.error('getState controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

const mutate = async (req, res) => {
  const userId = req.user.id;
  const { gen } = req.body;

  if (!gen) {
    return res.status(400).json({ error: 'missing_gene' });
  }

  const englishGeneName = GENE_NAME_MAP[gen];
  if (!englishGeneName) {
    return res.status(400).json({ error: 'invalid_gene_name' });
  }

  try {
    const game = await gameModel.findByUserId(userId);
    if (!game) {
      return res.status(404).json({ error: 'game_not_found' });
    }

    const currentGenes = {
      cognition: game.gene_cognition,
      adaptability: game.gene_adaptability,
      cohesion: game.gene_cohesion,
      metabolism: game.gene_metabolism,
      substrate: game.gene_substrate,
      collectiveMemory: game.gene_collective_memory,
    };

    const result = geneticService.mutateGene(currentGenes, englishGeneName, game.dna_fragments);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const newPhenotype = calculatePhenotype(result.genes);
    const remainingFragments = game.dna_fragments - result.cost;

    // Save mutations in database
    await gameModel.updateMutation(userId, result.genes, remainingFragments, newPhenotype);

    // Return updated details mapped to Spanish contract
    return res.status(200).json({
      genes: {
        cognicion: result.genes.cognition,
        adaptabilidad: result.genes.adaptability,
        cohesion: result.genes.cohesion,
        metabolismo: result.genes.metabolism,
        sustrato: result.genes.substrate,
        memoria_colectiva: result.genes.collectiveMemory,
      },
      fragmentos_adn: remainingFragments,
      fenotipo_dominante: newPhenotype,
    });
  } catch (err) {
    console.error('mutate controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

const checkpoint = async (req, res) => {
  const userId = req.user.id;
  const { 
    current_scene, 
    defeated_enemies, 
    genes, 
    dna_fragments, 
    dominant_phenotype, 
    inventory, 
    flags 
  } = req.body;

  if (!current_scene) {
    return res.status(400).json({ error: 'missing_scene' });
  }

  try {
    // 1. Fetch checkpoints for this user and scene
    const existing = await checkpointModel.findCheckpointsByUserAndScene(userId, current_scene);
    
    let matchedCheckpoint = null;
    if (existing && existing.length > 0) {
      for (const cp of existing) {
        const genesMatch = cp.gene_cognition === genes.cognition &&
                           cp.gene_adaptability === genes.adaptability &&
                           cp.gene_cohesion === genes.cohesion &&
                           cp.gene_metabolism === genes.metabolism &&
                           cp.gene_substrate === genes.substrate &&
                           cp.gene_collective_memory === genes.collectiveMemory;
        
        const basicMatch = cp.dna_fragments === dna_fragments &&
                           cp.defeated_enemies === defeated_enemies &&
                           cp.dominant_phenotype === dominant_phenotype;

        if (genesMatch && basicMatch && isSameInventory(cp.inventory, inventory) && isSameFlags(cp.flags, flags)) {
          matchedCheckpoint = cp;
          break;
        }
      }
    }

    const payload = {
      id: matchedCheckpoint ? matchedCheckpoint.id : crypto.randomUUID(),
      user_id: userId,
      checkpoint_name: current_scene,
      current_scene,
      defeated_enemies,
      gene_cognition: genes.cognition,
      gene_adaptability: genes.adaptability,
      gene_cohesion: genes.cohesion,
      gene_metabolism: genes.metabolism,
      gene_substrate: genes.substrate,
      gene_collective_memory: genes.collectiveMemory,
      dna_fragments,
      dominant_phenotype,
      inventory,
      flags
    };

    if (matchedCheckpoint) {
      // Update existing checkpoint timestamp and state
      await checkpointModel.updateCheckpointTimestamp(matchedCheckpoint.id, payload);
    } else {
      // Create new checkpoint
      await checkpointModel.createCheckpoint(payload);
    }

    // Update main games table
    const game = await gameModel.findByUserId(userId);
    if (game) {
      const updatedGameData = {
        current_scene,
        current_checkpoint: current_scene,
        defeated_enemies,
        gene_cognition: genes.cognition,
        gene_adaptability: genes.adaptability,
        gene_cohesion: genes.cohesion,
        gene_metabolism: genes.metabolism,
        gene_substrate: genes.substrate,
        gene_collective_memory: genes.collectiveMemory,
        dna_fragments,
        dominant_phenotype,
        inventory,
        flags
      };
      await gameModel.updateGame(userId, updatedGameData);
    }

    return res.status(200).json({ saved: true, checkpointName: current_scene });
  } catch (err) {
    console.error('checkpoint controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

const getCheckpoints = async (req, res) => {
  const userId = req.user.id;
  try {
    const list = await checkpointModel.findCheckpointsByUserId(userId);
    return res.status(200).json(list);
  } catch (err) {
    console.error('getCheckpoints controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

const loadCheckpoint = async (req, res) => {
  const userId = req.user.id;
  const { checkpointId } = req.body;

  if (!checkpointId) {
    return res.status(400).json({ error: 'missing_checkpoint_id' });
  }

  try {
    const cp = await checkpointModel.findById(checkpointId);
    if (!cp || cp.user_id !== userId) {
      return res.status(404).json({ error: 'checkpoint_not_found' });
    }

    // Update main game progress with checkpoint snapshot
    const updatedGameData = {
      current_scene: cp.current_scene,
      current_checkpoint: cp.checkpoint_name,
      defeated_enemies: cp.defeated_enemies,
      gene_cognition: cp.gene_cognition,
      gene_adaptability: cp.gene_adaptability,
      gene_cohesion: cp.gene_cohesion,
      gene_metabolism: cp.gene_metabolism,
      gene_substrate: cp.gene_substrate,
      gene_collective_memory: cp.gene_collective_memory,
      dna_fragments: cp.dna_fragments,
      dominant_phenotype: cp.dominant_phenotype,
      inventory: cp.inventory,
      flags: cp.flags
    };
    await gameModel.updateGame(userId, updatedGameData);

    // Return the updated game state
    return res.status(200).json({
      escena_actual: cp.current_scene,
      checkpoint_actual: cp.checkpoint_name,
      fenotipo_dominante: cp.dominant_phenotype,
      fragmentos_adn: cp.dna_fragments,
      enemigos_derrotados: cp.defeated_enemies,
      genes: {
        cognicion: cp.gene_cognition,
        adaptabilidad: cp.gene_adaptability,
        cohesion: cp.gene_cohesion,
        metabolismo: cp.gene_metabolism,
        sustrato: cp.gene_substrate,
        memoria_colectiva: cp.gene_collective_memory,
      },
      inventario: cp.inventory,
      flags: cp.flags,
    });
  } catch (err) {
    console.error('loadCheckpoint controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

const inventory = async (req, res) => {
  const userId = req.user.id;
  const { inventario } = req.body;

  if (!inventario) {
    return res.status(400).json({ error: 'missing_inventory' });
  }

  try {
    await gameModel.updateInventory(userId, inventario);
    return res.status(200).json({ updated: true });
  } catch (err) {
    console.error('inventory controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

module.exports = {
  getState,
  mutate,
  checkpoint,
  inventory,
  getCheckpoints,
  loadCheckpoint,
};
