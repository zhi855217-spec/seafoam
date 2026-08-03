var CACHE_NAME='seafoam-v14';
var ASSETS=['app.html','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png','icon-maskable-512.png'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS).catch(function(){});
    })
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME}).map(function(k){return caches.delete(k)}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  // HTML: network first (always get latest version)
  if(req.mode==='navigate'||url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(req,copy)});
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){return cached||caches.match('app.html')});
      })
    );
    return;
  }
  // Other assets: cache first, then network
  e.respondWith(
    caches.match(req).then(function(cached){
      return cached||fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(req,copy)});
        return res;
      }).catch(function(){return cached});
    })
  );
});

self.addEventListener('message',function(e){
  if(e.data==='SKIP_WAITING')self.skipWaiting();
});