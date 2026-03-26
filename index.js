const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// serve frontend
app.use(express.static(path.join(__dirname)));

// 🔥 FULL PROXY
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("No URL");

  try {
    const response = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const contentType = response.headers.get("content-type") || "";

    // non-html
    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    }

    let html = await response.text();
    const base = new URL(target).origin;

    // 🔥 rewrite links
    html = html.replace(/(href|src|action)=["'](.*?)["']/gi, (m, attr, url) => {
      if (url.startsWith("http")) {
        return `${attr}="/proxy?url=${encodeURIComponent(url)}"`;
      }
      return `${attr}="/proxy?url=${encodeURIComponent(base + url)}"`;
    });

    // 🔥 rewrite JS fetch
    html = html.replace(/fetch\(["'](.*?)["']/gi,
      (m, url) => `fetch("/proxy?url=${encodeURIComponent(url)}"`
    );

    // 🔥 rewrite window.location
    html = html.replace(/window\.location\s*=\s*["'](.*?)["']/gi,
      (m, url) => `window.location="/proxy?url=${encodeURIComponent(url)}"`
    );

    // 🔥 inject service worker
    html = html.replace("</body>", `
      <script>
        if('serviceWorker' in navigator){
          navigator.serviceWorker.register('/sw.js');
        }
      </script>
    </body>`);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});
