const axios = require("axios");

const base64Str = "data:image/jpeg;base64," + "A".repeat(150 * 1024); // > 100kb
const payload = {
  images: base64Str,
  name: "Test User",
  userId: "64a2b2c1f3d2e1a4c9e8d7b6",
  desc: "Test Description",
  likes: 0,
  liked: false,
};

axios.post("http://localhost:8080/api/post/upload", payload)
  .then(res => console.log("Success! Status:", res.status))
  .catch(err => {
    if (err.response) {
      console.log("Error Status:", err.response.status);
      console.log("Error Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  });
