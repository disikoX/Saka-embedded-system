const url = require('url');

const {
  updateDistributorStatus,
  sendInitialData,
  setupTriggerNowListener,
  setupPingPong,
  setupMessageHandler, 
  executePlanning
} = require('../services/websocket');

const distributorConnectionController = async (ws, req) => {
  const { query } = url.parse(req.url, true);
  const distributorId = query.distributorId;

  if (!distributorId) {
    ws.close(1008, 'Identifiant distributeur manquant');
    return;
  }


  console.log(`Nouvelle connexion WebSocket de ${req.socket.remoteAddress} pour ${distributorId}`);

  // 1. Mettre à jour le statut « Connecté »
  await updateDistributorStatus(distributorId, 'Connecté');

  // 2. Envoyer les données initiales (settings + triggerState)
  const success = await sendInitialData(ws, distributorId);
  if (!success) {
    // Si on n'a pas pu envoyer les settings, on quitte
    return;
  }

  // 3. Configurer le listener Firebase (« triggerNow »)
  const cleanupTriggerListener = await setupTriggerNowListener(ws, distributorId);

  // 4. Configurer le ping/pong pour surveiller la connexion
  const pingInterval = setupPingPong(ws, distributorId);

  // 5. Configurer le gestionnaire de messages entrants
  setupMessageHandler(ws, distributorId);

  // 6. Débuter les planifications
   executePlanning(ws, distributorId);

  // 7. Sur fermeture normale ou forcée
  ws.on('close', async () => {
    clearInterval(pingInterval);
    console.log(`Fermeture WebSocket pour ${distributorId}`);

    // Mettre à jour le statut en « Déconnecté » puis retirer le listener
    await updateDistributorStatus(distributorId, 'Déconnecté');
    await cleanupTriggerListener();
  });
};

module.exports = {
  distributorConnectionController
};