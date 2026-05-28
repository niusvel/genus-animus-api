const db = require('../db/client');

// Helper to parse DB row JSON fields
const parseCheckpointRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    inventory: JSON.parse(row.inventory || '[]'),
    flags: JSON.parse(row.flags || '{}'),
    morfologia: row.morfologia ? JSON.parse(row.morfologia) : null,
  };
};

const findById = async (id) => {
  const query = 'SELECT * FROM checkpoints WHERE id = ? LIMIT 1;';
  const result = await db.execute({
    sql: query,
    args: [id],
  });
  return parseCheckpointRow(result.rows[0]) || null;
};

const findCheckpointsByUserId = async (userId) => {
  const query = 'SELECT * FROM checkpoints WHERE user_id = ? ORDER BY created_at ASC;';
  const result = await db.execute({
    sql: query,
    args: [userId],
  });
  return result.rows.map(parseCheckpointRow);
};

const findCheckpointsByUserAndScene = async (userId, sceneId) => {
  const query = 'SELECT * FROM checkpoints WHERE user_id = ? AND current_scene = ? ORDER BY created_at ASC;';
  const result = await db.execute({
    sql: query,
    args: [userId, sceneId],
  });
  return result.rows.map(parseCheckpointRow);
};

const createCheckpoint = async (data) => {
  const query = `
    INSERT INTO checkpoints (
      id, user_id, checkpoint_name, current_scene, defeated_enemies,
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
      data.id,
      data.user_id,
      data.checkpoint_name,
      data.current_scene,
      data.defeated_enemies,
      data.gene_cognition,
      data.gene_adaptability,
      data.gene_cohesion,
      data.gene_metabolism,
      data.gene_substrate,
      data.gene_collective_memory,
      data.dna_fragments,
      data.dominant_phenotype,
      data.morfologia ? JSON.stringify(data.morfologia) : null,
      JSON.stringify(data.inventory),
      JSON.stringify(data.flags),
    ],
  });

  return data;
};

const updateCheckpointTimestamp = async (id, data) => {
  const query = `
    UPDATE checkpoints SET
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
      created_at = datetime('now')
    WHERE id = ?;
  `;
  await db.execute({
    sql: query,
    args: [
      data.defeated_enemies,
      data.gene_cognition,
      data.gene_adaptability,
      data.gene_cohesion,
      data.gene_metabolism,
      data.gene_substrate,
      data.gene_collective_memory,
      data.dna_fragments,
      data.dominant_phenotype,
      data.morfologia ? JSON.stringify(data.morfologia) : null,
      JSON.stringify(data.inventory),
      JSON.stringify(data.flags),
      id,
    ],
  });
};

module.exports = {
  findById,
  findCheckpointsByUserId,
  findCheckpointsByUserAndScene,
  createCheckpoint,
  updateCheckpointTimestamp,
};
