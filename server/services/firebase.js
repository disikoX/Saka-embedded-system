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

const fetchUserIdOfDistributor = async (req, res) => {
  try {
    const { distributorId } = req.params;
    console.log("Fetching data for distributorId:", distributorId);
    const snapshot = await db
                        .ref(`/distributors/${distributorId}`)
                        .child('assignedTo')
                        .once('value');
                        
    const data = snapshot.val();
    if (!data) {
      return res.status(404).send({ error: 'No data found' });
    }

    res.send(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({ error: 'Failed to fetch data' });
  }
}