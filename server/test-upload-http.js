const http = require("http");

const base64Str = "data:image/jpeg;base64," + "A".repeat(150 * 1024); // > 100kb
const payload = JSON.stringify({
  images: base64Str,
  name: "Test User",
  userId: "64aa2b2c1f3d2e1a4c9e8d7b6",
  desc: "Test Description",
  likes: 0,
  liked: false,
});

const req = http.request(
  {
    hostname: "localhost",
    port: 8080,
    path: "/api/post/upload",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", data);
    });
  }
);

req.on("error", (e) => console.error("Error:", e.message));
req.write(payload);
req.end();
