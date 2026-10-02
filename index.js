import express from "express";
import cors from "cors";
import 'dotenv/config';
import Router from "./Routes/index.js"
import mongoose from "./config/db.js";

const app = express();

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error in mongo"))
db.once("open", () => console.log("db connected"))

app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173',
    'https://avatarpick.com',
    // 'http://innovativehive-production.vercel.app',
];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));

app.use("/api", Router);


app.listen(process.env.PORT, () => {
    console.log("server is running on port", process.env.PORT)
});