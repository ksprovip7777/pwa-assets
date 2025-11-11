# 💻 Frontend - Progressive Web App

Thư mục này chứa code frontend PWA chạy trên browser.

---

## 📁 Files

### 1. pwa-main.js (~780 dòng)

**PWA Main Application** - Logic ứng dụng chính

**Features:**
- Client-side routing (SPA)
- State management (cart, user, filters)
- API integration
- UI rendering
- Event handling
- Toast notifications

**Modules:**
- `CONFIG` - Configuration
- `State` - State management
- `API` - API service
- `UI` - UI rendering
- `Router` - Client-side routing
- `Utils` - Utility functions
- `PWA` - Main app

### 2. service-worker.js (~684 dòng)

**Service Worker v2.0** - Offline & caching

**Caching Strategies:**
- **Network First**: API calls
- **Cache First**: Images, fonts
- **Stale While Revalidate**: CSS, JS
- **Cache Only**: Offline page

**Features:**
- Advanced caching
- Background sync
- Push notifications
- Cache management
- Periodic sync
- Message handling

**Cache Names:**
- `lotus-glass-pwa-static-v2.0.0`
- `lotus-glass-pwa-dynamic-v2.0.0`
- `lotus-glass-pwa-images-v2.0.0`
- `lotus-glass-pwa-api-v2.0.0`
- `lotus-glass-pwa-fonts-v2.0.0`

### 3. indexeddb.js (~100 dòng trong preview)

**IndexedDB Wrapper v3.0** - Client-side database

**Features:**
- Promise-based API (Dexie-like)
- Object stores: products, categories, cart, orders, offlineOrders, settings, syncMeta
- Sync engine (pull, push, bidirectional)
- TTL support (Time To Live)
- Full-text search
- Memory cache layer
- Transaction manager
- Migration system

**API:**
```javascript
const db = new LotusDB();
await db.init();

// CRUD Operations
await db.products.add(product);
await db.products.getAll();
await db.products.get(id);
await db.products.update(id, updates);
await db.products.delete(id);

// Search
await db.products.search('ly thủy tinh');

// Sync
await db.sync.pull('products');
await db.sync.push('orders');
```

### 4. filter-widget.js

**Filter Widget v3.0** - Advanced product filtering

**Features:**
- Virtual scrolling (1000+ items)
- Real-time filtering
- Price range slider
- Category filter
- Group filter
- Stock filter
- Sort options
- URL synchronization
- Mobile gestures
- Filter presets

**Performance:**
- 1000 items: 120ms (vs 800ms v2)
- Memory: 5MB (vs 50MB v2)
- FPS: 60 (vs 30 v2)

### 5. manifest.json (247 dòng)

**PWA Manifest** - Cấu hình Progressive Web App

**Key Properties:**
- `name`: "Lotus Glass - Shop Thủy Tinh Cao Cấp"
- `short_name`: "Lotus Glass"
- `theme_color`: "#ec5f1a"
- `display`: "standalone"
- `start_url`: "/?utm_source=pwa"

**Icons**: 8 sizes (72, 96, 128, 144, 152, 192, 384, 512)

**Screenshots**: 6 screens (mobile + desktop)

**Advanced Features:**
- Shortcuts (4 items)
- Share target
- Protocol handlers
- File handlers
- Launch handler

### 6. offline.html (519 dòng)

**Offline Fallback Page** - Trang hiển thị khi offline

**Features:**
- Beautiful UI
- Connection status indicator
- Retry button with auto-retry
- Feature showcase
- Cached product count
- Cached cart count
- Responsive design
- Smooth animations

---

## 🚀 Deployment

### Bước 1: Tạo Blogger Pages

Cần tạo **6 pages** trên Blogger:

| # | Title         | Permalink              | Source File        |
|---|---------------|------------------------|--------------------|
| 1 | manifest      | /p/manifest.html       | manifest.json      |
| 2 | service-worker| /p/sw-js.html          | service-worker.js  |
| 3 | pwa-main      | /p/pwa-main-js.html    | pwa-main.js        |
| 4 | indexeddb     | /p/indexeddb-js.html   | indexeddb.js       |
| 5 | filter-widget | /p/filter-widget-js.html| filter-widget.js  |
| 6 | offline       | /p/offline.html        | offline.html       |

### Bước 2: Copy Code

#### Page 1: Manifest (JSON)

```
Blogger → Pages → New page
Title: manifest
HTML mode: ON

Copy nội dung manifest.json (KHÔNG wrap trong <script>)
Paste vào

Permalink: /p/manifest.html
Publish
```

#### Page 2-5: JavaScript Files

```
Blogger → Pages → New page
Title: [tên file]
HTML mode: ON

Wrap code:
<script><![CDATA[
... paste JavaScript code here ...
]]></script>

Permalink: /p/[tên]-js.html
Publish
```

#### Page 6: Offline Page (HTML)

```
Blogger → Pages → New page
Title: offline
HTML mode: ON

Copy nội dung offline.html (KHÔNG wrap trong <script>)
Paste vào

Permalink: /p/offline.html
Publish
```

### Bước 3: Update API_URL

⚠️ **QUAN TRỌNG**: Thay API_URL trong `pwa-main.js`

Tìm dòng này:
```javascript
API_URL: 'https://script.google.com/macros/s/AKfycbw.../exec',
```

Thay bằng URL từ Backend deployment:
```javascript
API_URL: 'https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/exec',
```

### Bước 4: Test Pages

Kiểm tra từng page:

