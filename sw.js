/* MER-K · service worker: permite instalar la app y abrirla aunque la señal esté mala.
   Los datos (pedidos, pagos, productos) siempre se piden en vivo a Supabase: aquí no se guardan. */
const CACHE = 'merk-v3';
const SHELL = ['/', '/index.html', '/logo.png', '/logo-completo.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;           // Supabase, Wompi, fuentes: directo a internet
  if (r.mode === 'navigate' || u.pathname === '/' || u.pathname.endsWith('.html')) {
    // la página: siempre la versión más nueva; si no hay internet, la guardada
    e.respondWith(fetch(r.url, {cache: 'no-store', credentials: 'same-origin'}).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('/index.html', cp)); return res; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
});
