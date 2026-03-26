const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// serve frontend
app.use(express.static(path.join(__dirname)));

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("No URL");

  try {
    const response = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const contentType = response.headers.get("content-type") || "";

    // pass through non-html (images, etc.)
    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    }

    let text = await response.text();
    const base = new URL(target).origin;

    // 🔥 rewrite relative paths
    text = text.replace(/(href|src|action)=["']\/(.*?)["']/gi,
      (m, attr, path) =>
        `${attr}="/proxy?url=${encodeURIComponent(base + "/" + path)}"`
    );

    // 🔥 rewrite absolute links
    text = text.replace(/(href|src|action)=["']https?:\/\/(.*?)["']/gi,
      (m, attr, url) =>
        `${attr}="/proxy?url=${encodeURIComponent("https://" + url)}"`
    );

    // 🔥 rewrite JS fetch calls
    text = text.replace(/fetch\(["'](.*?)["']/gi,
      (m, url) =>
        `fetch("/proxy?url=${encodeURIComponent(url)}"`
    );

    // 🔥 rewrite window.location
    text = text.replace(/window\.location\s*=\s*["'](.*?)["']/gi,
      (m, url) =>
        `window.location="/proxy?url=${encodeURIComponent(url)}"`
    );

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(text);

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});