✅ `/p/manifest.html` → Hiển thị JSON  
✅ `/p/sw-js.html` → Hiển thị JavaScript  
✅ `/p/pwa-main-js.html` → Hiển thị JavaScript + API_URL đã update  
✅ `/p/indexeddb-js.html` → Hiển thị JavaScript  
✅ `/p/filter-widget-js.html` → Hiển thị JavaScript  
✅ `/p/offline.html` → Hiển thị trang HTML đẹp  

---

## ⚙️ Configuration

### PWA Main (pwa-main.js)

```javascript
const CONFIG = {
  API_URL: 'YOUR_API_URL_HERE',
  BLOG_URL: 'https://your-blog.blogspot.com',
  SHOP_NAME: 'Your Shop Name',
  CART_STORAGE_KEY: 'your-cart-v2',
  USER_STORAGE_KEY: 'your-user-v2',
  
  PAGINATION: {
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100
  },
  
  OFFLINE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  DEBUG: false
};
```

### Service Worker (service-worker.js)

```javascript
const VERSION = '2.0.0';
const CACHE_PREFIX = 'your-app-name';

const CACHE_LIMITS = {
  DYNAMIC: 50,
  IMAGES: 100,
  API: 30
};

const CACHE_DURATIONS = {
  API: 5 * 60 * 1000,        // 5 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000,  // 7 days
  STATIC: 30 * 24 * 60 * 60 * 1000  // 30 days
};
```

### IndexedDB (indexeddb.js)

```javascript
const DB_NAME = 'YourAppDB';
const DB_VERSION = 3;

const TTL = {
  PRODUCTS: 24 * 60 * 60 * 1000,      // 24 hours
  CATEGORIES: 7 * 24 * 60 * 60 * 1000, // 7 days
  SETTINGS: 60 * 60 * 1000             // 1 hour
};
```

---

## 🎨 Customization

### Thay Đổi Theme Color

**manifest.json:**
```json
{
  "theme_color": "#ec5f1a",
  "background_color": "#ffffff"
}
```

**Và trong theme HTML:**
```html
<meta name="theme-color" content="#ec5f1a"/>
```

### Thay Đổi Shop Name

**manifest.json:**
```json
{
  "name": "Your Shop - Slogan",
  "short_name": "Your Shop"
}
```

**pwa-main.js:**
```javascript
SHOP_NAME: 'Your Shop Name'
```

### Thay Đổi Icons

1. Tạo icons ở 8 sizes: 72, 96, 128, 144, 152, 192, 384, 512
2. Upload lên Blogger hoặc hosting
3. Update URLs trong `manifest.json`:

```json
{
  "icons": [
    {
      "src": "https://your-cdn.com/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 🧪 Testing

### Test Service Worker

```javascript
// Chrome DevTools → Console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', reg);
  console.log('SW active:', reg.active);
  console.log('SW installing:', reg.installing);
});
```

### Test Cache

```javascript
// Chrome DevTools → Application → Cache Storage
caches.keys().then(keys => {
  console.log('Cache names:', keys);
  
  keys.forEach(key => {
    caches.open(key).then(cache => {
      cache.keys().then(requests => {
        console.log(`${key}: ${requests.length} items`);
      });
    });
  });
});
```

### Test IndexedDB

```javascript
// Chrome DevTools → Application → IndexedDB
const request = indexedDB.open('LotusGlassDB', 3);

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('DB opened:', db);
  console.log('Stores:', db.objectStoreNames);
};
```

### Test Offline Mode

```
1. Chrome DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Refresh page (F5)
4. Page should still work!
```

---

## 🔍 Debugging

### Enable Debug Mode

**pwa-main.js:**
```javascript
const CONFIG = {
  DEBUG: true  // Bật logging
};
```

### Console Logs

```javascript
[PWA] Initializing v2.0...
[SW] Installing Service Worker v2.0.0
[SW] Activating Service Worker v2.0.0
[API] Response: {...}
[State] Cart updated: [...]
```

### Common Issues

**Service Worker không register:**
- ✅ Kiểm tra HTTPS enabled
- ✅ Kiểm tra URL chính xác: `/p/sw-js.html`
- ✅ Kiểm tra wrap code đúng format
- ✅ Clear cache và retry

**IndexedDB error:**
- ✅ Kiểm tra browser support
- ✅ Clear IndexedDB data
- ✅ Check quota exceeded

**API calls failed:**
- ✅ Kiểm tra API_URL đã update
- ✅ Kiểm tra CORS settings
- ✅ Network tab → xem errors

---

## 📊 Performance

### Lighthouse Scores

Expected scores:
- **Performance**: 90+
- **PWA**: 95+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+

### Optimization Tips

1. **Lazy load images**
   ```html
   <img src="..." loading="lazy" />
   ```

2. **Preload critical resources**
   ```html
   <link rel="preload" href="/p/pwa-main-js.html" as="script">
   ```

3. **Use CDN for libraries**
   ```html
   <link href="https://cdn.jsdelivr.net/..." rel="stylesheet">
   ```

4. **Minify code** (production)

5. **Enable compression** (if possible)

---

## 📚 Tài Liệu Khác

- [03-CAI-DAT-FRONTEND.md](../docs/03-CAI-DAT-FRONTEND.md) - Hướng dẫn setup chi tiết
- [07-TUY-CHINH.md](../docs/07-TUY-CHINH.md) - Tùy chỉnh nâng cao
- [08-TROUBLESHOOTING.md](../docs/08-TROUBLESHOOTING.md) - Xử lý lỗi

---

<div align="center">

**Frontend sẵn sàng? → Tiếp tục với [Theme Integration](../theme/README.md)** 🎨

</div>
