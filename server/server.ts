import dotenv from "dotenv";
import express from "express";
import router from "./routes/index";
import mongoose from "mongoose";
import { customCors } from "./middlewares/cors";

dotenv.config();

const requiredEnvironmentVariables = ["MONGODB_URI", "ACCESS_TOKEN_SECRET"];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
);

if (missingEnvironmentVariables.length > 0) {
    console.error(
        `Missing required environment variable(s): ${missingEnvironmentVariables.join(", ")}`
    );
    process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI!;

export const db = mongoose.connection;

const app: express.Application = express();
const port = Number(process.env.PORT || 80);

app.use(customCors);
// app.use(cors());

app.use(express.json());

app.use("/api", router);

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
        app.listen(port, () => {
            console.log(`server listening at port: ${port}`);
        });
    } catch {
        console.error("MongoDB connection failed. Check MONGODB_URI and network access.");
        process.exit(1);
    }
}

void startServer();
