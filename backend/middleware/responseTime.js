// Middleware to measure and add response time to headers
export const responseTime = (req, res, next) => {
  const startTime = process.hrtime.bigint(); // High-resolution timer

  // Override res.json to calculate time before sending response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (data) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to ms

    res.setHeader("X-Response-Time", `${duration.toFixed(2)}ms`);
    console.log(
      `[TIMING] ${req.method} ${req.url} - ${duration.toFixed(2)}ms - Status: ${
        res.statusCode
      }`
    );

    return originalJson(data);
  };

  res.send = function (data) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000;

    res.setHeader("X-Response-Time", `${duration.toFixed(2)}ms`);
    console.log(
      `[TIMING] ${req.method} ${req.url} - ${duration.toFixed(2)}ms - Status: ${
        res.statusCode
      }`
    );

    return originalSend(data);
  };

  next();
};
