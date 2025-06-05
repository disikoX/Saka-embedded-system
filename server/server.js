require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const axios = require("axios");
const expressWs = require('express-ws');
const websockerController = require("./controllers/websocket-controller");


const app = express();


// Middlewares
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
expressWs(app);

app.ws('/', websockerController.distributorConnectionController);
 
// Settings
app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), () => {
    console.log("Server on port " + app.get("port"));
});
