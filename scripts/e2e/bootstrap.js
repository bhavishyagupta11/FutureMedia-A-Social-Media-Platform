const puppeteer = require("puppeteer");
const http = require("http");

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    }).on("error", () => resolve(false));
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkUrl(url)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function bootstrap() {
  console.log("Checking if backend is running...");
  const backendUp = await waitForServer("http://localhost:8080/api/v1/health");
  if (!backendUp) {
    throw new Error("Backend server is not running on port 8080. Start it with `npm run dev` in /server.");
  }

  console.log("Checking if frontend is running...");
  const frontendUp = await waitForServer("http://localhost:3000");
  if (!frontendUp) {
    throw new Error("Frontend server is not running on port 3000. Start it with `npm start` in /social.");
  }

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browser;
}

module.exports = { bootstrap };
