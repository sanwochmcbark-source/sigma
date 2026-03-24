const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.SCRAPINGBEE_KEY;

app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    // Check if it's the DuckDuckGo API request
    const isDuckAPI = url.includes("api.duckduckgo.com");

    const apiUrl = `https://app.scrapingbee.com/api/v1?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render_js=false&extract_rules=[]`;

    const response = await fetch(apiUrl);

    if (isDuckAPI) {
      // Return raw JSON
      const jsonText = await response.text();
      res.setHeader("Content-Type", "application/json");
      res.send(jsonText);
    } else {
      // For normal websites, return HTML
      const html = await response.text();
      res.send(html);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching page");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
