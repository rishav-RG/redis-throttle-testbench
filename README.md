# Redis Rate Limiting & Caching API

This project is a Node.js and Express application demonstrating how to implement API rate limiting and caching using Redis. It includes a backend server with several endpoints and a simple frontend interface to test the functionality.

## ✨ Features

- **Rate Limiting**: Uses a Sliding Window Counter algorithm to limit requests per IP address, preventing abuse.
- **Response Caching**: Caches API responses in Redis to significantly improve performance and reduce database load.
- **Cache Invalidation**: Demonstrates how to invalidate cache when underlying data changes (e.g., placing an order).
- **Performance Metrics**: A custom middleware measures and adds the `X-Response-Time` header to every response.
- **Configurable**: Easily configure rate limits (request count, window time) for different routes.
- **Interactive Frontend**: A simple HTML/CSS/JS interface to visualize and test the API's behavior.

## ⚙️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database/Cache**: Redis (with `ioredis` client)
- **Development**: `nodemon` for live reloading

## 🏗️ Project Workflow & Architecture

The application follows a standard middleware-based architecture in Express. When a request comes in, it passes through a series of middleware functions before hitting the final route handler.

### Request Flow Diagram

Here is a simplified flow of how a request to `/products` is handled:

```
Incoming Request (e.g., GET /products)
       │
       ▼
┌─────────────────────────────┐
│   ResponseTime Middleware   │  (Starts a high-resolution timer)
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   RateLimiter Middleware    │
└─────────────────────────────┘
       │
       ├─(Limit Exceeded?)─► Send 429 Too Many Requests Response
       │
       ▼ (Limit OK)
┌─────────────────────────────┐
│  getCachedData Middleware   │
└─────────────────────────────┘
       │
       ├─(Cache HIT?)──────► Send Cached Data (JSON) from Redis
       │
       ▼ (Cache MISS)
┌─────────────────────────────┐
│  getAllProducts Controller  │
└─────────────────────────────┘
       │
       ├─ 1. Fetch data from the source (simulated 2s delay).
       │
       ├─ 2. Store the fetched data in Redis cache with an expiry.
       │
       └─ 3. Send the fresh data as a JSON response.
```

### Rate Limiting

- **Algorithm**: The **Sliding Window Counter** algorithm is implemented in the `rateLimiter` middleware.
- **Mechanism**: For each unique IP and endpoint, a counter is stored in Redis (`<ip>:<key>:request_count`).
  - On the first request within a time window, `INCR` creates the key with a value of 1, and `EXPIRE` sets the window duration.
  - On subsequent requests, `INCR` increments the counter.
  - If the count exceeds the defined `limit` before the key expires, the request is rejected with a `429` status code.

### Caching

- **Strategy**: The project uses the **Cache-Aside** pattern. The application logic is responsible for checking the cache before fetching from the data source.
- **Implementation**:
  - `getCachedData` and `getCachedProduct` middlewares check Redis for existing data.
  - If data is found (a "HIT"), it's returned immediately.
  - If not found (a "MISS"), the request proceeds to the controller (e.g., `getAllProducts`), which fetches the data, caches it using `redis.setex`, and then returns it.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher) **(only for manual install)**
