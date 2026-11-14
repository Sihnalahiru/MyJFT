/* IRODORI PWA service worker — shell, data and same-origin media caches. */
const CACHE_VERSION='irodori-master-v2';
const SHELL_CACHE=CACHE_VERSION+'-shell';
const DATA_CACHE=CACHE_VERSION+'-data';
const MEDIA_CACHE=CACHE_VERSION+'-media';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./css/irodori-master.css','./js/irodori-master.js'];
const sameOrigin=url=>url.origin===self.location.origin;
const isMedia=url=>/\.(mp3|m4a|aac|ogg|wav|webp|png|jpg|jpeg|svg)$/i.test(url.pathname);
const isData=url=>/\.(json|csv)$/i.test(url.pathname);
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(SHELL_CACHE);await c.addAll(SHELL);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keep=new Set([SHELL_CACHE,DATA_CACHE,MEDIA_CACHE]);const keys=await caches.keys();await Promise.all(keys.filter(k=>/^(myjft-|irodori-master-)/.test(k)&&!keep.has(k)).map(k=>caches.delete(k)));await self.clients.claim()})()));
async function cacheFirst(request,name){const c=await caches.open(name);const hit=await c.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok&&response.type!=='opaque')await c.put(request,response.clone());return response}
async function shellFirst(request){const c=await caches.open(SHELL_CACHE);const hit=await c.match(request);if(hit)return hit;try{const response=await fetch(request);if(response.ok)await c.put(request,response.clone());return response}catch{return(await c.match('./index.html'))||Response.error()}}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(!sameOrigin(url))return;if(isMedia(url))event.respondWith(cacheFirst(req,MEDIA_CACHE).catch(()=>Response.error()));else if(isData(url))event.respondWith(cacheFirst(req,DATA_CACHE).catch(()=>Response.error()));else if(req.mode==='navigate'||SHELL.some(p=>url.pathname.endsWith(p.replace('./','/'))))event.respondWith(shellFirst(req))});
