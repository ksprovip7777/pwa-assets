/**
 * ═══════════════════════════════════════════════════════════════════
 * SERVICE WORKER v2.1 - Phale Việt Tiệp PWA
 * URL: https://ksprovip7777.github.io/pwa-assets/service-worker.js
 * ═══════════════════════════════════════════════════════════════════
 */

const VERSION = '2.1.0';
const CACHE_PREFIX = 'pvt-pwa';
const CACHE_NAME = `${CACHE_PREFIX}-v${VERSION}`;
const OFFLINE_URL = 'https://ksprovip7777.github.io/pwa-assets/offline.html';

// URLs to cache immediately on install
const PRECACHE_URLS = [
  'https://30namthuytinhphaleviettiep.blogspot.com/',
  OFFLINE_URL
];

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// URL patterns and their strategies
const CACHE_PATTERNS = [
  {
    pattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: `${CACHE_PREFIX}-images`
  },
  {
    pattern: /\.(?:js|css)$/i,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: `${CACHE_PREFIX}-assets`
  },
  {
    pattern: /^https:\/\/fonts\.googleapis\.com/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: `${CACHE_PREFIX}-fonts`
  },
  {
    pattern: /^https:\/\/fonts\.gstatic\.com/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: `${CACHE_PREFIX}-font-files`
  }
];

// ═══════════════════════════════════════════════════════════════════
// INSTALL EVENT
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('install', event => {
  console.log('[SW] Installing v' + VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching files');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .then(() => {
        console.log('[SW] Precaching complete');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Precaching failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════
// ACTIVATE EVENT
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('activate', event => {
  console.log('[SW] Activating v' + VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ═══════════════════════════════════════════════════════════════════
// FETCH EVENT - MAIN ROUTING
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http protocols
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip Google Apps Script API calls (always fresh)
  if (request.url.includes('script.google.com')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Find matching cache strategy
  const matchedPattern = CACHE_PATTERNS.find(pattern => 
    pattern.pattern.test(request.url)
  );
  
  if (matchedPattern) {
    // Use specific cache strategy
    event.respondWith(
      handleCacheStrategy(request, matchedPattern.strategy, matchedPattern.cacheName)
    );
  } else {
    // Default: Network first for HTML pages
    event.respondWith(
      networkFirst(request, CACHE_NAME)
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle cache strategy routing
 */
async function handleCacheStrategy(request, strategy, cacheName) {
  switch (strategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName);
    
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName);
    
    default:
      return networkFirst(request, cacheName);
  }
}

/**
 * Network First: Try network, fallback to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If HTML request and no cache, return offline page
    if (request.headers.get('accept').includes('text/html')) {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return generic error response
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Cache First: Try cache, fallback to network
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Not found', {status: 404});
  }
}

/**
 * Stale While Revalidate: Return cache immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(err => {
    console.log('[SW] Background fetch failed:', err);
  });
  
  return cachedResponse || fetchPromise;
}

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('sync', event => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  try {
    console.log('[SW] Syncing offline orders...');
    
    // TODO: Implement actual sync logic
    // Get orders from IndexedDB
    // Send to API
    // Update status
    
    console.log('[SW] Sync complete');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('push', event => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'Phale Việt Tiệp',
    body: 'Bạn có thông báo mới',
    icon: 'https://ksprovip7777.github.io/pwa-assets/icons/icon-192.png',
    badge: 'https://ksprovip7777.github.io/pwa-assets/icons/icon-96.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data
    })
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('https://30namthuytinhphaleviettiep.blogspot.com/')
  );
});

// ═══════════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({success: true});
      })
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// CONSOLE LOG
// ═══════════════════════════════════════════════════════════════════

console.log('[SW] Service Worker v' + VERSION + ' loaded');
console.log('[SW] Cache name:', CACHE_NAME);
console.log('[SW] Offline URL:', OFFLINE_URL);
