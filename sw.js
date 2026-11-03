/* MyJFT offline-first service worker.
 * App shell + JSON data are cached on install.
 * Media is cached only when requested, so first load stays lightweight.
 */
const CACHE_VERSION = 'myjft-v11';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const DATA_CACHE = CACHE_VERSION + '-data';
const MEDIA_CACHE = CACHE_VERSION + '-media';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg'];
const isSameOrigin = (url) => url.origin === self.location.origin;
const isMedia = (url) => /\.(mp3|webp|png|jpg|jpeg|svg)$/i.test(url.pathname);
const isData = (url) => /\.json$/i.test(url.pathname);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE,DATA_CACHE,MEDIA_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('myjft-') && !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') await cache.put(request,response.clone());
  return response;
}
async function appShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try { const response = await fetch(request); if(response.ok) await cache.put(request,response.clone()); return response; }
  catch { return (await cache.match('./index.html')) || Response.error(); }
}
self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(!isSameOrigin(url)) return; // Never make external official URLs look offline-ready.
  if(isMedia(url)) event.respondWith(cacheFirst(request,MEDIA_CACHE).catch(()=>Response.error()));
  else if(isData(url)) event.respondWith(cacheFirst(request,DATA_CACHE).catch(()=>Response.error()));
  else if(request.mode==='navigate' || SHELL.some(path=>url.pathname.endsWith(path.replace('./','/'))))
    event.respondWith(appShell(request));
});
