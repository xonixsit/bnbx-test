process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require("./config/db.config");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
// const cron = require("node-cron");
const express = require("express");
const router = require("./router");
const config = require("./config/config");
//  const cronController = require("./cron/cronController");
// require('./cron/returns.cron');
const CronManager = require('./cron/cronManager');

const app = express();
const http = require("http");
const server = http.createServer(app);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:51395','https://bnbx.pro','https://www.bnbx.pro'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(morgan("combined"));
app.use("/", router);

app.use((request, response) => {
    response.type("text/plain");
    response.status(404);
    response.send({ success: true, message: "Server Working. But Api Not Found." }); 
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
CronManager.initializeCrons()

server.listen(config.PORT, () => {
    console.log(`App running on http://localhost:${config.PORT}`);
});