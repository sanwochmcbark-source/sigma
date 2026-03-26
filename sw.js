self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // skip same-origin
  if (url.origin === location.origin) return;

  const proxyURL = `/proxy?url=${encodeURIComponent(event.request.url)}`;

  event.respondWith(fetch(proxyURL));
});
