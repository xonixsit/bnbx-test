const config = require("./config");
const mongoose = require("mongoose");

// Simplify the connection approach by using the connection string directly
// MongoDB Atlas requires TLS/SSL, which is enabled by default in the connection string
const connectDb = mongoose.connect(config.DATABASE)
                    .then(()=>console.log("Database connection successful."))
                    .catch((err)=>{
                        console.log("Connection to Database failed.");
                        console.error("MongoDB connection error", err);
                    });

const database = mongoose.connection;

database.on("error", console.error.bind(console, "MongoDB connection error"));

module.exports = connectDb;
