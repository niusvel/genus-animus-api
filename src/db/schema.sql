-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Games Table
CREATE TABLE IF NOT EXISTS games (
  id                     TEXT PRIMARY KEY,
  user_id                TEXT NOT NULL REFERENCES users(id),
  current_scene          TEXT NOT NULL DEFAULT 'bosque_amanecer',
  current_checkpoint      TEXT NOT NULL DEFAULT 'bosque_amanecer',
  defeated_enemies       INTEGER NOT NULL DEFAULT 1,
  gene_cognition         REAL NOT NULL DEFAULT 0.31,
  gene_adaptability      REAL NOT NULL DEFAULT 0.31,
  gene_cohesion          REAL NOT NULL DEFAULT 0.31,
  gene_metabolism        REAL NOT NULL DEFAULT 0.31,
  gene_substrate         REAL NOT NULL DEFAULT 0.31,
  gene_collective_memory REAL NOT NULL DEFAULT 0.31,
  dna_fragments          INTEGER NOT NULL DEFAULT 0,
  dominant_phenotype     TEXT NOT NULL DEFAULT 'Primordial Despertado',
  inventory              TEXT NOT NULL DEFAULT '[{"id":"hoof","name":"Pezuña","equipped":true}]',
  flags                  TEXT NOT NULL DEFAULT '{}',
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index to optimize querying game progress by user
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);

-- Checkpoints Table
CREATE TABLE IF NOT EXISTS checkpoints (
  id                     TEXT PRIMARY KEY,
  user_id                TEXT NOT NULL REFERENCES users(id),
  checkpoint_name        TEXT NOT NULL,
  current_scene          TEXT NOT NULL,
  defeated_enemies       INTEGER NOT NULL,
  gene_cognition         REAL NOT NULL,
  gene_adaptability      REAL NOT NULL,
  gene_cohesion          REAL NOT NULL,
  gene_metabolism        REAL NOT NULL,
  gene_substrate         REAL NOT NULL,
  gene_collective_memory REAL NOT NULL,
  dna_fragments          INTEGER NOT NULL,
  dominant_phenotype     TEXT NOT NULL,
  inventory              TEXT NOT NULL,
  flags                  TEXT NOT NULL,
  created_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index to optimize querying checkpoints by user
CREATE INDEX IF NOT EXISTS idx_checkpoints_user_id ON checkpoints(user_id);
