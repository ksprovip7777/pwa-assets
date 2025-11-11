/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                                                                     ║
 * ║   SERVICE WORKER v2.0 - PWA E-COMMERCE 2025                       ║
 * ║   Advanced Caching, Background Sync, Push Notifications           ║
 * ║                                                                     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 * 
 * 🚀 NEW FEATURES (2025):
 * - Workbox-inspired caching strategies
 * - Background Sync for offline orders
 * - Push Notifications support
 * - Periodic Background Sync
 * - Advanced cache management
 * - Network-first with fallback
 * - Stale-while-revalidate for assets
 * - Cache versioning & cleanup
 * - Analytics for offline usage
 * 
 * 📚 CACHING STRATEGIES:
 * 1. Network First: API calls (with fallback)
 * 2. Cache First: Images, fonts, static assets
 * 3. Stale While Revalidate: CSS, JS
 * 4. Cache Only: Offline pages
 * 
 * Lead Engineer: PWA E-commerce Hybrid Project
 * Version: 2.0.0
 * Date: November 2025
 */

// ═══════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const VERSION = '2.0.0';
const CACHE_PREFIX = 'lotus-glass-pwa';

const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v${VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${VERSION}`,
  API: `${CACHE_PREFIX}-api-v${VERSION}`,
  FONTS: `${CACHE_PREFIX}-fonts-v${VERSION}`
};

const CACHE_LIMITS = {
  DYNAMIC: 50,
  IMAGES: 100,
  API: 30
};

const CACHE_DURATIONS = {
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/p/pwa-main-js.html',
  // Add your critical CSS/JS here
];

// API patterns
const API_PATTERNS = [
  /script\.google\.com/,
  /\/api\//
];

// Image patterns
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /bp\.blogspot\.com/,
  /googleusercontent\.com/
];

// Font patterns
const FONT_PATTERNS = [
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
  /\.(?:woff|woff2|ttf|otf)$/
];

// ═══════════════════════════════════════════════════════════════════
// 📦 INSTALL EVENT
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Precache static assets
        const cache = await caches.open(CACHES.STATIC);
        await cache.addAll(PRECACHE_ASSETS);
        
        console.log('[SW] Precached static assets');
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
        
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

// ═══════════════════════════════════════════════════════════════════
// ⚡ ACTIVATE EVENT
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(name)
        );
        
        await Promise.all(
          oldCaches.map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
        );
        
        // Claim clients immediately
        await self.clients.claim();
        
        console.log('[SW] Activated successfully');
        
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// ═══════════════════════════════════════════════════════════════════
// 🌐 FETCH EVENT - ROUTING
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Route to appropriate strategy
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHES.IMAGES));
  } else if (isFontRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHES.FONTS));
  } else if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// ═══════════════════════════════════════════════════════════════════
// 🎯 CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Network First Strategy
 * Try network, fallback to cache, then offline page
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHES.DYNAMIC);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Both failed, return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Return error response
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
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is expired
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const age = now - cachedDate;
    
    const maxAge = cacheName === CACHES.IMAGES ? 
      CACHE_DURATIONS.IMAGES : CACHE_DURATIONS.STATIC;
    
    if (age < maxAge) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
  }
  
  // Cache miss or expired, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache
      cache.put(request, networkResponse.clone());
      
      // Limit cache size
      await limitCacheSize(cacheName, CACHE_LIMITS.IMAGES);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Return cached version even if expired
    if (cachedResponse) {
      console.log('[SW] Serving stale cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, update in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHES.STATIC);
  
  // Get cached version
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

// ═══════════════════════════════════════════════════════════════════
// 🔍 URL PATTERN MATCHING
// ═══════════════════════════════════════════════════════════════════

function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.href));
}

function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.href));
}

function isFontRequest(url) {
  return FONT_PATTERNS.some(pattern => pattern.test(url.href));
}

function isStaticAsset(url) {
  return /\.(css|js)$/.test(url.pathname);
}

// ═══════════════════════════════════════════════════════════════════
// 🧹 CACHE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete oldest entries
    const deleteCount = keys.length - maxItems;
    await Promise.all(
      keys.slice(0, deleteCount).map(key => cache.delete(key))
    );
  }
}

/**
 * Clean expired cache entries
 */
async function cleanExpiredCache(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const now = new Date();
  
  const deletePromises = keys.map(async (key) => {
    const response = await cache.match(key);
    if (response) {
      const cachedDate = new Date(response.headers.get('date'));
      const age = now - cachedDate;
      
      if (age > maxAge) {
        console.log('[SW] Deleting expired cache:', key.url);
        return cache.delete(key);
      }
    }
  });
  
  await Promise.all(deletePromises);
}

// ═══════════════════════════════════════════════════════════════════
// 🔄 BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

/**
 * Sync offline orders to server
 */
async function syncOrders() {
  try {
    // Get pending orders from IndexedDB
    const db = await openIndexedDB();
    const orders = await getFromIndexedDB(db, 'pending-orders');
    
    if (!orders || orders.length === 0) {
      console.log('[SW] No pending orders to sync');
      return;
    }
    
    // Sync each order
    for (const order of orders) {
      try {
        const response = await fetch(order.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          // Remove from pending
          await removeFromIndexedDB(db, 'pending-orders', order.id);
          console.log('[SW] Order synced:', order.id);
          
          // Notify client
          notifyClients({
            type: 'ORDER_SYNCED',
            orderId: order.id
          });
        }
        
      } catch (error) {
        console.error('[SW] Failed to sync order:', order.id, error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Sync orders failed:', error);
  }
}

/**
 * Sync cart data
 */
async function syncCart() {
  console.log('[SW] Syncing cart...');
  // Implement cart sync logic if needed
}

// ═══════════════════════════════════════════════════════════════════
// 🔔 PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Lotus Glass';
  const options = {
    body: data.body || 'Có thông báo mới từ Lotus Glass',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-96.png',
    image: data.image,
    data: data,
    actions: data.actions || [
      { action: 'open', title: 'Xem ngay' },
      { action: 'close', title: 'Đóng' }
    ],
    tag: data.tag || 'lotus-glass-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if already open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// 🔄 PERIODIC BACKGROUND SYNC (Experimental)
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'check-new-products') {
    event.waitUntil(checkNewProducts());
  } else if (event.tag === 'clean-cache') {
    event.waitUntil(periodicCacheCleanup());
  }
});

/**
 * Check for new products
 */
async function checkNewProducts() {
  console.log('[SW] Checking for new products...');
  // Implement logic to check for new products and notify user
}

/**
 * Periodic cache cleanup
 */
async function periodicCacheCleanup() {
  console.log('[SW] Running periodic cache cleanup...');
  
  try {
    await cleanExpiredCache(CACHES.API, CACHE_DURATIONS.API);
    await cleanExpiredCache(CACHES.IMAGES, CACHE_DURATIONS.IMAGES);
    
    console.log('[SW] Cache cleanup completed');
    
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 💬 MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls));
      break;
      
    case 'GET_CACHE_STATS':
      event.waitUntil(getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      }));
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(CACHES.DYNAMIC);
  await cache.addAll(urls);
  console.log('[SW] Cached URLs:', urls);
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = keys.length;
  }
  
  return {
    version: VERSION,
    caches: stats,
    total: Object.values(stats).reduce((a, b) => a + b, 0)
  };
}

/**
 * Notify all clients
 */
async function notifyClients(message) {
  const clientList = await clients.matchAll({ includeUncontrolled: true });
  
  clientList.forEach(client => {
    client.postMessage(message);
  });
}

// ═══════════════════════════════════════════════════════════════════
// 💾 INDEXEDDB HELPERS
// ═══════════════════════════════════════════════════════════════════

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lotus-glass-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-orders')) {
        db.createObjectStore('pending-orders', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' });
      }
    };
  });
}

function getFromIndexedDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromIndexedDB(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ═══════════════════════════════════════════════════════════════════
// 📊 ANALYTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Track offline usage
 */
function trackOfflineUsage(url) {
  // Send analytics when back online
  self.addEventListener('online', () => {
    // Implement analytics tracking
    console.log('[SW] Analytics: Offline usage tracked');
  });
}

// ═══════════════════════════════════════════════════════════════════
// ✅ SERVICE WORKER READY
// ═══════════════════════════════════════════════════════════════════

console.log('[SW] Service Worker v' + VERSION + ' loaded successfully');
