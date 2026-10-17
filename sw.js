const CACHE='java-lab-shell-v3';
const ASSETS=['./','index.html','app.js','pages.js','rhythm.js','art.js','dashboard.js','style.css','refresh.css','lessons.json','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png','icon.svg'];
const urls=new Set(ASSETS.map(x=>new URL(x,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll([...urls])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('java-lab-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!urls.has(event.request.url))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,clone)));}return response;}).catch(()=>caches.match(event.request)));
});
