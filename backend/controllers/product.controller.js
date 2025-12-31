import { redis } from "../Redis/redisClient.js";
import { data } from "../sample_data/data.js";

//  adding intentional API delay (for comparing cache speed) for fetching all products
const fetchAllProducts = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 2000);
  });

//  adding intentional API delay (for comparing cache speed) for fetching a single product
const fetchProductById = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const product = data.find((p) => p.id === parseInt(id));
      if (product) {
        resolve(product);
      } else {
        reject(new Error(`Product with ID ${id} not found`));
      }
    }, 2000);
  });

//  GET /products
export const getAllProducts = async (req, res) => {
  try {
    const products = await fetchAllProducts();
    console.log(`[API] Fetched ${products.length} products`);

    // Cache for 20 seconds
    await redis.setex("products", 20, JSON.stringify(products));

    res.json({ products });
  } catch (error) {
    console.error("[ERROR] getAllProducts:", error.message);
    res.status(500).json({
      error: "Failed to fetch products",
      message: error.message,
    });
  }
};

// GET /product/:id
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await fetchProductById(id);
    console.log(`[API] Fetched product ID: ${id}`);

    // TTL : time to live 20 sec
    const key = `product:${id}`;
    await redis.setex(key, 20, JSON.stringify(product));

    res.json(product);
  } catch (error) {
    console.error("[ERROR] getProductDetails:", error.message);
    res.status(404).json({
      error: "Product not found",
      message: error.message,
    });
  }
};

//  GET /order/:id
export const orderProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `product:${id}`;

    // invalidate cache (product data is now stale)
    await redis.del(key);
    console.log(`[API] Order placed for product ID: ${id}, cache invalidated`);

    res.json({
      success: true,
      message: `Order placed successfully for product ID: ${id}`,
      cacheInvalidated: true,
    });
  } catch (error) {
    console.error("[ERROR] orderProduct:", error.message);
    res.status(500).json({
      error: "Failed to place order",
      message: error.message,
    });
  }
};