- npm **(only for manual install)**
- Access to a Redis instance (local or cloud-based like Upstash)
- **OR** [Docker](https://www.docker.com/get-started/) installed (for running with containers)

### Installation & Setup

#### **Option 1: Run Directly with Node.js**

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/Redis_Rate_Limiting_API.git
    cd Redis_Rate_Limiting_API
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Redis connection URL:

    **For Local Redis Setup (using Docker):**
    If you prefer to run Redis locally, you can use Docker:

    ```sh
    docker run -p 6379:6379 --name my-redis-container -d redis
    ```

    Then, your `.env` file should contain:

    ```env
    REDIS_URL="redis://localhost:6379"
    ```

    **For Cloud-Based Redis (e.g., Upstash):**

    ```env
    # Example for Upstash Redis
    REDIS_URL="rediss://<user>:<password>@<host>:<port>"
    ```

4.  **Run the server:**
    - For development with auto-reloading:
      ```sh
      npm run dev
      ```
    - For production:
      ```sh
      npm start
      ```

The server will be running at `http://localhost:3000`.

---

#### **Option 2: Run Everything with Docker**

You can run the entire application using Docker, either with your own Redis instance (cloud) or by running Redis locally in a separate container.

##### **A. Using a Cloud Redis Service (e.g., Upstash)**

1. **Set your Redis URL (from your provider):**

   ```sh
   docker run -d -p 3000:3000 --name redis-throttle-app \
     -e REDIS_URL="rediss://<user>:<password>@<host>:<port>" \
     redis-throttle-app
   ```

   - Replace the `REDIS_URL` value with your actual Redis connection string.
   - The app will be available at [http://localhost:3000](http://localhost:3000).

##### **B. Using Local Redis via Docker**

1. **Start a Redis container:**

   ```sh
   docker run -p 6379:6379 --name my-redis-container -d redis
   ```

2. **Run your app container and link it to the local Redis:**

   ```sh
   docker run -d -p 3000:3000 --name redis-throttle-app \
     --env REDIS_URL="redis://host.docker.internal:6379" \
     redis-throttle-app
   ```

   - `host.docker.internal` allows your app container to access Redis running on your host machine (works on Docker Desktop for Windows/Mac).
   - If you are on Linux, use your host's IP address or set up a Docker network and use the Redis container name as the host.

---

**Note:**

- If you make changes to the code, rebuild the Docker image with:
  ```sh
  docker build -t redis-throttle-app .
  ```

---

Now you can use either method to run the project:

- **Directly with Node.js** (manual install, `.env` required)
- **Fully containerized with Docker** (no Node.js/npm needed on your machine)

## 🔧 Configuration

You can easily customize the behavior of the rate limiter and cache by modifying the parameters in `backend/app.js`.

### How to Configure Rate Limits

In `backend/app.js`, locate the route you want to configure. The `rateLimiter` middleware accepts an object with the following properties:

- `limit`: The maximum number of requests allowed in the time window.
- `timer`: The duration of the time window in seconds.
- `keys`: A unique string to identify the endpoint being rate-limited.

**Example:** To change the `/products` endpoint to allow 10 requests every 60 seconds:

```javascript
// filepath: Redis_Rate_Limiting_API/backend/app.js
// ...existing code...
// serve the allProducts route
app.get(
  "/products",
  rateLimiter({ limit: 10, timer: 60, keys: "products" }), // Changed here
  getCachedData("products"),
  getAllProducts
);
// ...existing code...
```

### How to Configure Cache Expiration

Cache expiration is set in the controller files inside `backend/controllers/`. The `redis.setex` function is used, which takes the key, expiration time in seconds, and value.

**Example:** To change the cache duration for all products to 5 minutes (300 seconds) in `backend/controllers/product.controller.js`:

```javascript
// filepath: Redis_Rate_Limiting_API/backend/controllers/product.controller.js
// ...existing code...
export const getAllProducts = async (req, res) => {
  try {
    const products = await fetchAllProducts();
    console.log(`[API] Fetched ${products.length} products`);

    // let say keep cache for 5 minutes (5 * 60 = 300 sec)
    await redis.setex("products", 300, JSON.stringify(products)); // Changed here

    res.json({ products });
// ...existing code...
```

## Flaws & Potential Improvements

This project serves as a learning tool and has some simplifications. Here are known limitations and how they could be addressed in a production environment.

**IP-Based Limiting is Not Foolproof**

    - **Flaw**: A single malicious actor can use multiple IP addresses (via VPNs or proxies) to bypass the limit. Conversely, multiple legitimate users behind a single NAT (like in an office or university) will share the same rate limit, potentially blocking them unfairly.
    - **Solution**: Implement **user- or API-key-based rate limiting**. After a user authenticates (e.g., with a JWT), apply the rate limit to their unique user ID or a dedicated API key. This provides a much more reliable and granular level of control.

## 💡 Applying This Logic to Other Applications

The rate limiting and caching logic in this project is highly portable.
While this app uses a simple static data source to demonstrate functionality, the core middleware can be easily integrated into any full-stack application (e.g., MERN, PERN).
Simply copy the middleware files into your project and apply them to your existing API routes. This allows you to protect expensive database queries and enhance performance, regardless of your app's specific business logic or database.
