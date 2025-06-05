
const firebaseService = require('./firebase');
const cronService = require('./cron');
/**
 * Met à jour le statut du distributeur dans Firebase.
 */
async function updateDistributorStatus(distributorId, status) {
  try {
    await firebaseService.updateDistributorStatus(distributorId, status);
  } catch (err) {
    console.error(`Impossible de mettre à jour le statut pour ${distributorId} :`, err);
  }
}

/**
 * Envoie les messages de paramètres et d'état initial au client.
 */
async function sendInitialData(ws, distributorId) {
  // Récupère les paramètres du distributeur
  const settings = await firebaseService.fetchDistributorSettings(distributorId);
  if (!settings) {
    ws.close(1008, `Aucun paramètre trouvé pour le distributeur ${distributorId}`);
    return false;
  }

  // Récupère l'état courant du trigger
  const triggerState = await firebaseService.fetchTriggerState(distributorId);

  // Prépare et envoie les deux messages
  const settingsMessage = JSON.stringify({ type: 'settings', data: settings });
  const triggerStateMessage = JSON.stringify({ type: 'triggerState', data: triggerState });

  ws.send(settingsMessage);
  ws.send(triggerStateMessage);
  return true;
}

/**
 * Configure un écouteur Firebase pour la clé "triggerNow" 
 * et renvoie une fonction de nettoyage pour arrêter le stream.
 */
async function setupTriggerNowListener(ws, distributorId) {
  const handleTriggerNow = (snapshot) => {
    const triggerState = snapshot.val();
    console.log(`TriggerNow pour ${distributorId} :`, triggerState);
    if (triggerState) {
      const msg = JSON.stringify({ type: 't' });
      ws.send(msg);
    }
  };

  await firebaseService.setStreamOnTriggerNow(distributorId, handleTriggerNow);

  // Retourne une fonction à appeler pour supprimer le listener
  return async () => {
    await firebaseService.removeStreamOnTriggerNow(distributorId, handleTriggerNow);
  };
}

/**
 * Configure le mécanisme ping/pong pour détecter les déconnexions inattendues.
 * Retourne l'intervalle à clear dans la logique de fermeture.
 */
function setupPingPong(ws, distributorId) {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const interval = setInterval(() => {
    if (!ws.isAlive) {
      console.log(`Aucune réponse pong de ${distributorId}, fermeture forcée`);
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  }, 10000);

  return interval;
}

/**
 * Gère les messages entrants du client WebSocket.
 */
async function setupMessageHandler(ws, distributorId) {
  ws.on('message', (msg) => {
    console.log(`Message reçu (${distributorId}) : ${msg}`);
    ws.send(`Echo : ${msg}`);

    let payload;
    try {
      payload = JSON.parse(msg);
    } catch (err) {
      console.warn(`JSON invalide de ${distributorId} :`, msg);
      return;
    }

    switch (payload.type) {
      // message pour changer le trigger en false afin d'indiquer que le distributeur a fait le trigger
      case '!t':
        firebaseService.setTriggerToFalse(distributorId)
          .catch(err => console.error(`Impossible de désactiver trigger pour ${distributorId} :`, err));
        break;
      case '!brk':
        break;
      default:
        consosetStreamOnPlanningle.log(`Type non géré (${distributorId}) :`, payload.type);
    }
  });
}

/**
 * Gère les lancements de planning
 */
async function executePlanning(ws, distributorId) {
  const planningCallBackFunction = () => {
    // sct: ScheduledTrigger
    // le type de message pour indiquer à l'ESP32 de lancer le planning
      const msg = JSON.stringify({ type: 'sct' });
      ws.send(msg);
  } 


  const plannings = await firebaseService.fetchPlannings(distributorId);
  
  if (!plannings) {
    console.warn(`Aucun planning trouvé pour ${distributorId}`);
    return;
  }
  console.log(`Plannings pour ${distributorId} :`, Object.entries(plannings));
  
  for (const [key, value] of Object.entries(plannings)) {
    if (key == "break" || !value.enabled) 
      // On ne planifie pas la pause
      continue;
    
    console.log(`Planification pour ${key} :`, value);
    let cronTaskInstance = cronService.setPlanning(value.time, planningCallBackFunction);
    
    const onPlanningUpdated = (snapshot) => {
      const planning = snapshot.val();
      console.log(`Planning mis à jour pour ${distributorId} :`, planning);
      cronTaskInstance.destroy();
      if (planning && planning.enabled) {
        cronTaskInstance = cronService.setPlanning(planning.time, planningCallBackFunction);
      }
    }

    firebaseService.setStreamOnPlanning(distributorId, key, onPlanningUpdated);
  }
}
/**
 * Détecte les pauses dans le planning afin d'interrompre
 */
module.exports = {
  updateDistributorStatus,
  sendInitialData,
  setupTriggerNowListener,
  setupPingPong,
  setupMessageHandler, 
  executePlanning
};
// This module handles the WebSocket connection for distributors, managing their status,