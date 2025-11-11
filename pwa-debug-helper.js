/**
 * ═══════════════════════════════════════════════════════════════════
 * PWA DEBUG HELPER - Paste vào Console để kiểm tra
 * GitHub: ksprovip7777
 * ═══════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';
  
  const DEBUG = {
    version: '1.0.0',
    results: {},
    
    // Run all tests
    async runAll() {
      console.log('%c🔍 PWA DEBUG HELPER v' + this.version, 'font-size: 20px; font-weight: bold; color: #ec5f1a;');
      console.log('─'.repeat(70));
      
      await this.checkEnvironment();
      await this.checkServiceWorker();
      await this.checkManifest();
      await this.checkIndexedDB();
      await this.checkAPI();
      await this.checkState();
      await this.checkCache();
      await this.checkErrors();
      
      this.showSummary();
    },
    
    // 1. Check Environment
    async checkEnvironment() {
      console.log('\n%c1️⃣ ENVIRONMENT CHECK', 'font-weight: bold; font-size: 16px;');
      
      const results = {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isHTTPS: window.location.protocol === 'https:',
        isOnline: navigator.onLine,
        browser: navigator.userAgent,
        serviceWorkerSupported: 'serviceWorker' in navigator,
        indexedDBSupported: 'indexedDB' in window,
        cacheSupported: 'caches' in window
      };
      
      console.log('Protocol:', results.isHTTPS ? '✅ HTTPS' : '❌ HTTP (SW requires HTTPS)');
      console.log('Hostname:', results.hostname);
      console.log('Online:', results.isOnline ? '✅ Yes' : '❌ No');
      console.log('Service Worker Support:', results.serviceWorkerSupported ? '✅ Yes' : '❌ No');
      console.log('IndexedDB Support:', results.indexedDBSupported ? '✅ Yes' : '❌ No');
      console.log('Cache API Support:', results.cacheSupported ? '✅ Yes' : '❌ No');
      
      this.results.environment = results;
    },
    
    // 2. Check Service Worker
    async checkServiceWorker() {
      console.log('\n%c2️⃣ SERVICE WORKER CHECK', 'font-weight: bold; font-size: 16px;');
      
      if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        this.results.serviceWorker = {supported: false};
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          console.log('❌ Service Worker not registered');
          console.log('Expected URL: https://ksprovip7777.github.io/pwa-assets/service-worker.js');
          this.results.serviceWorker = {registered: false};
          return;
        }
        
        const results = {
          registered: true,
          scope: registration.scope,
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          updateViaCache: registration.updateViaCache
        };
        
        console.log('✅ Service Worker registered');
        console.log('Scope:', results.scope);
        console.log('Active:', results.active ? '✅ Yes' : '❌ No');
        console.log('Installing:', results.installing ? '⏳ Yes' : '✅ No');
        console.log('Waiting:', results.waiting ? '⏳ Yes' : '✅ No');
        
        if (registration.active) {
          console.log('Script URL:', registration.active.scriptURL);
          console.log('State:', registration.active.state);
        }
        
        this.results.serviceWorker = results;
        
      } catch (error) {
        console.error('❌ Error checking Service Worker:', error);
        this.results.serviceWorker = {error: error.message};
      }
    },
    
    // 3. Check Manifest
    async checkManifest() {
      console.log('\n%c3️⃣ MANIFEST CHECK', 'font-weight: bold; font-size: 16px;');
      
      const manifestLink = document.querySelector('link[rel="manifest"]');
      
      if (!manifestLink) {
        console.log('❌ Manifest link not found in <head>');
        this.results.manifest = {found: false};
        return;
      }
      
      console.log('Manifest URL:', manifestLink.href);
      
      try {
        const response = await fetch(manifestLink.href);
        
        if (!response.ok) {
          console.log('❌ Manifest fetch failed:', response.status);
          this.results.manifest = {error: 'HTTP ' + response.status};
          return;
        }
        
        const manifest = await response.json();
        
        console.log('✅ Manifest loaded');
        console.log('App Name:', manifest.name);
        console.log('Short Name:', manifest.short_name);
        console.log('Start URL:', manifest.start_url);
        console.log('Display:', manifest.display);
        console.log('Theme Color:', manifest.theme_color);
        console.log('Icons:', manifest.icons?.length || 0);
        
        this.results.manifest = {
          found: true,
          valid: true,
          data: manifest
        };
        
      } catch (error) {
        console.error('❌ Error loading manifest:', error);
        this.results.manifest = {error: error.message};
      }
    },
    
    // 4. Check IndexedDB
    async checkIndexedDB() {
      console.log('\n%c4️⃣ INDEXEDDB CHECK', 'font-weight: bold; font-size: 16px;');
      
      if (!('indexedDB' in window)) {
        console.log('❌ IndexedDB not supported');
        this.results.indexedDB = {supported: false};
        return;
      }
      
      try {
        const dbs = await indexedDB.databases();
        const lotusDB = dbs.find(db => db.name === 'LotusGlassDB');
        
        if (!lotusDB) {
          console.log('❌ LotusGlassDB not found');
          console.log('Available databases:', dbs.map(db => db.name));
          this.results.indexedDB = {found: false};
          return;
        }
        
        console.log('✅ LotusGlassDB found');
        console.log('Version:', lotusDB.version);
        
        // Open DB and check stores
        const request = indexedDB.open('LotusGlassDB');
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const storeNames = Array.from(db.objectStoreNames);
          
          console.log('Object Stores:', storeNames);
          
          // Check each store
          const tx = db.transaction(storeNames, 'readonly');
          
          storeNames.forEach(storeName => {
            const store = tx.objectStore(storeName);
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
              const count = countRequest.result;
              const icon = count > 0 ? '✅' : '⚠️';
              console.log(`${icon} ${storeName}: ${count} items`);
            };
          });
          
          this.results.indexedDB = {
            found: true,
            version: lotusDB.version,
            stores: storeNames
          };
        };
        
        request.onerror = () => {
          console.error('❌ Error opening LotusGlassDB');
          this.results.indexedDB = {error: 'Cannot open database'};
        };
        
      } catch (error) {
        console.error('❌ Error checking IndexedDB:', error);
        this.results.indexedDB = {error: error.message};
      }
    },
    
    // 5. Check API
    async checkAPI() {
      console.log('\n%c5️⃣ API CHECK', 'font-weight: bold; font-size: 16px;');
      
      if (!window.LotusAPI) {
        console.log('❌ LotusAPI not found');
        this.results.api = {found: false};
        return;
      }
      
      console.log('✅ LotusAPI found');
      
      // Test ping
      try {
        console.log('Testing API ping...');
        const pingResult = await window.LotusAPI.call('ping');
        console.log('✅ Ping successful:', pingResult);
        
        // Test getProducts
        console.log('Testing getProducts...');
        const productsResult = await window.LotusAPI.getProducts({limit: 5});
        console.log('✅ getProducts successful:', productsResult.products?.length || 0, 'products');
        
        // Test getCategories
        console.log('Testing getCategories...');
        const categoriesResult = await window.LotusAPI.getCategories();
        console.log('✅ getCategories successful:', categoriesResult.categories?.length || 0, 'categories');
        
        this.results.api = {
          found: true,
          working: true,
          products: productsResult.products?.length || 0,
          categories: categoriesResult.categories?.length || 0
        };
        
      } catch (error) {
        console.error('❌ API test failed:', error);
        this.results.api = {found: true, working: false, error: error.message};
      }
    },
    
    // 6. Check State
    checkState() {
      console.log('\n%c6️⃣ STATE CHECK', 'font-weight: bold; font-size: 16px;');
      
      if (!window.LotusState) {
        console.log('❌ LotusState not found');
        this.results.state = {found: false};
        return;
      }
      
      console.log('✅ LotusState found');
      
      const cart = window.LotusState.cart || [];
      const cartCount = window.LotusState.getCartCount ? window.LotusState.getCartCount() : 0;
      const cartTotal = window.LotusState.getCartTotal ? window.LotusState.getCartTotal() : 0;
      
      console.log('Cart Items:', cartCount);
      console.log('Cart Total:', cartTotal.toLocaleString() + 'đ');
      console.log('Is Online:', window.LotusState.isOnline);
      console.log('User:', window.LotusState.user || 'Not logged in');
      
      this.results.state = {
        found: true,
        cartItems: cartCount,
        cartTotal: cartTotal,
        isOnline: window.LotusState.isOnline
      };
    },
    
    // 7. Check Cache
    async checkCache() {
      console.log('\n%c7️⃣ CACHE CHECK', 'font-weight: bold; font-size: 16px;');
      
      if (!('caches' in window)) {
        console.log('❌ Cache API not supported');
        this.results.cache = {supported: false};
        return;
      }
      
      try {
        const cacheNames = await caches.keys();
        
        if (cacheNames.length === 0) {
          console.log('⚠️ No caches found');
          this.results.cache = {caches: []};
          return;
        }
        
        console.log('✅ Found', cacheNames.length, 'cache(s)');
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          console.log(`  📦 ${cacheName}: ${keys.length} entries`);
        }
        
        this.results.cache = {
          supported: true,
          caches: cacheNames
        };
        
      } catch (error) {
        console.error('❌ Error checking caches:', error);
        this.results.cache = {error: error.message};
      }
    },
    
    // 8. Check Errors
    checkErrors() {
      console.log('\n%c8️⃣ CONSOLE ERRORS CHECK', 'font-weight: bold; font-size: 16px;');
      
      console.log('Check console above for any ❌ red errors');
      console.log('Common errors to look for:');
      console.log('  • CORS errors');
      console.log('  • 404 Not Found');
      console.log('  • Uncaught ReferenceError');
      console.log('  • Service Worker registration failed');
      console.log('  • API call failures');
    },
    
    // Show Summary
    showSummary() {
      console.log('\n%c📊 SUMMARY', 'font-weight: bold; font-size: 18px; color: #ec5f1a;');
      console.log('─'.repeat(70));
      
      const checks = [
        {name: 'HTTPS', pass: this.results.environment?.isHTTPS},
        {name: 'Online', pass: this.results.environment?.isOnline},
        {name: 'Service Worker', pass: this.results.serviceWorker?.active},
        {name: 'Manifest', pass: this.results.manifest?.valid},
        {name: 'IndexedDB', pass: this.results.indexedDB?.found},
        {name: 'API', pass: this.results.api?.working},
        {name: 'State', pass: this.results.state?.found},
        {name: 'Cache', pass: this.results.cache?.caches?.length > 0}
      ];
      
      let passCount = 0;
      
      checks.forEach(check => {
        const icon = check.pass ? '✅' : '❌';
        console.log(`${icon} ${check.name}`);
        if (check.pass) passCount++;
      });
      
      console.log('─'.repeat(70));
      console.log(`Score: ${passCount}/${checks.length}`);
      
      if (passCount === checks.length) {
        console.log('%c🎉 ALL CHECKS PASSED! PWA is working perfectly!', 'color: green; font-weight: bold; font-size: 16px;');
      } else {
        console.log('%c⚠️ Some checks failed. See details above.', 'color: orange; font-weight: bold; font-size: 16px;');
      }
      
      console.log('\n📝 Full Results Object:');
      console.log(this.results);
    },
    
    // Quick fixes
    fixes: {
      // Force Service Worker update
      async updateServiceWorker() {
        console.log('🔄 Forcing Service Worker update...');
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          console.log('✅ Update check complete');
        } else {
          console.log('❌ No Service Worker registered');
        }
      },
      
      // Clear all caches
      async clearCaches() {
        console.log('🧹 Clearing all caches...');
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches cleared');
      },
      
      // Re-sync data
      async resync() {
        console.log('🔄 Re-syncing data...');
        if (window.LotusDBSync) {
          await window.LotusDBSync.syncAll();
          console.log('✅ Sync complete');
        } else {
          console.log('❌ LotusDBSync not found');
        }
      },
      
      // Reset cart
      resetCart() {
        console.log('🛒 Resetting cart...');
        if (window.LotusState) {
          window.LotusState.clearCart();
          console.log('✅ Cart cleared');
        } else {
          console.log('❌ LotusState not found');
        }
      },
      
      // Full reset
      async fullReset() {
        console.log('⚠️ FULL RESET - This will clear everything!');
        
        if (!confirm('Are you sure? This will clear all local data.')) {
          return;
        }
        
        console.log('1️⃣ Clearing caches...');
        await this.clearCaches();
        
        console.log('2️⃣ Clearing localStorage...');
        localStorage.clear();
        
        console.log('3️⃣ Clearing sessionStorage...');
        sessionStorage.clear();
        
        console.log('4️⃣ Unregistering Service Workers...');
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        
        console.log('5️⃣ Deleting IndexedDB...');
        await indexedDB.deleteDatabase('LotusGlassDB');
        
        console.log('✅ Full reset complete');
        console.log('🔄 Reload page to start fresh');
      }
    }
  };
  
  // Export to window
  window.PWADebug = DEBUG;
  
  console.log('%c🔍 PWA Debug Helper Loaded!', 'font-size: 16px; font-weight: bold; color: #ec5f1a;');
  console.log('─'.repeat(70));
  console.log('Usage:');
  console.log('  PWADebug.runAll()           - Run all checks');
  console.log('  PWADebug.checkServiceWorker() - Check SW only');
  console.log('  PWADebug.checkAPI()         - Check API only');
  console.log('  PWADebug.checkIndexedDB()   - Check DB only');
  console.log('');
  console.log('Quick Fixes:');
  console.log('  PWADebug.fixes.updateServiceWorker() - Force SW update');
  console.log('  PWADebug.fixes.clearCaches()         - Clear all caches');
  console.log('  PWADebug.fixes.resync()              - Re-sync data');
  console.log('  PWADebug.fixes.resetCart()           - Clear cart');
  console.log('  PWADebug.fixes.fullReset()           - ⚠️ FULL RESET');
  console.log('─'.repeat(70));
  console.log('');
  console.log('💡 Run PWADebug.runAll() to start debugging!');
  
})();
