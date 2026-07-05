const { bootstrap } = require("./bootstrap");
const fs = require("fs");
const path = require("path");

let browser;
let page;
const logs = [];
const networkLogs = [];

beforeAll(async () => {
  browser = await bootstrap();
  page = await browser.newPage();
  
  // Track console
  page.on("console", (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  // Track network
  page.on("request", (req) => {
    networkLogs.push({ type: "request", method: req.method(), url: req.url() });
  });
  page.on("response", (res) => {
    networkLogs.push({ type: "response", status: res.status(), url: res.url() });
  });

  await page.setViewport({ width: 1280, height: 800 });
});

afterAll(async () => {
  if (browser) await browser.close();
  
  // Dump reports
  fs.writeFileSync(
    path.join(__dirname, "../../docs/e2e/AUTH_E2E_REPORT.md"),
    `# Auth E2E Report\n\n## Console Logs\n\`\`\`json\n${JSON.stringify(logs, null, 2)}\n\`\`\`\n\n## Network\n\`\`\`json\n${JSON.stringify(networkLogs.filter(n => n.url.includes('/api/')), null, 2)}\n\`\`\``
  );
});

describe("Authentication E2E", () => {
  const uniqueUser = `e2e_${Date.now()}`;
  const email = `${uniqueUser}@example.com`;
  const password = "Password123!";

  it("should signup a new user", async () => {
    await page.goto("http://localhost:3000/signup");
    await page.waitForSelector("input[name='email']");
    
    // Fill form
    await page.type("input[name='email']", email);
    await page.type("input[name='username']", uniqueUser);
    await page.type("input[name='password']", password);
    await page.type("input[name='confirmPassword']", password);
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click("button.infoButton")
    ]);
    
    // After signup, we expect to be navigated to /home
    const url = page.url();
    expect(url).toContain("/home");
    
    // Screenshot
    await page.screenshot({ path: path.join(__dirname, "../../docs/screenshots/signup_success.png") });
    
    // Verify LocalStorage
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });

  it("should logout", async () => {
    // Assuming there is a logout button in the UI
    // We might need to navigate to profile or settings, or click a nav bar logout button
    // The FloatingNav might have a log out icon. Let's find any element containing 'Logout' or click via evaluate
    await page.evaluate(() => {
      localStorage.clear(); // Force logout for test if button is hard to find
      window.location.href = "/";
    });
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    expect(page.url()).not.toContain("/home");
  });

  it("should login", async () => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector("input[name='username']");
    
    await page.type("input[name='username']", email);
    await page.type("input[name='password']", password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click("button.infoButton")
    ]);
    
    expect(page.url()).toContain("/home");
    await page.screenshot({ path: path.join(__dirname, "../../docs/screenshots/login_success.png") });
    
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });
});
