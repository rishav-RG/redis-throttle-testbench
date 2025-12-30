// API Base URL
const API_BASE_URL = "";

// Get output element
const outputEl = document.getElementById("output");

// Clear output
function clearOutput() {
  outputEl.innerHTML = `
        <div class="output-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Click any button above to test the API endpoints</p>
        </div>
    `;
  outputEl.classList.remove("error", "success");
}

// Show loading state
function showLoading() {
  outputEl.innerHTML = "";
  outputEl.classList.add("loading");
  outputEl.classList.remove("error", "success");
}

// Hide loading state
function hideLoading() {
  outputEl.classList.remove("loading");
}

// Display response
function displayResponse(data, response, isError = false) {
  hideLoading();

  // Read all headers
  const cacheStatus = response ? response.headers.get("X-Cache-Status") : null;
  const limit = response ? response.headers.get("X-RateLimit-Limit") : null;
  const remaining = response
    ? response.headers.get("X-RateLimit-Remaining")
    : null;
  const reset = response ? response.headers.get("X-RateLimit-Reset") : null;
  const responseTime = response
    ? response.headers.get("X-Response-Time")
    : null;

  // Create cache badge
  let cacheBadge = "";
  if (cacheStatus === "HIT") {
    cacheBadge = '<span class="cache-badge hit">⚡ CACHE HIT</span>';
  } else if (cacheStatus === "MISS") {
    cacheBadge = '<span class="cache-badge miss">🔄 CACHE MISS</span>';
  }

  // Create request info box
  let requestInfoBox = "";
  if (limit !== null && remaining !== null && reset !== null) {
    let speedIndicator = "";
    let speedClass = "";

    if (responseTime) {
      const ms = parseFloat(responseTime);
      if (ms < 50) {
        speedIndicator = "← Fast! (from cache)";
        speedClass = "speed-fast";
      } else if (ms < 500) {
        speedIndicator = "← Quick";
        speedClass = "speed-medium";
      } else {
        speedIndicator = "← Slow (fetching data)";
        speedClass = "speed-slow";
      }
    }

    requestInfoBox = `
      <div class="request-info-box">
        <div class="info-header">
          <span class="info-icon">📊</span>
          <span class="info-title">Request Info</span>
        </div>
        <div class="info-content">
          <div class="info-item">
            <span class="info-label">Rate Limit:</span>
            <span class="info-value">${remaining} / ${limit} remaining</span>
          </div>
          <div class="info-item">
            <span class="info-label">Resets in:</span>
            <span class="info-value">${reset} seconds</span>
          </div>
          ${
            responseTime
              ? `
          <div class="info-item">
            <span class="info-label">Response Time:</span>
            <span class="info-value ${speedClass}">${responseTime} ${speedIndicator}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  if (isError) {
    outputEl.classList.add("error");
    outputEl.classList.remove("success");
  } else {
    outputEl.classList.add("success");
    outputEl.classList.remove("error");
  }

  const formattedData =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  outputEl.innerHTML = `
    <div class="output-container">
      ${requestInfoBox}
      <div class="output-main">
        ${cacheBadge}
        <pre>${formattedData}</pre>
      </div>
    </div>
  `;
}

// Display error
function displayError(message) {
  hideLoading();
  outputEl.classList.add("error");
  outputEl.classList.remove("success");
  outputEl.innerHTML = `
        <div style="color: #EF4444; text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <div style="font-size: 1.1rem; font-weight: 600;">Error</div>
            <div style="margin-top: 0.5rem; opacity: 0.8;">${message}</div>
        </div>
    `;
}

// Homepage test
async function homepage(url) {
  try {
    showLoading();
    const response = await fetch(API_BASE_URL + url);

    if (response.status === 429) {
      const data = await response.json();
      displayResponse(data, response, true);
      return;
    }

    hideLoading();
    displayResponse(
      {
        status: response.status,
        message:
          "Welcome to home page... This also has rate limiting implemented on it",
        timestamp: new Date().toISOString(),
      },
      response
    );
  } catch (error) {
    displayError(error.message);
  }
}

// Test API endpoint
async function testApi(url) {
  try {
    showLoading();
    const response = await fetch(API_BASE_URL + url);
    const data = await response.json();

    if (response.status === 429 || data.status === 429) {
      displayResponse(data, response, true);
      return;
    }

    displayResponse(data, response);
  } catch (error) {
    displayError(error.message);
  }
}

// Fetch product details
async function fetchProductDetails() {
  const productId = document.getElementById("productIdDetails").value;

  if (!productId) {
    displayError("Please enter a product ID");
    return;
  }

  try {
    showLoading();
    const response = await fetch(API_BASE_URL + `/product/${productId}`);
    const data = await response.json();

    if (response.status === 429 || data.status === 429) {
      displayResponse(data, response, true);
      return;
    }

    displayResponse(data, response);
  } catch (error) {
    displayError(error.message);
  }
}

// Place order
async function placeOrder() {
  const productId = document.getElementById("productIdOrder").value;

  if (!productId) {
    displayError("Please enter a product ID for the order");
    return;
  }

  try {
    showLoading();
    const response = await fetch(API_BASE_URL + `/order/${productId}`);
    const data = await response.json();

    if (response.status === 429 || data.status === 429) {
      displayResponse(data, response, true);
      return;
    }

    displayResponse(data, response);
  } catch (error) {
    displayError(error.message);
  }
}

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Clear output with Escape key
  if (e.key === "Escape") {
    clearOutput();
  }

  // Submit forms with Enter key when input is focused
  if (e.key === "Enter") {
    if (document.activeElement.id === "productIdDetails") {
      fetchProductDetails();
    } else if (document.activeElement.id === "productIdOrder") {
      placeOrder();
    }
  }
});

// Add animation on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Redis Rate Limiting API Test Interface loaded");
  console.log("💡 Tip: Press ESC to clear output");
});

document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".info-box-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const infoBox = header.parentElement;
      infoBox.classList.toggle("open");
    });
  });
});
