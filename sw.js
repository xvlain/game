/**
 * 未定之旅 · Service Worker
 * 缓存策略：Cache First + Network Fallback
 * 支持离线游玩（已访问过的资源）
 */

const CACHE_NAME = 'undetermined-journey-v0.10.0';
const PRECACHE_URLS = [
  '/game/',
  '/game/index.html',
  '/game/manifest.json',
  '/game/js/engine.js',
  '/game/js/battle.js',
  '/game/js/battle-effects.js',
  '/game/js/story.js',
  '/game/js/save.js',
  '/game/js/gacha.js',
  '/game/js/growth.js',
  '/game/js/stages.js',
  '/game/js/characters.js',
  '/game/js/ui.js',
  '/game/js/ui-animations.js',
  '/game/js/main.js'
];

// 安装：预缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 预缓存核心资源');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：Cache First → Network Fallback → 更新缓存
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求和外部 CDN
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 外部 CDN（Supabase SDK、Google Fonts）→ Network Only
  if (url.hostname !== self.location.hostname) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // 后台静默更新
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
