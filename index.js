const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const cheerio = require("cheerio");

const app = express();

// 🔑 ADD YOUR KEY HERE
const SCRAPINGBEE_API_KEY = "P2J007K7MLOAWKLDK7FV8HE2Y8T8PHZ73R1FS8Z2D4IB29WB2AH4YAY6JWJ8P0ZDXUBVT5YH9192W3ZD";

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

  // prevent double proxy
  if (resolved.includes("/proxy?url=")) return resolved;

  return `/proxy?url=${encodeURIComponent(resolved)}`;
}

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("No URL");

  try {
    let response;

    try {
      // 🟢 Primary fetch
      response = await fetch(target, {
        headers: {
          "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
          "Accept": req.headers["accept"] || "*/*",
          "Accept-Language": req.headers["accept-language"] || "en-US"
        }
      });

      // 🔍 Detect blocked pages even if 200
      const textCheck = await response.clone().text();

      if (
        !response.ok ||
        response.status >= 400 ||
        textCheck.includes("captcha") ||
        textCheck.includes("Access Denied") ||
        textCheck.includes("Request blocked")
      ) {
        throw new Error("Blocked or failed");
      }

    } catch (err) {
      console.log("🔁 Falling back to ScrapingBee...");

      const beeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(target)}&render_js=true`;

      response = await fetch(beeUrl);
    }

    const contentType = response.headers.get("content-type") || "";

    // ✅ Non-HTML passthrough
    if (!contentType.includes("text/html")) {
      const buffer = await response.buffer();
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    }

    let html = await response.text();
    const base = target;

    const $ = cheerio.load(html);

    // 🔗 Rewrite links
    $("a, link").each((i, el) => {
      const href = $(el).attr("href");
      if (href) $(el).attr("href", proxify(href, base));
    });

    // 🖼 Rewrite sources
    $("img, script").each((i, el) => {
      const src = $(el).attr("src");
      if (src) $(el).attr("src", proxify(src, base));
    });

    // 📤 Rewrite forms
    $("form").each((i, el) => {
      const action = $(el).attr("action");
      if (action) $(el).attr("action", proxify(action, base));
    });

    // 🧠 Inject control layer
    const injectedScript = `
<script>
(function(){
  const proxify = (url) => {
    try {
      return "/proxy?url=" + encodeURIComponent(new URL(url, location.href).href);
    } catch {
      return url;
    }
  };

  // 🔗 Intercept link clicks
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.href) {
      e.preventDefault();
      window.location.href = proxify(a.href);
    }
  });

  // 🌐 Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === "string") {
      url = proxify(url);
    }
    return originalFetch.call(this, url, opts);
  };

  // 📡 Intercept XHR
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    arguments[1] = proxify(url);
    return origOpen.apply(this, arguments);
  };

  // 🔄 SPA navigation support
  const origPushState = history.pushState;
  history.pushState = function(state, title, url) {
    if (url) url = proxify(url);
    return origPushState.call(this, state, title, url);
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    if (url) url = proxify(url);
    return origReplaceState.call(this, state, title, url);
  };

})();
</script>
`;

    // 🔧 Inject safely
    if ($("body").length) {
      $("body").append(injectedScript);
    } else {
      $.root().append(injectedScript);
    }

    // 🔧 Service worker
    const swScript = `
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
`;

    if ($("body").length) {
      $("body").append(swScript);
    } else {
      $.root().append(swScript);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send($.html());

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});const express = require("express");
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
    let response;
    
    try {
      // 🟢 Try normal fetch first
      response = await fetch(target, {
        headers: {
          "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
          "Accept": req.headers["accept"] || "*/*",
          "Accept-Language": req.headers["accept-language"] || "en-US"
        }
      });
    
      // If blocked or bad response → force fallback
      if (!response.ok || response.status >= 400) {
        throw new Error("Primary fetch failed");
      }
    
    } catch (err) {
      console.log("🔁 Falling back to ScrapingBee...");
    
      const beeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(target)}&render_js=true`;
    
      response = await fetch(beeUrl);
    }

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

app.get("/", (req, res) => {
  console.log("ROOT HIT");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});
