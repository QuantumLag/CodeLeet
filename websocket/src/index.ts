import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import IORedis from "ioredis";

const port = Number(process.env.WS_PORT || 5001);
const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
});
const app = express();
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", methods: ["GET", "POST"] },
});

redis.on("error", (error) => console.error("Redis subscriber error", error));
redis.on("message", (channel, message) => {
  if (channel !== "submission_events") return;
  try {
    io.emit("submission_update", JSON.parse(message));
  } catch (error) {
    console.error("Ignoring malformed submission event", error);
  }
});
redis.subscribe("submission_events", (error) => {
  if (error) console.error("Could not subscribe to submission_events", error);
  else console.log("Subscribed to Redis channel submission_events");
});

io.on("connection", (socket) => {
  console.log(`Frontend connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`Frontend disconnected: ${socket.id}`));
});

httpServer.listen(port, "0.0.0.0", () => console.log(`WebSocket gateway listening on port ${port}`));

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  io.close();
  await Promise.allSettled([redis.quit()]);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
