const fs = require('fs');
const path = require('path');

/**
 * Basic YAML Frontmatter parser (no external Node dependencies needed)
 */
const parseFrontmatter = (mdString) => {
  if (!mdString) return { data: {}, content: '' };

  const match = mdString.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: mdString };
  }

  const yamlBlock = match[1];
  const content = match[2];
  const data = {};

  const lines = yamlBlock.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
          }
          return s;
        });
    } else {
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (!isNaN(value) && value !== '') {
        value = Number(value);
      }
    }

    data[key] = value;
  }

  return { data, content };
};

/**
 * Filter text content by player's dominant phenotype
 */
const filterContentByPhenotype = (content, phenotype) => {
  if (!content) return '';

  if (!content.includes('<!-- phenotype:') && !content.includes('<!-- fenotipo:')) {
    return content.trim();
  }

  const lines = content.split('\n');
  const blocks = {};
  let currentActivePheno = 'all';
  let currentBlock = [];

  for (const line of lines) {
    const matchMarker = line.match(/<!--\s*(phenotype|fenotipo):([a-zA-Z0-9_-]+)\s*-->/);
    if (matchMarker) {
      if (currentBlock.length > 0) {
        blocks[currentActivePheno] = currentBlock.join('\n').trim();
      }
      currentActivePheno = matchMarker[2].trim().toLowerCase();
      if (currentActivePheno === 'todos') {
        currentActivePheno = 'all';
      }
      currentBlock = [];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks[currentActivePheno] = currentBlock.join('\n').trim();
  }

  const formattedPheno = phenotype ? phenotype.toLowerCase().replace(/\s+/g, '_') : 'all';

  if (blocks[formattedPheno]) {
    return blocks[formattedPheno];
  }

  const parts = formattedPheno.split('_');
  if (parts.length === 2) {
    const transposed = `${parts[1]}_${parts[0]}`;
    if (blocks[transposed]) {
      return blocks[transposed];
    }
  }

  const baseMatch = parts.find(p => ['insectoid', 'humanoid', 'android', 'insectoide', 'humanoide', 'androide'].includes(p));
  if (baseMatch && blocks[baseMatch]) {
    return blocks[baseMatch];
  }

  return blocks['all'] || blocks['todos'] || content.trim();
};

/**
 * Finds a scene file in the scenes folder and returns parsed filtered contents.
 */
const getScene = async (sceneId, phenotype) => {
  const scenesDir = path.join(__dirname, '..', 'content', 'scenes');
  
  // Read all files/folders in the scenes folder to find matches
  const files = fs.readdirSync(scenesDir);
  let targetFile = null;

  for (const file of files) {
    const baseName = path.basename(file, '.md');
    // Match exact sceneId, or name ending with _sceneId, or matching the name pattern
    if (baseName === sceneId || baseName.endsWith(`_${sceneId}`) || baseName.substring(3) === sceneId) {
      targetFile = file;
      break;
    }
  }

  if (!targetFile) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  const filePath = path.join(scenesDir, targetFile);
  const isDirectory = fs.statSync(filePath).isDirectory();

  if (isDirectory) {
    const narrativePath = path.join(filePath, 'narrativa.md');
    const definitionPath = path.join(filePath, 'definicion.json');

    if (!fs.existsSync(narrativePath) || !fs.existsSync(definitionPath)) {
      throw new Error(`Scene folder for ${sceneId} is missing narrative.md or definicion.json`);
    }

    const rawNarrative = fs.readFileSync(narrativePath, 'utf8');
    const defData = JSON.parse(fs.readFileSync(definitionPath, 'utf8'));

    const { data: narData, content } = parseFrontmatter(rawNarrative);
    const filteredBody = filterContentByPhenotype(content, phenotype);

    const combinedData = {
      ...defData,
      ...narData
    };

    const commands = [
      ...(defData.comandos_iniciales || []),
      ...(defData.comandos_desbloqueables || [])
    ];

    const next = combinedData.next || combinedData.siguiente || (defData.salidas && defData.salidas.length > 0 ? defData.salidas[0].destino : null);

    return {
      id: combinedData.id || sceneId,
      commands,
      next,
      body: filteredBody,
      metadata: combinedData
    };
  } else {
    const rawContent = fs.readFileSync(filePath, 'utf8');

    const { data, content } = parseFrontmatter(rawContent);
    const filteredBody = filterContentByPhenotype(content, phenotype);

    return {
      id: data.id || sceneId,
      commands: data.commands || data.comandos || [],
      next: data.next || data.siguiente || null,
      body: filteredBody,
      metadata: data
    };
  }
};

module.exports = {
  getScene,
};
