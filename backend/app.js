import express from "express";
import "dotenv/config";
import { redis } from "./Redis/redisClient";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Serve the homepage
app.get(
  "/",
  rateLimiter({ limit: 30, timer: 300, keys: "home" }),
  (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
  }
);





app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});
