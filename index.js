const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const cheerio = require("cheerio");

const app = express();

app.use(express.static(path.join(__dirname)));

function resolveUrl(url, base) {
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

function proxify(url, base) {
  const resolved = resolveUrl(url, base);
  if (!resolved) return url;
  return `/proxy?url=${encodeURIComponent(resolved)}`;
}

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("No URL");

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
        "Accept": req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "en-US"
      }
    });

    const contentType = response.headers.get("content-type") || "";

    // ✅ Handle non-HTML properly
    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    }

    let html = await response.text();
    const base = target;

    const $ = cheerio.load(html);

    // ✅ Rewrite ALL resource attributes
    $("a, link").each((i, el) => {
      const href = $(el).attr("href");
      if (href) $(el).attr("href", proxify(href, base));
    });

    $("img, script").each((i, el) => {
      const src = $(el).attr("src");
      if (src) $(el).attr("src", proxify(src, base));
    });

    $("form").each((i, el) => {
      const action = $(el).attr("action");
      if (action) $(el).attr("action", proxify(action, base));
    });

    // ✅ Inject navigation + network control layer
    $("body").append(`
<script>
(function(){
  const proxify = (url) => {
    try {
      return "/proxy?url=" + encodeURIComponent(new URL(url, location.href).href);
    } catch {
      return url;
    }
  };

  // Intercept clicks
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.href) {
      e.preventDefault();
      window.location.href = proxify(a.href);
    }
  });

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === "string") {
      url = proxify(url);
    }
    return originalFetch.call(this, url, opts);
  };

  // Intercept XHR
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    arguments[1] = proxify(url);
    return origOpen.apply(this, arguments);
  };

})();
</script>
    `);

    // ✅ Service worker (keep yours, but cleaner)
    $("body").append(`
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send($.html());

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});
