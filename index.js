const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    let text = await response.text();

    // 🔥 remove frame blockers
    text = text
      .replace(/X-Frame-Options/gi, "")
      .replace(/Content-Security-Policy/gi, "");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Frame-Options", "ALLOWALL");

    res.send(text);
  } catch (err) {
    res.status(500).send("Proxy error");
  }
});

app.listen(3000, () => {
  console.log("Proxy running on port 3000");
});
