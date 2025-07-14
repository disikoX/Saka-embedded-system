const cron = require('node-cron');


const setPlanning = (time, planningCallback ) => {
    // Planifie une tâche cron selon l'heure spécifiée
    const task = cron.schedule(`0 ${time.split(':')[1]} ${time.split(':')[0]} * * *`, () => {
        console.log(`Tâche planifiée exécutée à ${time}`);
        // Ici,  c'est la logique à exétuer lors de l'exécution de la tâche planifiée
        // Appel de la fonction  passée en paramètre
        planningCallback();
    });

    // Fonction pour néttoyer la tâche cron
    return task;
}

module.exports = {
    setPlanning
};
// setPlanning
// Exemple d'utilisation
// setPlanning('14:30', () => {
//     console.log('Exécution de la tâche planifiée');
// });
