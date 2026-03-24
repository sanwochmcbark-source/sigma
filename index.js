const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.SCRAPINGBEE_KEY; // Read from env

app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.send("Missing URL");

  const apiUrl =
    `https://app.scrapingbee.com/api/v1?api_key=${API_KEY}` +
    `&render_js=true&url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(apiUrl);
    const html = await response.text();
    res.send(html);
  } catch (e) {
    res.status(500).send("Error fetching page");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));