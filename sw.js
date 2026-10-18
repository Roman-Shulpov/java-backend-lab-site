const CACHE='java-lab-shell-v9';
const ASSETS=['profile-avatar.png','./','index.html','app.js','pages.js','rhythm.js','art.js','dashboard.js','ui.js','brand-mark.svg','style.css','refresh.css','lessons.json','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png','icon.svg','java-lab-leaf.svg','java-lab-leaf.ico','java-lab-leaf-16.png','java-lab-leaf-32.png','java-lab-leaf-180.png','java-lab-leaf-192.png','java-lab-leaf-512.png','java-lab-leaf-maskable.png','manifest.webmanifest?v=leaf-1'];
const urls=new Set(ASSETS.map(x=>new URL(x,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll([...urls])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('java-lab-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!urls.has(event.request.url))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,clone)));}return response;}).catch(()=>caches.match(event.request)));
});
