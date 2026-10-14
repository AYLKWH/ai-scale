// 离线缓存：第一次打开后，没网络也能用。
// 更新了任何文件后，把 VERSION 改一下（例如 v2），手机会自动下载新版本。
const VERSION = "v1";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "tf.min.js",
  "mnv2.json", "mnv2.bin", "products.json", "icon-192.png", "icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // products.json 先上网拿最新的，没网再用缓存；其他文件直接用缓存
  if (url.pathname.endsWith("products.json")) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
