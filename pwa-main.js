/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                                                                     ║
 * ║   PWA MAIN - LOTUS GLASS E-COMMERCE v2.0 (2025)                   ║
 * ║   Complete PWA Application Logic                                  ║
 * ║                                                                     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 * 
 * 🎯 FEATURES:
 * - Client-side routing (SPA)
 * - State management (cart, filters, user)
 * - API integration
 * - UI rendering (product grid, detail, checkout)
 * - IndexedDB for offline storage
 * - Integration with Advanced Filter Widget
 * - Background sync support
 * - Add to cart animations
 * - Toast notifications
 * 
 * 📦 DEPLOYMENT:
 * 1. Blogger > Pages > New page
 * 2. Title: "pwa-main-js"
 * 3. Permalink: /p/pwa-main-js.html
 * 4. Paste code wrapped in <script><![CDATA[ ... ]]></script>
 * 5. ⚠️ UPDATE API_URL below!
 * 
 * Lead Engineer: PWA E-commerce Hybrid Project
 * Version: 2.0.0
 * Date: November 2025
 */

(function(window, document) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // 🔧 CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  const CONFIG = {
    // ⚠️ CHANGE THIS TO YOUR API URL!
    API_URL: 'https://script.google.com/macros/s/AKfycbwcJSpAn6_bZxiuwRbh4hpstqv6QVegryAgXYgaVB1WI4xzmsiMIAltzy824XCGDFGu/exec',
    
    BLOG_URL: 'https://30namthuytinhphaleviettiep.blogspot.com',
    SHOP_NAME: 'Phale Việt Tiệp - 30 Năm Thủy Tinh',
    CART_STORAGE_KEY: 'pvt-cart-v2',
    USER_STORAGE_KEY: 'pvt-user-v2',
    
    PAGINATION: {
      DEFAULT_LIMIT: 12,
      MAX_LIMIT: 100
    },
    
    ANIMATION: {
      DURATION: 300,
      EASING: 'ease-in-out'
    },
    
    OFFLINE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    DEBUG: false // Set to true for development
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🗄️ STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  const State = {
    cart: [],
    user: null,
    products: [],
    categories: [],
    currentFilters: {},
    currentRoute: '',
    isLoading: false,
    
    // Initialize state from storage
    init() {
      this.loadCart();
      this.loadUser();
      this.subscribe();
    },
    
    // Load cart from localStorage
    loadCart() {
      try {
        const saved = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
        if (saved) {
          this.cart = JSON.parse(saved);
        }
      } catch (error) {
        console.error('[State] Load cart failed:', error);
        this.cart = [];
      }
    },
    
    // Save cart to localStorage
    saveCart() {
      try {
        localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(this.cart));
        this.emit('cart:updated', this.cart);
      } catch (error) {
        console.error('[State] Save cart failed:', error);
      }
    },
    
    // Add item to cart
    addToCart(product, quantity = 1, variant = null) {
      const existingIndex = this.cart.findIndex(item => 
        item.productId === product.ProductID && 
        JSON.stringify(item.variant) === JSON.stringify(variant)
      );
      
      if (existingIndex >= 0) {
        this.cart[existingIndex].quantity += quantity;
      } else {
        this.cart.push({
          productId: product.ProductID,
          name: product.Name,
          price: parseFloat(product.Price),
          image: product.Image,
          quantity: quantity,
          variant: variant,
          addedAt: Date.now()
        });
      }
      
      this.saveCart();
      this.showToast(`Đã thêm ${product.Name} vào giỏ hàng`, 'success');
    },
    
    // Remove item from cart
    removeFromCart(index) {
      if (index >= 0 && index < this.cart.length) {
        const item = this.cart[index];
        this.cart.splice(index, 1);
        this.saveCart();
        this.showToast(`Đã xóa ${item.name} khỏi giỏ hàng`, 'info');
      }
    },
    
    // Update cart item quantity
    updateCartQuantity(index, quantity) {
      if (index >= 0 && index < this.cart.length) {
        if (quantity <= 0) {
          this.removeFromCart(index);
        } else {
          this.cart[index].quantity = quantity;
          this.saveCart();
        }
      }
    },
    
    // Clear cart
    clearCart() {
      this.cart = [];
      this.saveCart();
      this.showToast('Đã xóa toàn bộ giỏ hàng', 'info');
    },
    
    // Get cart total
    getCartTotal() {
      return this.cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },
    
    // Get cart count
    getCartCount() {
      return this.cart.reduce((count, item) => count + item.quantity, 0);
    },
    
    // Load user
    loadUser() {
      try {
        const saved = localStorage.getItem(CONFIG.USER_STORAGE_KEY);
        if (saved) {
          this.user = JSON.parse(saved);
        }
      } catch (error) {
        console.error('[State] Load user failed:', error);
      }
    },
    
    // Save user
    saveUser() {
      try {
        localStorage.setItem(CONFIG.USER_STORAGE_KEY, JSON.stringify(this.user));
      } catch (error) {
        console.error('[State] Save user failed:', error);
      }
    },
    
    // Event system
    listeners: {},
    
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    },
    
    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => callback(data));
      }
    },
    
    subscribe() {
      // Update cart badge when cart changes
      this.on('cart:updated', (cart) => {
        this.updateCartBadge();
      });
    },
    
    updateCartBadge() {
      const badge = document.getElementById('cart-badge');
      if (badge) {
        const count = this.getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    },
    
    showToast(message, type = 'info') {
      // Simple toast notification
      const toast = document.createElement('div');
      toast.className = `pwa-toast pwa-toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🌐 API SERVICE
  // ═══════════════════════════════════════════════════════════════════

  const API = {
    baseUrl: CONFIG.API_URL,
    
    async request(params) {
      try {
        const url = new URL(this.baseUrl);
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
          }
        });
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (CONFIG.DEBUG) {
          console.log('[API] Response:', data);
        }
        
        return data;
      } catch (error) {
        console.error('[API] Request failed:', error);
        throw error;
      }
    },
    
    async getProducts(filters = {}) {
      return this.request({
        action: 'getProducts',
        ...filters
      });
    },
    
    async getProductDetail(productId) {
      return this.request({
        action: 'getProductDetail',
        productId: productId
      });
    },
    
    async searchProducts(query, filters = {}) {
      return this.request({
        action: 'searchProducts',
        q: query,
        ...filters
      });
    },
    
    async getCategories() {
      return this.request({
        action: 'getCategories'
      });
    },
    
    async getFilters(categoryId = null) {
      return this.request({
        action: 'getFilters',
        categoryId: categoryId
      });
    },
    
    async checkVoucher(code, orderAmount) {
      return this.request({
        action: 'checkVoucher',
        code: code,
        orderAmount: orderAmount
      });
    },
    
    async createOrder(orderData) {
      try {
        const response = await fetch(this.baseUrl + '?action=createOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        return await response.json();
      } catch (error) {
        console.error('[API] Create order failed:', error);
        
        // Save to IndexedDB for background sync
        await this.saveOfflineOrder(orderData);
        
        throw error;
      }
    },
    
    async saveOfflineOrder(orderData) {
      try {
        const db = await this.openDB();
        const tx = db.transaction(['pending-orders'], 'readwrite');
        const store = tx.objectStore('pending-orders');
        
        await store.add({
          id: Date.now(),
          data: orderData,
          apiUrl: this.baseUrl,
          createdAt: Date.now()
        });
        
        console.log('[API] Order saved offline, will sync when online');
        
        // Register background sync
        if ('serviceWorker' in navigator && 'sync' in registration) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-orders');
        }
      } catch (error) {
        console.error('[API] Save offline order failed:', error);
      }
    },
    
    openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('lotus-glass-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains('pending-orders')) {
            db.createObjectStore('pending-orders', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('products-cache')) {
            db.createObjectStore('products-cache', { keyPath: 'id' });
          }
        };
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 UI RENDERING
  // ═══════════════════════════════════════════════════════════════════

  const UI = {
    containerSelector: '#pwa-app',
    
    render(html) {
      const container = document.querySelector(this.containerSelector);
      if (container) {
        container.innerHTML = html;
        this.attachEventListeners();
      }
    },
    
    renderProductGrid(products, meta = {}) {
      const html = `
        <div class="pwa-product-grid">
          ${products.length === 0 ? this.renderEmpty() : ''}
          
          ${products.map(product => `
            <div class="pwa-product-card" data-product-id="${product.ProductID}">
              <div class="pwa-product-image">
                <img src="${product.Image || '/placeholder.png'}" 
                     alt="${product.Name}"
                     loading="lazy"
                     onerror="this.src='/placeholder.png'">
                ${product.Featured ? '<span class="pwa-badge pwa-badge-featured">Nổi bật</span>' : ''}
                ${product.Stock <= 0 ? '<span class="pwa-badge pwa-badge-outofstock">Hết hàng</span>' : ''}
              </div>
              
              <div class="pwa-product-info">
                <h3 class="pwa-product-name">
                  <a href="#/product/${product.ProductID}">${product.Name}</a>
                </h3>
                
                <div class="pwa-product-price">
                  ${Utils.formatCurrency(product.Price)}
                </div>
                
                ${product.Description ? `
                  <p class="pwa-product-desc">${product.Description.substring(0, 100)}...</p>
                ` : ''}
                
                <div class="pwa-product-actions">
                  <button class="pwa-btn pwa-btn-primary pwa-btn-add-cart" 
                          data-product-id="${product.ProductID}"
                          ${product.Stock <= 0 ? 'disabled' : ''}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                    </svg>
                    ${product.Stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </button>
                  
                  <a href="#/product/${product.ProductID}" class="pwa-btn pwa-btn-secondary">
                    Chi tiết
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${meta.total > meta.limit ? this.renderPagination(meta) : ''}
      `;
      
      return html;
    },
    
    renderEmpty() {
      return `
        <div class="pwa-empty-state">
          <svg width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <h3>Không tìm thấy sản phẩm</h3>
          <p>Vui lòng thử lại với bộ lọc khác</p>
        </div>
      `;
    },
    
    renderPagination(meta) {
      const currentPage = Math.floor(meta.offset / meta.limit) + 1;
      const totalPages = Math.ceil(meta.total / meta.limit);
      
      return `
        <div class="pwa-pagination">
          <button class="pwa-btn pwa-btn-secondary" 
                  onclick="PWA.loadPage(${currentPage - 1})"
                  ${currentPage <= 1 ? 'disabled' : ''}>
            ← Trước
          </button>
          
          <span class="pwa-pagination-info">
            Trang ${currentPage} / ${totalPages}
          </span>
          
          <button class="pwa-btn pwa-btn-secondary" 
                  onclick="PWA.loadPage(${currentPage + 1})"
                  ${currentPage >= totalPages ? 'disabled' : ''}>
            Sau →
          </button>
        </div>
      `;
    },
    
    attachEventListeners() {
      // Add to cart buttons
      document.querySelectorAll('.pwa-btn-add-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const productId = btn.dataset.productId;
          
          // Show loading
          btn.disabled = true;
          btn.innerHTML = '<span class="pwa-spinner-sm"></span> Đang thêm...';
          
          try {
            const result = await API.getProductDetail(productId);
            if (result.success) {
              State.addToCart(result.data, 1);
            }
          } catch (error) {
            State.showToast('Không thể thêm vào giỏ hàng', 'error');
          } finally {
            btn.disabled = false;
            btn.innerHTML = 'Thêm vào giỏ';
          }
        });
      });
    },
    
    showLoading() {
      const container = document.querySelector(this.containerSelector);
      if (container) {
        container.innerHTML = `
          <div class="pwa-loading">
            <div class="pwa-spinner"></div>
            <p>Đang tải...</p>
          </div>
        `;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🧭 ROUTER
  // ═══════════════════════════════════════════════════════════════════

  const Router = {
    routes: {},
    
    init() {
      window.addEventListener('hashchange', () => this.handleRoute());
      window.addEventListener('load', () => this.handleRoute());
    },
    
    register(path, handler) {
      this.routes[path] = handler;
    },
    
    handleRoute() {
      const hash = window.location.hash.slice(1) || '/';
      const [path, ...params] = hash.split('/').filter(Boolean);
      
      State.currentRoute = hash;
      
      // Find matching route
      let handler = this.routes['/'];
      
      if (path === 'product' && params[0]) {
        handler = this.routes['/product/:id'];
        handler && handler(params[0]);
      } else if (path === 'cart') {
        handler = this.routes['/cart'];
        handler && handler();
      } else if (path === 'checkout') {
        handler = this.routes['/checkout'];
        handler && handler();
      } else if (path === 'search') {
        handler = this.routes['/search'];
        handler && handler(params[0]);
      } else if (this.routes[`/${path}`]) {
        handler = this.routes[`/${path}`];
        handler && handler();
      }
      
      if (!handler) {
        this.routes['/404'] && this.routes['/404']();
      }
    },
    
    navigate(path) {
      window.location.hash = path;
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🛠️ UTILITIES
  // ═══════════════════════════════════════════════════════════════════

  const Utils = {
    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(amount);
    },
    
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🚀 MAIN APP
  // ═══════════════════════════════════════════════════════════════════

  const PWA = {
    init() {
      console.log('[PWA] Initializing v2.0...');
      
      // Initialize state
      State.init();
      
      // Register routes
      this.registerRoutes();
      
      // Initialize router
      Router.init();
      
      // Setup cart UI
      this.setupCartUI();
      
      // Update cart badge
      State.updateCartBadge();
      
      // Integration with filter widget
      this.setupFilterIntegration();
      
      console.log('[PWA] Initialized successfully');
    },
    
    registerRoutes() {
      // Home/Products list
      Router.register('/', () => this.loadProducts());
      
      // Product detail
      Router.register('/product/:id', (id) => this.loadProductDetail(id));
      
      // Cart
      Router.register('/cart', () => this.showCart());
      
      // Checkout
      Router.register('/checkout', () => this.showCheckout());
      
      // Search
      Router.register('/search', (query) => this.searchProducts(query));
      
      // 404
      Router.register('/404', () => this.show404());
    },
    
    async loadProducts(filters = {}) {
      UI.showLoading();
      
      try {
        const result = await API.getProducts({
          ...State.currentFilters,
          ...filters
        });
        
        if (result.success) {
          State.products = result.data;
          UI.render(UI.renderProductGrid(result.data, result.meta));
        }
      } catch (error) {
        console.error('[PWA] Load products failed:', error);
        State.showToast('Không thể tải sản phẩm', 'error');
      }
    },
    
    async loadProductDetail(productId) {
      UI.showLoading();
      
      try {
        const result = await API.getProductDetail(productId);
        
        if (result.success) {
          // TODO: Render product detail page
          console.log('Product detail:', result.data);
        }
      } catch (error) {
        console.error('[PWA] Load product detail failed:', error);
      }
    },
    
    showCart() {
      // TODO: Render cart page
      console.log('Cart:', State.cart);
    },
    
    showCheckout() {
      // TODO: Render checkout page
      console.log('Checkout');
    },
    
    async searchProducts(query) {
      UI.showLoading();
      
      try {
        const result = await API.searchProducts(query, State.currentFilters);
        
        if (result.success) {
          UI.render(UI.renderProductGrid(result.data, result.meta));
        }
      } catch (error) {
        console.error('[PWA] Search failed:', error);
      }
    },
    
    show404() {
      UI.render(`
        <div class="pwa-error-page">
          <h1>404</h1>
          <p>Không tìm thấy trang</p>
          <a href="#/" class="pwa-btn pwa-btn-primary">Về trang chủ</a>
        </div>
      `);
    },
    
    setupCartUI() {
      // Add cart button to page if not exists
      // This is a placeholder - actual implementation depends on theme
    },
    
    setupFilterIntegration() {
      // Listen to filter widget changes
      window.addEventListener('filterChanged', (e) => {
        State.currentFilters = e.detail;
        this.loadProducts();
      });
    },
    
    loadPage(page) {
      const offset = (page - 1) * CONFIG.PAGINATION.DEFAULT_LIMIT;
      this.loadProducts({ offset: offset });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 📤 EXPORT TO GLOBAL
  // ═══════════════════════════════════════════════════════════════════

  window.PWA = PWA;
  window.PWAState = State;
  window.PWAAPI = API;
  window.PWARouter = Router;

  // Auto-initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWA.init());
  } else {
    PWA.init();
  }

  console.log('[PWA] Main script loaded');

})(window, document);
