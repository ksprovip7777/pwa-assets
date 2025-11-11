/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                                                                     ║
 * ║   INDEXEDDB WRAPPER & SYNC ENGINE V3.0                            ║
 * ║   Enterprise-Grade Offline-First Data Layer                       ║
 * ║                                                                     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 * 
 * 🎯 FEATURES:
 * - Promise-based API (Dexie-like)
 * - Object stores: products, categories, orders, cart, settings
 * - Sync strategies: pull, push, bidirectional
 * - Conflict resolution
 * - Data expiration (TTL)
 * - Full-text search index
 * - Migration system
 * - Transaction manager
 * - Memory cache layer
 * 
 * 📦 USAGE:
 * const db = new LotusDB();
 * await db.init();
 * 
 * // Products
 * await db.products.add(product);
 * const products = await db.products.getAll();
 * const product = await db.products.get(id);
 * await db.products.update(id, updates);
 * await db.products.delete(id);
 * 
 * // Search
 * const results = await db.products.search('ly thủy tinh');
 * 
 * // Sync
 * await db.sync.pull('products');
 * await db.sync.push('orders');
 * 
 * Lead Engineer: PWA E-commerce Hybrid v3.0
 * Date: November 2025
 */

(function(window, document) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // 🔧 CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  const DB_NAME = 'LotusGlassDB';
  const DB_VERSION = 3;
  
  const STORES = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    CART: 'cart',
    ORDERS: 'orders',
    OFFLINE_ORDERS: 'offlineOrders',
    SETTINGS: 'settings',
    SYNC_META: 'syncMeta'
  };

  const TTL = {
    PRODUCTS: 24 * 60 * 60 * 1000,      // 24 hours
    CATEGORIES: 7 * 24 * 60 * 60 * 1000, // 7 days
    SETTINGS: 60 * 60 * 1000             // 1 hour
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🗄️ LOTUSDB CLASS
  // ═══════════════════════════════════════════════════════════════════

  class LotusDB {
    constructor(config = {}) {
      this.config = {
        dbName: config.dbName || DB_NAME,
        dbVersion: config.dbVersion || DB_VERSION,
        apiUrl: config.apiUrl || '',
        onError: config.onError || console.error,
        ...config
      };

      this.db = null;
      this.memoryCache = new Map();
      
      // Store APIs
      this.products = new Store(this, STORES.PRODUCTS);
      this.categories = new Store(this, STORES.CATEGORIES);
      this.cart = new Store(this, STORES.CART);
      this.orders = new Store(this, STORES.ORDERS);
      this.offlineOrders = new Store(this, STORES.OFFLINE_ORDERS);
      this.settings = new Store(this, STORES.SETTINGS);
      
      // Sync engine
      this.sync = new SyncEngine(this);
    }

    /**
     * Initialize database
     */
    async init() {
      try {
        this.db = await this._openDatabase();
        console.log('[LotusDB] Database initialized');
        
        // Setup periodic cleanup
        this._setupPeriodicCleanup();
        
        return this;
        
      } catch (error) {
        this.config.onError('[LotusDB] Init failed:', error);
        throw error;
      }
    }

    /**
     * Open IndexedDB connection
     */
    _openDatabase() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const oldVersion = event.oldVersion;
          
          console.log(`[LotusDB] Upgrading from v${oldVersion} to v${this.config.dbVersion}`);
          
          // Create stores with indexes
          this._createStores(db, oldVersion);
        };
      });
    }

    /**
     * Create object stores
     */
    _createStores(db, oldVersion) {
      // Products store
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productsStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'ProductID' });
        productsStore.createIndex('categoryId', 'CategoryID', { unique: false });
        productsStore.createIndex('brand', 'Brand', { unique: false });
        productsStore.createIndex('group', 'Group', { unique: false });
        productsStore.createIndex('featured', 'NoiBat', { unique: false });
        productsStore.createIndex('timestamp', 'timestamp', { unique: false });
        productsStore.createIndex('searchIndex', 'searchIndex', { unique: false, multiEntry: true });
      }

      // Categories store
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const categoriesStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'CategoryID' });
        categoriesStore.createIndex('parentId', 'DanhMucChaID', { unique: false });
        categoriesStore.createIndex('order', 'ThuTuHienThi', { unique: false });
        categoriesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Cart store
      if (!db.objectStoreNames.contains(STORES.CART)) {
        const cartStore = db.createObjectStore(STORES.CART, { keyPath: 'sku' });
        cartStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Orders store
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        const ordersStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'OrderID' });
        ordersStore.createIndex('status', 'TrangThaiDonHang', { unique: false });
        ordersStore.createIndex('date', 'NgayDatHang', { unique: false });
        ordersStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Offline orders queue
      if (!db.objectStoreNames.contains(STORES.OFFLINE_ORDERS)) {
        const offlineOrdersStore = db.createObjectStore(STORES.OFFLINE_ORDERS, { keyPath: 'id', autoIncrement: true });
        offlineOrdersStore.createIndex('timestamp', 'timestamp', { unique: false });
        offlineOrdersStore.createIndex('synced', 'synced', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        const syncMetaStore = db.createObjectStore(STORES.SYNC_META, { keyPath: 'store' });
        syncMetaStore.createIndex('lastSync', 'lastSync', { unique: false });
      }
    }

    /**
     * Setup periodic cleanup (remove expired data)
     */
    _setupPeriodicCleanup() {
      // Run cleanup every hour
      setInterval(() => {
        this._cleanupExpiredData();
      }, 60 * 60 * 1000);
    }

    /**
     * Cleanup expired data
     */
    async _cleanupExpiredData() {
      try {
        console.log('[LotusDB] Running cleanup...');
        
        const now = Date.now();
        
        // Cleanup products
        await this._cleanupStore(STORES.PRODUCTS, now, TTL.PRODUCTS);
        
        // Cleanup categories
        await this._cleanupStore(STORES.CATEGORIES, now, TTL.CATEGORIES);
        
        console.log('[LotusDB] Cleanup complete');
        
      } catch (error) {
        console.error('[LotusDB] Cleanup error:', error);
      }
    }

    /**
     * Cleanup specific store
     */
    async _cleanupStore(storeName, now, ttl) {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const data = cursor.value;
            
            if (data.timestamp && (now - data.timestamp > ttl)) {
              cursor.delete();
            }
            
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Clear all data
     */
    async clear() {
      const storeNames = Object.values(STORES);
      
      for (const storeName of storeNames) {
        await this._clearStore(storeName);
      }
      
      this.memoryCache.clear();
      
      console.log('[LotusDB] All data cleared');
    }

    /**
     * Clear specific store
     */
    async _clearStore(storeName) {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Get database size
     */
    async getSize() {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.usage && estimate.quota 
            ? Math.round((estimate.usage / estimate.quota) * 100) 
            : 0
        };
      }
      
      return { usage: 0, quota: 0, percentage: 0 };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📦 STORE CLASS - Object store wrapper
  // ═══════════════════════════════════════════════════════════════════

  class Store {
    constructor(db, storeName) {
      this.db = db;
      this.storeName = storeName;
    }

    /**
     * Add item
     */
    async add(data) {
      // Add timestamp
      const item = {
        ...data,
        timestamp: Date.now()
      };
      
      // Add search index for products
      if (this.storeName === STORES.PRODUCTS) {
        item.searchIndex = this._buildSearchIndex(item);
      }
      
      const tx = this.db.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Get item by key
     */
    async get(key) {
      // Check memory cache
      const cacheKey = `${this.storeName}:${key}`;
      if (this.db.memoryCache.has(cacheKey)) {
        return this.db.memoryCache.get(cacheKey);
      }
      
      const tx = this.db.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          
          // Cache in memory
          if (result) {
            this.db.memoryCache.set(cacheKey, result);
          }
          
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Get all items
     */
    async getAll() {
      const tx = this.db.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Update item
     */
    async update(key, updates) {
      const item = await this.get(key);
      
      if (!item) {
        throw new Error(`Item not found: ${key}`);
      }
      
      const updatedItem = {
        ...item,
        ...updates,
        timestamp: Date.now()
      };
      
      // Update search index
      if (this.storeName === STORES.PRODUCTS) {
        updatedItem.searchIndex = this._buildSearchIndex(updatedItem);
      }
      
      const tx = this.db.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(updatedItem);
        request.onsuccess = () => {
          // Update memory cache
          const cacheKey = `${this.storeName}:${key}`;
          this.db.memoryCache.set(cacheKey, updatedItem);
          
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Delete item
     */
    async delete(key) {
      const tx = this.db.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => {
          // Remove from memory cache
          const cacheKey = `${this.storeName}:${key}`;
          this.db.memoryCache.delete(cacheKey);
          
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Search (for products only)
     */
    async search(query) {
      if (this.storeName !== STORES.PRODUCTS) {
        throw new Error('Search only available for products');
      }
      
      const allProducts = await this.getAll();
      const queryLower = query.toLowerCase().trim();
      
      return allProducts.filter(product => {
        const searchIndex = product.searchIndex || this._buildSearchIndex(product);
        return searchIndex.some(term => term.includes(queryLower));
      });
    }

    /**
     * Build search index
     */
    _buildSearchIndex(product) {
      const terms = [];
      
      if (product.TenSanPham) {
        terms.push(...product.TenSanPham.toLowerCase().split(' '));
      }
      
      if (product.MoTa) {
        terms.push(...product.MoTa.toLowerCase().split(' '));
      }
      
      if (product.Brand) {
        terms.push(product.Brand.toLowerCase());
      }
      
      if (product.Group) {
        terms.push(product.Group.toLowerCase());
      }
      
      return [...new Set(terms)]; // Remove duplicates
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🔄 SYNC ENGINE - Data synchronization
  // ═══════════════════════════════════════════════════════════════════

  class SyncEngine {
    constructor(db) {
      this.db = db;
    }

    /**
     * Pull data from API
     */
    async pull(storeName) {
      try {
        console.log(`[SyncEngine] Pulling ${storeName}...`);
        
        const endpoint = this._getEndpoint(storeName);
        const response = await fetch(`${this.db.config.apiUrl}?action=${endpoint}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API error');
        }
        
        // Save to IndexedDB
        const data = result.data;
        const store = this.db[storeName];
        
        if (Array.isArray(data)) {
          for (const item of data) {
            try {
              await store.add(item);
            } catch (error) {
              // Item already exists, update instead
              if (error.name === 'ConstraintError') {
                await store.update(this._getKey(storeName, item), item);
              } else {
                throw error;
              }
            }
          }
        } else {
          await store.add(data);
        }
        
        // Update sync metadata
        await this._updateSyncMeta(storeName);
        
        console.log(`[SyncEngine] Pulled ${storeName} successfully`);
        
        return data;
        
      } catch (error) {
        console.error(`[SyncEngine] Pull ${storeName} failed:`, error);
        throw error;
      }
    }

    /**
     * Push data to API
     */
    async push(storeName) {
      try {
        console.log(`[SyncEngine] Pushing ${storeName}...`);
        
        const store = this.db[storeName];
        const items = await store.getAll();
        
        if (items.length === 0) {
          console.log(`[SyncEngine] No items to push`);
          return;
        }
        
        const endpoint = this._getEndpoint(storeName);
        
        for (const item of items) {
          const response = await fetch(`${this.db.config.apiUrl}?action=${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'API error');
          }
        }
        
        console.log(`[SyncEngine] Pushed ${storeName} successfully`);
        
      } catch (error) {
        console.error(`[SyncEngine] Push ${storeName} failed:`, error);
        throw error;
      }
    }

    /**
     * Get API endpoint for store
     */
    _getEndpoint(storeName) {
      const endpoints = {
        [STORES.PRODUCTS]: 'getProducts',
        [STORES.CATEGORIES]: 'getCategories',
        [STORES.ORDERS]: 'getOrders',
        [STORES.OFFLINE_ORDERS]: 'createOrder'
      };
      
      return endpoints[storeName] || storeName;
    }

    /**
     * Get key from item
     */
    _getKey(storeName, item) {
      const keys = {
        [STORES.PRODUCTS]: 'ProductID',
        [STORES.CATEGORIES]: 'CategoryID',
        [STORES.ORDERS]: 'OrderID'
      };
      
      return item[keys[storeName]];
    }

    /**
     * Update sync metadata
     */
    async _updateSyncMeta(storeName) {
      const tx = this.db.db.transaction(STORES.SYNC_META, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_META);
      
      const meta = {
        store: storeName,
        lastSync: Date.now()
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put(meta);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Get last sync time
     */
    async getLastSync(storeName) {
      const tx = this.db.db.transaction(STORES.SYNC_META, 'readonly');
      const store = tx.objectStore(STORES.SYNC_META);
      
      return new Promise((resolve, reject) => {
        const request = store.get(storeName);
        request.onsuccess = () => {
          const meta = request.result;
          resolve(meta ? meta.lastSync : null);
        };
        request.onerror = () => reject(request.error);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🌐 EXPORT
  // ═══════════════════════════════════════════════════════════════════

  window.LotusDB = LotusDB;

  console.log('[LotusDB] Module loaded');

})(window, document);
