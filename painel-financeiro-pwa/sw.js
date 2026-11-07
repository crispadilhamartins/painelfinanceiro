/* Service worker do Painel Financeiro
   Estratégia: "stale-while-revalidate" — abre na hora com o que está em cache
   (funciona 100% offline) e atualiza o cache em segundo plano quando há internet.
   Os DADOS ficam no localStorage do navegador; o service worker só guarda o app. */
const VERSION = 'painel-financeiro-v1';
const CORE = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => Promise.all(CORE.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const rede = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copia = res.clone();
          caches.open(VERSION).then(cache => cache.put(req, copia));
        }
        return res;
      }).catch(() => null);

      if (hit) return hit;
      return rede.then(res => {
        if (res) return res;
        if (req.mode === 'navigate') {
          return caches.match('./').then(r => r || caches.match('index.html'));
        }
        return Response.error();
      });
    })
  );
});
