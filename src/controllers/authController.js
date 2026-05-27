const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const gameModel = require('../models/gameModel');
const emailService = require('../services/emailService');
const { calculatePhenotype } = require('../services/phenotypeCalculator');

const JWT_SECRET = process.env.JWT_SECRET || 'genus_animus_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const register = async (req, res) => {
  const { email, codigo, gen_mutated } = req.body;

  if (!email || !codigo || !gen_mutated) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'email_already_exists' });
    }

    // 2. Hash access code
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(codigo.toUpperCase(), salt);

    // 3. Create user
    const userId = crypto.randomUUID();
    const user = await userModel.createUser(userId, email, hashedPassword);

    // 4. Calculate initial game state
    // Base values are 0.31
    const genes = {
      cognition: 0.31,
      adaptability: 0.31,
      cohesion: 0.31,
      metabolism: 0.31,
      substrate: 0.31,
      collectiveMemory: 0.31,
    };

    // Apply mutation on selected gene
    const geneMap = {
      cognition: 'cognition',
      adaptability: 'adaptability',
      cohesion: 'cohesion',
      metabolism: 'metabolism',
      substrate: 'substrate',
      collectiveMemory: 'collectiveMemory',
    };

    const targetGene = geneMap[gen_mutated];
    if (!targetGene || !genes[targetGene]) {
      return res.status(400).json({ error: 'invalid_mutated_gene' });
    }

    // Mutated gene goes up by 0.10
    genes[targetGene] = 0.41;

    // Apply antagonist decrease as per GDD/Tech Plan definitions
    const antagonistMap = {
      cognition: { name: 'substrate', decrease: 0.015 }, // weak tension
      adaptability: { name: 'cohesion', decrease: 0.03 },
      cohesion: { name: 'adaptability', decrease: 0.03 },
      metabolism: { name: 'collectiveMemory', decrease: 0.03 },
      substrate: { name: 'cognition', decrease: 0.015 }, // weak tension
      collectiveMemory: { name: 'metabolism', decrease: 0.03 },
    };

    const ant = antagonistMap[targetGene];
    if (ant) {
      genes[ant.name] = Math.max(0.01, Math.round((0.31 - ant.decrease) * 1000) / 1000);
    }

    const calculatedPheno = calculatePhenotype(genes);

    const initialGame = {
      id: crypto.randomUUID(),
      user_id: userId,
      current_scene: 'bosque_amanecer',
      current_checkpoint: 'bosque_amanecer',
      defeated_enemies: 1,
      gene_cognition: genes.cognition,
      gene_adaptability: genes.adaptability,
      gene_cohesion: genes.cohesion,
      gene_metabolism: genes.metabolism,
      gene_substrate: genes.substrate,
      gene_collective_memory: genes.collectiveMemory,
      dna_fragments: 0,
      dominant_phenotype: calculatedPheno,
      inventory: [{ id: 'hoof', name: 'Pezuña', equipped: true }],
      flags: { firstMutationCompleted: true },
    };

    // 5. Save initial game progress
    await gameModel.createGame(initialGame);

    // 6. Generate JWT
    const token = jwt.sign(
      { sub: userId, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 7. Dispatch access code to email asynchronously
    emailService.sendAccessCode(email, codigo.toUpperCase()).catch(err => {
      console.error('Asynchronous email dispatch failed:', err);
    });

    return res.status(201).json({
      token,
      user: {
        id: userId,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Registration controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

const login = async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const isMatch = await bcrypt.compare(codigo.toUpperCase(), user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login controller failed:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

module.exports = {
  register,
  login,
};
