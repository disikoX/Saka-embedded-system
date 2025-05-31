require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

// Middlewares
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();
const ref = db.ref('/users/{usersId}/distributors/triggerNow');

// API endpoint to toggle LED
app.post('/toggle-led', (req, res) => {
  const { status } = req.body;
  ref.set(status)
    .then(() => res.send({ success: true }))
    .catch(err => res.status(500).send({ success: false, error: err }));
});

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
