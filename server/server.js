require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const admin = require("firebase-admin");
const axios = require("axios");
const expressWs = require('express-ws');
const app = express();

const WebSocket = require('ws');

// Middlewares
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
expressWs(app);

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(`Message reçu : ${msg}`);
    ws.send(`Echo : ${msg}`);
  });
});

// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();
const ref = db.ref('users');
// const ref = db.ref('/users/{usersId}/distributors/{distributorId}/triggerNow');

// API endpoint to toggle LED
app.post('/on-led', async (req, res) => {
  const { led } = req.body;
  try {
    await axios.get(`http://${process.env.ESP32_IP}/${led}/on`);
    res.send({ success: true });
  } catch (error) {
    console.error('Error turning on LED:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

app.post('/off-led', async (req, res) => {
  const { led } = req.body;
  try {
    await axios.get(`http://${process.env.ESP32_IP}/${led}/off`);
    res.send({ success: true });
  } catch (error) {
    console.error('Error turning off LED:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

app.get("/:distributorId/userId", async (req, res) => {
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
);
// Get current LED status
app.get('/led-status', (req, res) => {
  ref.once('value')
    .then(snapshot => res.send({ status: snapshot.val() }))
    .catch(err => res.status(500).send({ error: err }));
});

// Settings
app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), () => {
    console.log("Server on port " + app.get("port"));
});
