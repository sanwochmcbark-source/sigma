app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    // 🔥 Detect search pages
    const isSearch =
      url.includes("duckduckgo.com") ||
      url.includes("google.com");

    const apiUrl = `https://app.scrapingbee.com/api/v1?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render_js=${isSearch}`;

    const response = await fetch(apiUrl);
    const html = await response.text();

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching page");
  }
});
