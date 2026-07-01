const http = require("http");

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 8080,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || "{}") });
        } catch (e) {
          resolve({ status: res.statusCode, body: data }); // HTML or bad JSON
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTrace() {
  console.log("=== STARTING AUTHENTICATION TRACE ===");
  try {
    // 1. Health
    console.log("-> Checking /api/v1/health");
    let res = await request("GET", "/api/v1/health");
    console.log(`[${res.status}]`, JSON.stringify(res.body));

    // 2. Register
    const uniqueUser = `user_${Date.now()}`;
    const email = `${uniqueUser}@example.com`;
    console.log(`\n-> Tracing Signup (POST /api/v1/auth/register) for ${uniqueUser}`);
    res = await request("POST", "/api/v1/auth/register", {
      username: uniqueUser,
      email: email,
      password: "Password123!"
    });
    console.log(`[${res.status}]`, JSON.stringify(res.body));
    if (res.status !== 201) throw new Error("Signup failed");

    // Extract token
    const token = res.body?.data?.token;

    // 3. Login
    console.log(`\n-> Tracing Login (POST /api/v1/auth/login) for ${email}`);
    res = await request("POST", "/api/v1/auth/login", {
      username: email,
      password: "Password123!"
    });
    console.log(`[${res.status}]`, JSON.stringify(res.body));
    if (res.status !== 200) throw new Error("Login failed");

    // 4. Me (Protected Route)
    console.log(`\n-> Tracing Protected Route (GET /api/v1/users/me)`);
    res = await request("GET", "/api/v1/users/me", null, token);
    console.log(`[${res.status}]`, JSON.stringify(res.body));

    console.log("\n=== TRACE COMPLETE ===");
  } catch (error) {
    console.error("\n[TRACE FAILED]", error.message);
  }
}

runTrace();
