const admin = require("firebase-admin");
// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();
const ref = db.ref('users');
// const ref = db.ref('/users/{usersId}/distributors/{distributorId}/triggerNow');

const fetchUserIdAssignedToDistributor = async (distributorId) => {
  try {
    const snapshot = await db
                        .ref(`/distributors/${distributorId}`)
                        .child('assignedTo')
                        .once('value');
                        
    const userId = snapshot.val();
   
    return userId
  } catch (error) {
    console.error('Error fetching data from firebase service:', error);
    throw error;
  }
}

const fetchDistributorSettings = async (distributorId) => {
  try {
    const userId = await fetchUserIdAssignedToDistributor(distributorId);
    const snapshot = await db
                        .ref(`/users/${userId}/distributors/${distributorId}/settings`)
                        .once('value');
    const settings = snapshot.val();
    if (!settings) {
      throw new Error(`No settings found for distributor ${distributorId}`);
    }
    return settings;

  } catch (error) {
    console.error('Error fetching distributor settings from firebase service:', error);
    throw error;
  }
}

module.exports = {
  fetchUserIdAssignedToDistributor,
  fetchDistributorSettings,
}