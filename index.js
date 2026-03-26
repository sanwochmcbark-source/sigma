const express = require("express");
const fetch = require("node-fetch");

const app = express();

const SCRAPINGBEE_API_KEY = "P2J007K7MLOAWKLDK7FV8HE2Y8T8PHZ73R1FS8Z2D4IB29WB2AH4YAY6JWJ8P0ZDXUBVT5YH9192W3ZD"; // 🔑 PUT IT HERE

app.get("/fetch", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing URL");
  }

  try {
    // 🔥 ScrapingBee request
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(targetUrl)}&render_js=false`;

    const response = await fetch(scrapingBeeUrl);

    const contentType = response.headers.get("content-type") || "";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Frame-Options", "ALLOWALL");

    // If HTML → modify it
    if (contentType.includes("text/html")) {
      let text = await response.text();

      // 🔥 Remove frame blockers
      text = text
        .replace(/X-Frame-Options/gi, "")
        .replace(/Content-Security-Policy/gi, "");

      res.send(text);
    } else {
      // For images, etc.
      const buffer = await response.buffer();
      res.setHeader("Content-Type", contentType);
      res.send(buffer);
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(3000, () => {
  console.log("Proxy running on port 3000");
});
