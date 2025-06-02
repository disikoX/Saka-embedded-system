require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const axios = require("axios");
const expressWs = require('express-ws');
const websocketService = require("./services/websocket");


const app = express();


// Middlewares
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
expressWs(app);

app.ws('/', websocketService.distributorConnectionHandler);



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


// Settings
app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), () => {
    console.log("Server on port " + app.get("port"));
});
