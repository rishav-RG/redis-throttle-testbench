import express from "express";
import "dotenv/config";
import { redis } from "./Redis/redisClient.js";
import path from "path";
import { fileURLToPath } from "url";
import { responseTime } from "./middleware/responseTime.js";
import {
  getCachedData,
  getCachedProduct,
  rateLimiter,
} from "./middleware/redis.js";
import {
  getAllProducts,
  getProductDetails,
  orderProduct,
} from "./controllers/product.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

// Apply response time middleware FIRST
app.use(responseTime);

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

// serve the allProducts route
app.get(
  "/products",
  rateLimiter({ limit: 5, timer: 20, keys: "products" }),
  getCachedData("products"),
  getAllProducts
);

// serve productDetail route
app.get(
  "/product/:id",
  rateLimiter({ limit: 5, timer: 20, keys: "product" }),
  getCachedProduct(),
  getProductDetails
);

// serve orderProduct route
app.get(
  "/order/:id",
  rateLimiter({ limit: 5, timer: 20, keys: "order" }),
  orderProduct
);

// Global error handler for random routes
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err.message);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});
