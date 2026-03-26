const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.SCRAPINGBEE_KEY;

// ✅ Fix for "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// 🔥 Main proxy route
app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const apiUrl = `https://app.scrapingbee.com/api/v1?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render_js=false`;

    const response = await fetch(apiUrl);
    const text = await response.text();

    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching page");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running"));
