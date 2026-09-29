/**
 * FutureMedia — Production Docker Deployment Verification Suite
 * Phase 19 / Phase 11 Runtime Verification
 */

const http = require("http");
const { execSync } = require("child_process");

const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://localhost:8080";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: { ...(options.headers || {}) },
      timeout: options.timeout || 10000,
    };

    if (postData) {
      if (typeof postData === "object" && !(postData instanceof Buffer)) {
        postData = JSON.stringify(postData);
        reqOptions.headers["Content-Type"] = "application/json";
      }
      reqOptions.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json,
        });
      });
    });

    req.on("error", (err) => {
      resolve({ status: 0, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, error: "Request timed out" });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testSocket(endpoint) {
  return new Promise((resolve) => {
    let io;
    try {
      io = require("./social/node_modules/socket.io-client").io;
    } catch {
      try {
        io = require("./server/node_modules/socket.io-client").io;
      } catch {
        resolve({ ok: false, error: "socket.io-client not installed in node_modules" });
        return;
      }
    }

    const socket = io(endpoint, { timeout: 5000, reconnection: false });
    const timer = setTimeout(() => {
      socket.disconnect();
      resolve({ ok: false, error: "Socket handshake timed out" });
    }, 6000);

    socket.on("connect", () => {
      socket.emit("setup", { _id: "6abaaf027574780228c20130" });
    });

    socket.on("connected", () => {
      clearTimeout(timer);
      socket.emit("join chat", "room_test_123");
      socket.emit("typing", "room_test_123");
      socket.emit("stop typing", "room_test_123");
      socket.disconnect();
      resolve({ ok: true, socketId: socket.id });
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message });
    });
  });
}

