const gameModel = require('../models/gameModel');
const contentService = require('../services/contentService');

const getScene = async (req, res) => {
  const userId = req.user.id;
  const { id: sceneId } = req.params;

  try {
    const game = await gameModel.findByUserId(userId);
    if (!game) {
      return res.status(404).json({ error: 'game_not_found' });
    }

    // Progression Access validation:
    // User can access their current_scene, or the prologue scenes (01_cocoon, 02_nine_cocoons, 03_exit).
    const allowedIntroScenes = ['cocoon', 'nine_cocoons', 'exit', '01_cocoon', '02_nine_cocoons', '03_exit'];
    
    const isCurrentScene = game.current_scene === sceneId ||
                           game.current_scene.endsWith(sceneId) ||
                           sceneId.endsWith(game.current_scene);

    const isIntroScene = allowedIntroScenes.includes(sceneId);

    // Progresión: también se permite pedir una escena que sea destino de una salida
    // de la escena actual (el cliente navega antes de que el servidor lo sepa).
    let isReachable = false;
    if (!isCurrentScene && !isIntroScene) {
      try {
        const actual = await contentService.getScene(game.current_scene, game.dominant_phenotype);
        const salidas = (actual.metadata && actual.metadata.salidas) || [];
        isReachable = salidas.some((s) => s.destino === sceneId);
      } catch (e) {
        // La escena actual puede no existir como contenido del backend (p.ej. prólogo
        // del cliente); en ese caso no hay salidas que comprobar.
      }
    }

    if (!isCurrentScene && !isIntroScene && !isReachable) {
      return res.status(403).json({ error: 'scene_not_accessible' });
    }

    // Fetch and filter content
    const scene = await contentService.getScene(sceneId, game.dominant_phenotype);

    // Al navegar a una escena alcanzable, avanzar el current_scene del servidor para
    // que las siguientes peticiones (y los checkpoints) partan de la escena correcta.
    if (isReachable) {
      await gameModel.updateCurrentScene(userId, sceneId);
    }

    return res.status(200).json({
      id: scene.id,
      // Texto de llegada por defecto; el cliente usa `textos` para el resto de comandos.
      texto: (scene.textos && scene.textos.llegada) ? scene.textos.llegada : scene.body,
      textos: scene.textos || {},
      comandos_disponibles: scene.commands,
      siguiente: scene.next,
      checkpoint: scene.checkpoint || false,
      // Estructura completa de la escena (salidas, objetos, lógicas, checkpoint...)
      // para que el motor del cliente procese los comandos correctamente.
      metadata: scene.metadata || {},
    });
  } catch (err) {
    console.error('getScene controller failed:', err);
    if (err.message.includes('Scene not found')) {
      return res.status(404).json({ error: 'scene_not_found' });
    }
    return res.status(500).json({ error: 'internal_server_error' });
  }
};

module.exports = {
  getScene,
};
