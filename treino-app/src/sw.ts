/// <reference lib="webworker" />
/**
 * Service worker: guarda o app inteiro em cache (lista injetada no build) e
 * responde do cache primeiro. Os dados ficam no IndexedDB, não passam por aqui.
 */
const sw = self as unknown as ServiceWorkerGlobalScope;
const ARQUIVOS = '__PRECACHE_MANIFEST__' as unknown as string[];
const VERSAO = '__PRECACHE_VERSION__' as unknown as string;
const CACHE = `treino-${VERSAO}`;

sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith('treino-') && k !== CACHE) await caches.delete(k);
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener('message', (event) => {
  if (event.data === 'ATUALIZAR') void sw.skipWaiting();
});

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== sw.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) void cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match('./index.html')) ?? Response.error();
      }
    })(),
  );
});
