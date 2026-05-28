const db = require('../db/client');

// Helper to parse DB row JSON fields
const parseGameRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    inventory: JSON.parse(row.inventory || '[]'),
    flags: JSON.parse(row.flags || '{}'),
    morfologia: row.morfologia ? JSON.parse(row.morfologia) : null,
  };
};

const findByUserId = async (userId) => {
  const query = 'SELECT * FROM games WHERE user_id = ? LIMIT 1;';
  const result = await db.execute({
    sql: query,
    args: [userId],
  });
  return parseGameRow(result.rows[0]) || null;
};

const createGame = async (gameData) => {
  const query = `
    INSERT INTO games (
      id, user_id, current_scene, current_checkpoint, defeated_enemies,
      gene_cognition, gene_adaptability, gene_cohesion, gene_metabolism,
      gene_substrate, gene_collective_memory, dna_fragments,
      dominant_phenotype, morfologia, inventory, flags
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?
    );
  `;

  await db.execute({
    sql: query,
    args: [
      gameData.id,
      gameData.user_id,
      gameData.current_scene,
      gameData.current_checkpoint,
      gameData.defeated_enemies,
      gameData.gene_cognition,
      gameData.gene_adaptability,
      gameData.gene_cohesion,
      gameData.gene_metabolism,
      gameData.gene_substrate,
      gameData.gene_collective_memory,
      gameData.dna_fragments,
      gameData.dominant_phenotype,
      gameData.morfologia ? JSON.stringify(gameData.morfologia) : null,
      JSON.stringify(gameData.inventory),
      JSON.stringify(gameData.flags),
    ],
  });

  return gameData;
};

const updateGame = async (userId, gameData) => {
  const query = `
    UPDATE games SET
      current_scene = ?,
      current_checkpoint = ?,
      defeated_enemies = ?,
      gene_cognition = ?,
      gene_adaptability = ?,
      gene_cohesion = ?,
      gene_metabolism = ?,
      gene_substrate = ?,
      gene_collective_memory = ?,
      dna_fragments = ?,
      dominant_phenotype = ?,
      morfologia = ?,
      inventory = ?,
      flags = ?,
      updated_at = datetime('now')
    WHERE user_id = ?;
  `;

  await db.execute({
    sql: query,
    args: [
      gameData.current_scene,
      gameData.current_checkpoint,
      gameData.defeated_enemies,
      gameData.gene_cognition,
      gameData.gene_adaptability,
      gameData.gene_cohesion,
      gameData.gene_metabolism,
      gameData.gene_substrate,
      gameData.gene_collective_memory,
      gameData.dna_fragments,
      gameData.dominant_phenotype,
      gameData.morfologia ? JSON.stringify(gameData.morfologia) : null,
      JSON.stringify(gameData.inventory),
      JSON.stringify(gameData.flags),
      userId,
    ],
  });
};

const updateCheckpoint = async (userId, checkpoint, currentScene, flags) => {
  const query = `
    UPDATE games SET
      current_checkpoint = ?,
      current_scene = ?,
      flags = ?,
      updated_at = datetime('now')
    WHERE user_id = ?;
  `;
  await db.execute({
    sql: query,
    args: [checkpoint, currentScene, JSON.stringify(flags), userId],
  });
};

const updateInventory = async (userId, inventoryList) => {
  const query = `
    UPDATE games SET
      inventory = ?,
      updated_at = datetime('now')
    WHERE user_id = ?;
  `;
  await db.execute({
    sql: query,
    args: [JSON.stringify(inventoryList), userId],
  });
};

const updateMutation = async (userId, genes, fragments, phenotype) => {
  const query = `
    UPDATE games SET
      gene_cognition = ?,
      gene_adaptability = ?,
      gene_cohesion = ?,
      gene_metabolism = ?,
      gene_substrate = ?,
      gene_collective_memory = ?,
      dna_fragments = ?,
      dominant_phenotype = ?,
      updated_at = datetime('now')
    WHERE user_id = ?;
  `;
  await db.execute({
    sql: query,
    args: [
      genes.cognition,
      genes.adaptability,
      genes.cohesion,
      genes.metabolism,
      genes.substrate,
      genes.collectiveMemory,
      fragments,
      phenotype,
      userId,
    ],
  });
};

module.exports = {
  findByUserId,
  createGame,
  updateGame,
  updateCheckpoint,
  updateInventory,
  updateMutation,
};