async function runVerification() {
  console.log("==================================================");
  console.log("  FutureMedia Docker Deployment Verification");
  console.log("==================================================\n");

  // ── 1. Container Infrastructure Status ──────────
  console.log("1. Checking Docker Containers...");
  try {
    const psOutput = execSync("docker compose ps --format json", { encoding: "utf8" });
    const containers = JSON.parse(`[${psOutput.trim().replace(/\r?\n/g, ",").replace(/,$/, "")}]`);
    
    for (const c of containers) {
      const name = c.Name || c.Service;
      const state = c.State || c.Status;
      const health = c.Health || (state.includes("healthy") ? "healthy" : "unknown");
      assert(state.includes("running") || state.includes("Up"), `Container '${name}' is running`);
      assert(state.includes("healthy") || health === "healthy", `Container '${name}' healthcheck is healthy`);
    }
  } catch (err) {
    console.error("  Warning: CLI container check encountered:", err.message);
  }

  // ── 2. Frontend Health & SPA Routing ─────────────
  console.log("\n2. Checking Frontend Container (Nginx & React SPA)...");
  
  const feHealth = await makeRequest(`${FRONTEND_URL}/health`);
  assert(feHealth.status === 200 && feHealth.json?.status === "ok", "Frontend /health responds 200 with { status: 'ok' }");

  const feRoot = await makeRequest(`${FRONTEND_URL}/`);
  assert(feRoot.status === 200 && feRoot.body.includes("<title>FutureMedia</title>"), "Frontend root / serves FutureMedia HTML shell with 200 OK");

  // SPA direct navigation / refresh routes
  const spaRoutes = [
    "/login",
    "/signup",
    "/home",
    "/explore",
    "/search",
    "/notifications",
    "/profile",
    "/messages",
    "/settings"
  ];
  for (const route of spaRoutes) {
    const res = await makeRequest(`${FRONTEND_URL}${route}`);
    assert(res.status === 200 && res.body.includes("id=\"root\""), `SPA deep route ${route} handles direct navigation/refresh (200 OK, no Nginx 404)`);
  }

  // ── 3. Backend Health & Service Readiness ────────
  console.log("\n3. Checking Backend Container (Node.js/Express & MongoDB)...");

  const beHealth = await makeRequest(`${BACKEND_URL}/health`);
  assert(
    beHealth.status === 200 &&
    beHealth.json?.data?.status === "OK" &&
    beHealth.json?.data?.coreServices?.mongodb === "Connected",
    "Backend /health responds 200, OK status, and MongoDB Connected"
  );

  const beV1Health = await makeRequest(`${BACKEND_URL}/api/v1/health`);
  assert(beV1Health.status === 200 && beV1Health.json?.data?.version === "2.0.0", "Backend /api/v1/health responds 200 with version 2.0.0");

  const beReady = await makeRequest(`${BACKEND_URL}/api/v1/ready`);
  assert(beReady.status === 200 && beReady.json?.status === "Ready", "Backend readiness probe /api/v1/ready responds 200 Ready");

  const beLive = await makeRequest(`${BACKEND_URL}/api/v1/live`);
  assert(beLive.status === 200 && beLive.json?.status === "Alive", "Backend liveness probe /api/v1/live responds 200 Alive");

  // ── 4. Nginx Reverse Proxy Validation ───────────
  console.log("\n4. Checking Frontend Reverse Proxy to Backend...");
  const proxyHealth = await makeRequest(`${FRONTEND_URL}/api/v1/health`);
  assert(proxyHealth.status === 200 && proxyHealth.json?.data?.status === "OK", "Frontend Nginx reverse proxy forwards /api/v1/health to backend (200 OK)");

  // ── 5. Authentication System QA ──────────────────
  console.log("\n5. Testing Authentication System...");

  // Test Invalid Credentials
  const badLogin = await makeRequest(`${BACKEND_URL}/api/v1/auth/login`, { method: "POST" }, {
    username: "bhavishyagupta",
    password: "WrongPassword999!"
  });
  assert(badLogin.status === 401 || badLogin.status === 400, "Invalid credentials correctly rejected with 401/400");

  // Test Valid Login with Seeded Official Creator
  const loginRes = await makeRequest(`${BACKEND_URL}/api/v1/auth/login`, { method: "POST" }, {
    username: "bhavishyagupta",
    password: "Password123!"
  });
  assert(loginRes.status === 200 && Boolean(loginRes.json?.data?.token), "Login succeeds with 200 OK and valid JWT token");
  const authToken = loginRes.json?.data?.token;
  const currentUserId = loginRes.json?.data?._id;

  // Test Protected Route Without Token
  const unauthRes = await makeRequest(`${BACKEND_URL}/api/v1/users/me`);
  assert(unauthRes.status === 401, "Protected route /api/v1/users/me rejects unauthenticated request (401 Unauthorized)");

  // Test Protected Route With Token
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  const meRes = await makeRequest(`${BACKEND_URL}/api/v1/users/me`, { headers: authHeaders });
  assert(meRes.status === 200 && meRes.json?.data?.username === "bhavishyagupta", "Session restored: /api/v1/users/me returns authenticated creator profile");

  // Test Registration of a New User
  const uniqueId = Date.now();
  const regUser = {
    username: `qa_user_${uniqueId}`,
    email: `qa_user_${uniqueId}@example.com`,
    password: "Password123!"
  };
  const regRes = await makeRequest(`${BACKEND_URL}/api/v1/auth/register`, { method: "POST" }, regUser);
  assert(regRes.status === 201, `User registration /api/v1/auth/register succeeded (201 Created) for ${regUser.username}`);

  // ── 6. Social Discovery, Posts, Stories & Chats ──
  console.log("\n6. Testing Social Platform Core Operations...");

  // Suggested Users
  const suggestedRes = await makeRequest(`${BACKEND_URL}/api/v1/users/suggested`, { headers: authHeaders });
  assert(suggestedRes.status === 200 && Array.isArray(suggestedRes.json?.data), "Suggested creators endpoint /api/v1/users/suggested returns list (200 OK)");

  // Search Users
  const searchUserRes = await makeRequest(`${BACKEND_URL}/api/v1/users/search?query=sahil`, { headers: authHeaders });
  assert(searchUserRes.status === 200 && searchUserRes.json?.data?.length > 0, "User search /api/v1/users/search?query=sahil returns matching creators");

  // Posts Feed
  const postsRes = await makeRequest(`${BACKEND_URL}/api/v1/posts`, { headers: authHeaders });
  assert(postsRes.status === 200 && Array.isArray(postsRes.json?.data), "Feed /api/v1/posts returns timeline posts array (200 OK)");
  const samplePost = postsRes.json?.data?.[0];

  // Like & Comment on Post if available
  if (samplePost) {
    const likeRes = await makeRequest(`${BACKEND_URL}/api/v1/posts/${samplePost._id}/like`, {
      method: "PUT",
      headers: authHeaders
    });
    assert(likeRes.status === 200, `Post like toggle /api/v1/posts/${samplePost._id}/like succeeds (200 OK)`);

    const commentRes = await makeRequest(`${BACKEND_URL}/api/v1/posts/${samplePost._id}/comment`, {
      method: "POST",
      headers: authHeaders
    }, { text: "Docker deployment automated verification test comment" });
    assert(commentRes.status === 200 || commentRes.status === 201, "Add comment /api/v1/posts/:id/comment succeeds (200/201)");
  }

  // Stories Feed
  const storiesRes = await makeRequest(`${BACKEND_URL}/api/v1/stories`, { headers: authHeaders });
  assert(storiesRes.status === 200 && Array.isArray(storiesRes.json?.data), "Active 24h stories /api/v1/stories returns list (200 OK)");

  // Notifications
  const notifRes = await makeRequest(`${BACKEND_URL}/api/v1/notifications`, { headers: authHeaders });
  assert(notifRes.status === 200, "Notifications /api/v1/notifications retrieved cleanly (200 OK)");

  // User Chats / Conversations
  const chatRes = await makeRequest(`${BACKEND_URL}/api/v1/chat`, { headers: authHeaders });
  assert(chatRes.status === 200 && Array.isArray(chatRes.json?.data), "Chat list /api/v1/chat returns conversations (200 OK)");

  // ── 7. Real-Time Socket.IO QA ───────────────────
  console.log("\n7. Testing Real-Time Socket.IO Communication...");

  const directSocket = await testSocket(BACKEND_URL);
  assert(directSocket.ok, `Direct Socket.IO to backend (:8080) connected and received setup confirmation`);

  const proxySocket = await testSocket(FRONTEND_URL);
  assert(proxySocket.ok, `Proxied Socket.IO through Nginx (:3000) connected and received setup confirmation`);

  // ── 8. Summary & Exit ────────────────────────────
  console.log("\n==================================================");
  console.log(`Verification Complete: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("==================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error("Unhandled verification error:", err);
  process.exit(1);
});
