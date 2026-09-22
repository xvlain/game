/**
 * Service Worker - 未定之旅 PWA
 * v0.12.0 - 增强缓存策略（版本化 + 分类缓存 + 离线降级）
 */

const CACHE_VERSION = 'v0.13.0';
const STATIC_CACHE = `game-static-${CACHE_VERSION}`;
const ASSET_CACHE = `game-assets-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `game-dynamic-${CACHE_VERSION}`;

// 静态资源（HTML + JS + CSS）—— CacheFirst 策略
const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './js/engine.js',
  './js/character-art.js',
  './js/battle.js',
  './js/battle-effects.js',
  './js/battle-cutscene.js',
  './js/battle-chain.js',
  './js/story.js',
  './js/save.js',
  './js/gacha.js',
  './js/growth.js',
  './js/stages.js',
  './js/quests.js',
  './js/characters.js',
  './js/ui.js',
  './js/ui-animations.js',
  './js/achievements.js',
  './js/main.js'
];

// 美术资源 —— StaleWhileRevalidate 策略
const ASSET_PATTERNS = [
  /assets\/.*\.(png|jpg|webp|svg|gif)$/
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log(`[SW] 安装 ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] 静态缓存失败:', err))
  );
});

// 激活事件（清理旧缓存）
self.addEventListener('activate', (event) => {
  console.log(`[SW] 激活 ${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => !key.includes(CACHE_VERSION))
          .map(key => {
            console.log('[SW] 清理旧缓存:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Supabase API 请求 → 不缓存，直接转发
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 2. 静态资源（JS/CSS/HTML）→ CacheFirst
  if (STATIC_FILES.some(f => url.pathname.endsWith(f.replace('./', ''))) ||
      url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // 3. 美术资源（图片）→ StaleWhileRevalidate
  if (ASSET_PATTERNS.some(p => p.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(event.request, ASSET_CACHE));
    return;
  }

  // 4. CDN 资源（Supabase SDK, Google Fonts）→ StaleWhileRevalidate
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('fonts.')) {
    event.respondWith(staleWhileRevalidate(event.request, DYNAMIC_CACHE));
    return;
  }

  // 5. 其他请求 → NetworkFirst（带离线降级 + 离线页面）
  event.respondWith(
    networkFirst(event.request, DYNAMIC_CACHE).then(response => response).catch(() => {
      // 离线降级：尝试返回离线页面
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // 对 HTML 请求返回离线提示页
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>离线</title><style>body{background:#0a0a14;color:#e0e0e0;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif}div{text-align:center}h1{color:#8a5cbf}p{color:#8080a0}</style></head><body><div><h1>未定之旅</h1><p>当前无网络连接</p><p style="font-size:14px">恢复网络后刷新页面即可继续</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ============ 缓存策略 ============

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 返回缓存（如果有），同时后台更新
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
