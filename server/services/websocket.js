const url = require('url');
const firebaseService = require('./firebase');
const distributorConnectionHandler = async (ws, req) => {
  const { query } = url.parse(req.url, true);
  const distributorId = query.distributorId;

  if (!distributorId) {
    ws.close(1008, 'Identifiant distributeur manquant');
    return;
  }

  console.log(`Nouvelle connexion WebSocket de ${req.socket.remoteAddress}`);
  ws.distributorId = distributorId;

  console.log(`Connexion WebSocket établie pour le distributeur : ${distributorId}`);
  // Mettre à jour l'état de connexion dans la base de données
  // updateDistributorStatus(distributorId, 'connected');

  const settings = await firebaseService.fetchDistributorSettings(distributorId);
  console.log(settings);
  if (!settings) {
    ws.close(1008, `Aucun paramètre trouvé pour le distributeur ${distributorId}`);
    return;
  }
  console.log(`Paramètres du distributeur ${distributorId} :`, settings);

  const settingsMessage = JSON.stringify({
    type: 'settings',
    data: settings
  });

  ws.send(settingsMessage);

  ws.on('message', (msg) => {
    console.log(`Message reçu de ${distributorId} : ${msg}`);
    ws.send(`Echo : ${msg}`);
  });

  ws.on('close', () => {
    // updateDistributorStatus(distributorId, 'disconnected');
  });
};


module.exports = {
    distributorConnectionHandler
}