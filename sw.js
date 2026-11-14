/* IRODORI PWA service worker — shell, data and same-origin media caches. */
const CACHE_VERSION='irodori-master-v3';
const SHELL_CACHE=CACHE_VERSION+'-shell';
const DATA_CACHE=CACHE_VERSION+'-data';
const MEDIA_CACHE=CACHE_VERSION+'-media';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./css/irodori-master.css','./js/irodori-master.js'];
const sameOrigin=url=>url.origin===self.location.origin;
const isMedia=url=>/\.(mp3|m4a|aac|ogg|wav|webp|png|jpg|jpeg|svg)$/i.test(url.pathname);
const isData=url=>/\.(json|csv)$/i.test(url.pathname);
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(SHELL_CACHE);await c.addAll(SHELL);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keep=new Set([SHELL_CACHE,DATA_CACHE,MEDIA_CACHE]);const keys=await caches.keys();await Promise.all(keys.filter(k=>/^(myjft-|irodori-master-)/.test(k)&&!keep.has(k)).map(k=>caches.delete(k)));await self.clients.claim()})()));
async function cacheFirst(request,name){const c=await caches.open(name);const hit=await c.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok&&response.status===200&&response.type!=='opaque')await c.put(request,response.clone());return response}
async function rangeFromCached(response,rangeHeader){
 const match=/^bytes=(\d*)-(\d*)$/.exec(rangeHeader||'');if(!match)return response;
 const buffer=await response.arrayBuffer(),total=buffer.byteLength;
 let start,end;
 if(match[1]===''){const suffix=Number(match[2]||0);start=Math.max(0,total-suffix);end=total-1;}
 else{start=Number(match[1]);end=match[2]?Number(match[2]):total-1;}
 if(start>=total||end<start)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});
 end=Math.min(end,total-1);
 const headers=new Headers(response.headers);headers.set('Accept-Ranges','bytes');headers.set('Content-Range','bytes '+start+'-'+end+'/'+total);headers.set('Content-Length',String(end-start+1));
 return new Response(buffer.slice(start,end+1),{status:206,statusText:'Partial Content',headers});
}
async function mediaResponse(request){
 const cache=await caches.open(MEDIA_CACHE),range=request.headers.get('range');
 if(range){
  const full=await cache.match(new Request(request.url));
  if(full)return rangeFromCached(full,range);
  return fetch(request);
 }
 const hit=await cache.match(request);if(hit)return hit;
 const response=await fetch(request);
 if(response.ok&&response.status===200&&response.type!=='opaque')await cache.put(request,response.clone());
 return response;
}
async function shellFirst(request){const c=await caches.open(SHELL_CACHE);const hit=await c.match(request);if(hit)return hit;try{const response=await fetch(request);if(response.ok)await c.put(request,response.clone());return response}catch{return(await c.match('./index.html'))||Response.error()}}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(!sameOrigin(url))return;if(isMedia(url))event.respondWith(mediaResponse(req).catch(()=>Response.error()));else if(isData(url))event.respondWith(cacheFirst(req,DATA_CACHE).catch(()=>Response.error()));else if(req.mode==='navigate'||SHELL.some(p=>url.pathname.endsWith(p.replace('./','/'))))event.respondWith(shellFirst(req))});
