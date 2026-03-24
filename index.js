const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.SCRAPINGBEE_KEY;

app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  // Detect if it's JSON API (DuckDuckGo)
  const isJson = url.includes("api.duckduckgo.com");

  try {
    const apiUrl = `https://app.scrapingbee.com/api/v1?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render_js=false`;
    const response = await fetch(apiUrl);

    if (isJson) {
      const json = await response.text(); // Get the raw JSON text
      res.type("application/json").send(json); // Force JSON MIME type
    } else {
      const html = await response.text();
      res.send(html);
    }
  } catch (e) {
    res.status(500).send("Error fetching page");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
