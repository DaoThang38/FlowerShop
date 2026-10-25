// ==========================================================
// FLEUR & CO. - APPLICATION LOGIC & STORE MANAGEMENT
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  // Load dynamic products from localStorage or fallback to dataset
  let storedProducts = null;
  try {
    storedProducts = JSON.parse(localStorage.getItem('owenfleur_products'));
  } catch(e) {}

  const initialProducts = (Array.isArray(storedProducts) && storedProducts.length > 0) 
    ? storedProducts 
    : FLOWER_DATA.products;

  // Application State
  const state = {
    products: initialProducts,
    currentCategory: 'all',
    searchQuery: '',
    sortBy: 'default',
    cart: JSON.parse(localStorage.getItem('fleur_cart')) || [],
    discountPercent: 0,
    appliedCoupon: '',
    
    // Custom Bouquet Builder State
    customBouquet: {
      mainFlower: FLOWER_DATA.customBouquetOptions.mainFlowers[0],
      accentFlower: FLOWER_DATA.customBouquetOptions.accentFlowers[0],
      wrapper: FLOWER_DATA.customBouquetOptions.wrappers[0],
      ribbon: FLOWER_DATA.customBouquetOptions.ribbons[0],
      cardMessage: ''
    }
  };

  // DOM Elements
  const productsGrid = document.getElementById('productsGrid');
  const categoryFilters = document.getElementById('categoryFilters');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartDiscountRow = document.getElementById('cartDiscountRow');
  const cartDiscountAmount = document.getElementById('cartDiscountAmount');
  const cartTotalEl = document.getElementById('cartTotal');
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  // Modal Elements
  const quickViewModal = document.getElementById('quickViewModal');
  const quickViewClose = document.getElementById('quickViewClose');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutClose = document.getElementById('checkoutClose');
  const toastContainer = document.getElementById('toastContainer');

  // Initialize
  applyStoredSettingsToCustomerPortal();
  initCategoryPills();
  renderProducts();
  initCustomBouquetBuilder();
  updateCartUI();
  setupEventListeners();
  initOrderTracking();

  // Real-time synchronization when Admin updates products or settings in another tab
  window.addEventListener('storage', (e) => {
    if (e.key === 'owenfleur_products') {
      try {
        const freshProds = JSON.parse(e.newValue || '[]');
        if (Array.isArray(freshProds) && freshProds.length > 0) {
          state.products = freshProds;
          renderProducts();
          console.log('🌸 Đã đồng bộ sản phẩm mới nhất từ Admin Portal!');
        }
      } catch (err) {}
    } else if (e.key === 'owenfleur_store_settings') {
      applyStoredSettingsToCustomerPortal();
    }
  });

  function applyStoredSettingsToCustomerPortal() {
    let settings = JSON.parse(localStorage.getItem('owenfleur_store_settings'));
    if (!settings) return;

    // Normalize outdated settings from past test sessions
    let needsUpdate = false;
    if (settings.announcement && settings.announcement.includes('HOATUOI10')) {
      settings.announcement = settings.announcement.replace('HOATUOI10', 'HOASAP10');
      needsUpdate = true;
    }
    if (settings.addressHanoi && !settings.addressHanoi.includes('CS1:')) {
      settings.addressHanoi = 'CS1: ' + settings.addressHanoi;
      needsUpdate = true;
    }
    if (settings.addressHungYen && !settings.addressHungYen.includes('CS2:')) {
      settings.addressHungYen = 'CS2: ' + settings.addressHungYen;
      needsUpdate = true;
    }
    if (needsUpdate) {
      localStorage.setItem('owenfleur_store_settings', JSON.stringify(settings));
    }

    // 1. Announcement bar
    const topBarLeft = document.querySelector('.top-bar > div:first-child');
    if (topBarLeft && settings.announcement) {
      topBarLeft.innerHTML = settings.announcement;
    }

    // 2. Hotline (Excluding floating action buttons to prevent layout breakage)
    if (settings.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.href = `tel:${settings.phone.replace(/\s+/g, '')}`;
        if (link.classList.contains('floating-action-btn')) {
          // Do NOT overwrite floating button content; tooltip is updated separately
          return;
        }
        if (link.textContent.includes('Hotline')) {
          link.textContent = `📞 Hotline: ${settings.phone}`;
        }
      });
      const hotlineTooltip = document.querySelector('.floating-action-btn.hotline .tooltip');
      if (hotlineTooltip) hotlineTooltip.textContent = `Hotline: ${settings.phone}`;
    }

    // 3. Addresses in Top Bar & Footer
    const addressTopSpan = document.querySelector('.top-bar-links span:first-child');
    if (addressTopSpan) {
      const cs1 = settings.addressHanoi || 'CS1: Đống Đa - Hà Nội';
      const cs2 = settings.addressHungYen || 'CS2: Văn Giang - Hưng Yên';
      addressTopSpan.textContent = `📍 ${cs1} | ${cs2}`;
    }

    // 4. Slogans
    const quoteFr = document.querySelector('.hero-quote-fr');
    if (quoteFr && settings.taglineFr) quoteFr.textContent = `“${settings.taglineFr}”`;

    const quoteEn = document.querySelector('.hero-quote-en');
    if (quoteEn && settings.taglineEn) quoteEn.textContent = `“${settings.taglineEn}”`;

    // 5. Social links
    if (settings.facebook) {
      document.querySelectorAll('a[href*="facebook.com"]').forEach(a => a.href = settings.facebook);
    }
    if (settings.tiktok) {
      document.querySelectorAll('a[href*="tiktok.com"]').forEach(a => a.href = settings.tiktok);
    }
  }

  // --------------------------------------------------------------------------
  // 1. Category Filters
  // --------------------------------------------------------------------------
  function initCategoryPills() {
    categoryFilters.innerHTML = FLOWER_DATA.categories.map(cat => `
      <button class="cat-pill ${cat.id === state.currentCategory ? 'active' : ''}" data-cat="${cat.id}">
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');

    categoryFilters.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catId = btn.getAttribute('data-cat');
        state.currentCategory = catId;
        
        categoryFilters.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 2. Render Products
  // --------------------------------------------------------------------------
  function renderProducts() {
    let filtered = [...state.products];

    // Filter by Category
    if (state.currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === state.currentCategory);
    }

    // Filter by Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.tone.toLowerCase().includes(q)
      );
    }

    // Sort
    if (state.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🥀</div>
          <h3 style="font-family: var(--font-serif); margin-bottom: 8px;">Không tìm thấy mẫu hoa phù hợp</h3>
          <p style="color: var(--text-muted);">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác bạn nhé!</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="card-image-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          ${product.tag ? `<span class="product-badge ${product.tag.includes('Sale') ? 'sale' : ''}">${product.tag}</span>` : ''}
          <button class="quick-view-overlay-btn" data-action="quickview" data-id="${product.id}">
            👁️ Xem Nhanh
          </button>
        </div>
        <div class="card-body">
          <div class="card-tone">${product.tone}</div>
          <h3 class="card-title" data-action="quickview" data-id="${product.id}" style="cursor: pointer;">${product.name}</h3>
          <div class="card-rating">
            ${'★'.repeat(Math.floor(product.rating))}
            <span>(${product.reviewsCount} đánh giá)</span>
          </div>
          <div class="card-footer">
            <div class="card-prices">
              <span class="price-current">${formatCurrency(product.price)}</span>
              ${product.originalPrice ? `<span class="price-original">${formatCurrency(product.originalPrice)}</span>` : ''}
            </div>
            <button class="add-cart-btn" data-action="add-cart" data-id="${product.id}" title="Thêm vào giỏ">
              🛒
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach card event listeners
    productsGrid.querySelectorAll('[data-action="quickview"]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        openQuickView(id);
      });
    });

    productsGrid.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        addToCart(id, 1);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3. Quick View Modal
  // --------------------------------------------------------------------------
  function openQuickView(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('quickViewContent');
    modalBody.innerHTML = `
      <div class="quickview-body">
        <div class="quickview-img-box">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="quickview-info">
          <span style="font-size: 0.85rem; color: var(--accent); font-weight: 700; text-transform: uppercase;">
            ${product.tone}
          </span>
          <h2 style="font-family: var(--font-serif); font-size: 1.8rem; margin: 8px 0 10px; color: var(--primary-dark);">
            ${product.name}
          </h2>
          <div class="card-rating" style="margin-bottom: 14px;">
            ${'★'.repeat(Math.floor(product.rating))} <span>${product.rating} / 5.0 (${product.reviewsCount} nhận xét từ khách hàng)</span>
          </div>
          
          <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 20px;">
            <span style="font-size: 1.6rem; font-weight: 800; color: var(--primary);">${formatCurrency(product.price)}</span>
            ${product.originalPrice ? `<span style="font-size: 1rem; text-decoration: line-through; color: var(--text-light);">${formatCurrency(product.originalPrice)}</span>` : ''}
          </div>

          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 20px;">
            ${product.description}
          </p>

          <!-- Tabs -->
          <div class="quickview-tabs">
            <button class="quickview-tab-btn active" data-tab="flowers">Mẫu Hoa Sáp</button>
            <button class="quickview-tab-btn" data-tab="meaning">Ý Nghĩa</button>
            <button class="quickview-tab-btn" data-tab="care">Ưu Điểm & Bảo Quản</button>
          </div>

          <div class="tab-pane" id="tabContent">
            <ul style="padding-left: 20px; color: var(--text-muted);">
              ${product.flowersIncluded.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join('')}
            </ul>
          </div>

          <!-- Quantity and Add to Cart -->
          <div style="display: flex; gap: 14px; margin-top: 24px; align-items: center;">
            <div style="display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-full); padding: 4px 10px; background: var(--bg-cream);">
              <button id="modalQtyMinus" style="padding: 4px 10px; font-weight: bold;">-</button>
              <span id="modalQtyVal" style="padding: 0 12px; font-weight: 600;">1</span>
              <button id="modalQtyPlus" style="padding: 4px 10px; font-weight: bold;">+</button>
            </div>
            <button class="btn-primary" id="modalAddToCartBtn" style="flex: 1; justify-content: center;">
              🛒 Thêm Vào Giỏ Hàng
            </button>
          </div>
        </div>
      </div>
    `;

    // Handle Quick View Tabs
    const tabBtns = modalBody.querySelectorAll('.quickview-tab-btn');
    const tabContent = modalBody.querySelector('#tabContent');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        
        if (tab === 'flowers') {
          tabContent.innerHTML = `
            <ul style="padding-left: 20px; color: var(--text-muted);">
              ${product.flowersIncluded.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join('')}
            </ul>
          `;
        } else if (tab === 'meaning') {
          tabContent.innerHTML = `<p>${product.flowerMeaning}</p>`;
        } else if (tab === 'care') {
          tabContent.innerHTML = `
            <div style="line-height: 1.7;">
              <p style="margin-bottom: 6px;">✨ <strong>Độ bền vĩnh cửu:</strong> Hoa sáp thơm lưu hương và giữ sắc đẹp 3 - 5 năm không bao giờ tàn úa.</p>
              <p style="margin-bottom: 6px;">🛡️ <strong>Cách bảo quản:</strong> ${product.careGuide}</p>
              <p style="color: var(--accent); font-weight: 600;">⚠️ Lưu ý: Tuyệt đối không tưới nước, tránh đặt ở nơi ẩm ướt hoặc tiếp xúc trực tiếp dưới ánh nắng mặt trời gắt.</p>
            </div>
          `;
        }
      });
    });

    // Handle Quantity inside modal
    let qty = 1;
    const qtyValEl = modalBody.querySelector('#modalQtyVal');
    modalBody.querySelector('#modalQtyMinus').addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        qtyValEl.textContent = qty;
      }
    });
    modalBody.querySelector('#modalQtyPlus').addEventListener('click', () => {
      qty++;
      qtyValEl.textContent = qty;
    });

    modalBody.querySelector('#modalAddToCartBtn').addEventListener('click', () => {
      addToCart(product.id, qty);
      closeQuickView();
    });

    quickViewModal.classList.add('active');
  }

  function closeQuickView() {
    quickViewModal.classList.remove('active');
  }

  // --------------------------------------------------------------------------
  // 4. Cart Management & Drawer
  // --------------------------------------------------------------------------
  function addToCart(productId, quantity = 1, customData = null) {
    if (customData) {
      // Adding a custom designed bouquet
      state.cart.push({
        id: 'custom-' + Date.now(),
        name: customData.name,
        price: customData.price,
        image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80',
        quantity: 1,
        isCustom: true,
        details: customData.specs
      });
      showToast(`Đã thêm bó hoa tự thiết kế vào giỏ hàng!`, 'success');
    } else {
      const product = state.products.find(p => p.id === productId);
      if (!product) return;

      const existingIndex = state.cart.findIndex(item => item.id === productId);
      if (existingIndex > -1) {
        state.cart[existingIndex].quantity += quantity;
      } else {
        state.cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: quantity,
          isCustom: false
        });
      }
      showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
    }

    saveCart();
    updateCartUI();
    openCartDrawer();
  }

  function saveCart() {
    localStorage.setItem('fleur_cart', JSON.stringify(state.cart));
  }

  function updateCartUI() {
    // Total items count
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;
    cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';

    // Render cart items
    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-message">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">🧺</div>
          <p>Giỏ hàng của bạn đang trống</p>
          <button class="btn-primary" id="exploreNowBtn" style="margin-top: 15px; padding: 8px 20px; font-size: 0.85rem;">
            Khám phá mẫu hoa sáp ngay
          </button>
        </div>
      `;
      const exploreBtn = document.getElementById('exploreNowBtn');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
          closeCartDrawer();
          document.getElementById('collectionSection').scrollIntoView({ behavior: 'smooth' });
        });
      }
      cartSubtotalEl.textContent = formatCurrency(0);
      cartTotalEl.textContent = formatCurrency(0);
      cartDiscountRow.style.display = 'none';
      return;
    }

    cartItemsContainer.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          ${item.isCustom ? `<div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 4px;">${item.details}</div>` : ''}
          <div class="cart-item-price">${formatCurrency(item.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">-</button>
            <span style="font-size: 0.85rem; font-weight: 600;">${item.quantity}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-item-del-btn" data-action="del" data-id="${item.id}" title="Xóa">🗑️</button>
      </div>
    `).join('');

    // Attach listeners to cart items
    cartItemsContainer.querySelectorAll('[data-action="dec"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = state.cart.find(i => i.id === id);
        if (item) {
          if (item.quantity > 1) {
            item.quantity--;
          } else {
            state.cart = state.cart.filter(i => i.id !== id);
          }
          saveCart();
          updateCartUI();
        }
      });
    });

    cartItemsContainer.querySelectorAll('[data-action="inc"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = state.cart.find(i => i.id === id);
        if (item) {
          item.quantity++;
          saveCart();
          updateCartUI();
        }
      });
    });

    cartItemsContainer.querySelectorAll('[data-action="del"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.cart = state.cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
      });
    });

    // Subtotal & Discounts
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Math.round(subtotal * (state.discountPercent / 100));
    const total = subtotal - discount;

    cartSubtotalEl.textContent = formatCurrency(subtotal);
    if (state.discountPercent > 0) {
      cartDiscountRow.style.display = 'flex';
      cartDiscountAmount.textContent = `- ${formatCurrency(discount)} (${state.discountPercent}%)`;
    } else {
      cartDiscountRow.style.display = 'none';
    }
    cartTotalEl.textContent = formatCurrency(total);
  }

  function openCartDrawer() {
    cartDrawer.classList.add('active');
    cartDrawerOverlay.classList.add('active');
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('active');
    cartDrawerOverlay.classList.remove('active');
  }

  // --------------------------------------------------------------------------
  // 5. Custom Bouquet Builder Logic
  // --------------------------------------------------------------------------
  function initCustomBouquetBuilder() {
    const opts = FLOWER_DATA.customBouquetOptions;

    // Render Step 1: Main Flowers
    const mainFlowerContainer = document.getElementById('builderMainFlowers');
    mainFlowerContainer.innerHTML = opts.mainFlowers.map(f => `
      <div class="builder-choice-item ${f.id === state.customBouquet.mainFlower.id ? 'selected' : ''}" data-type="main" data-id="${f.id}">
        <div style="font-size: 1.8rem; margin-bottom: 8px;">${f.img}</div>
        <div class="choice-name">${f.name}</div>
        <div class="choice-desc">${f.desc}</div>
        <div class="choice-price">+ ${formatCurrency(f.price)}</div>
      </div>
    `).join('');

    // Render Step 2: Accent Flowers
    const accentContainer = document.getElementById('builderAccentFlowers');
    accentContainer.innerHTML = opts.accentFlowers.map(a => `
      <div class="builder-choice-item ${a.id === state.customBouquet.accentFlower.id ? 'selected' : ''}" data-type="accent" data-id="${a.id}">
        <div class="choice-name">${a.name}</div>
        <div class="choice-desc">${a.desc}</div>
        <div class="choice-price">${a.price > 0 ? '+ ' + formatCurrency(a.price) : 'Miễn phí'}</div>
      </div>
    `).join('');

    // Render Step 3: Wrappers
    const wrapperContainer = document.getElementById('builderWrappers');
    wrapperContainer.innerHTML = opts.wrappers.map(w => `
      <div class="builder-choice-item ${w.id === state.customBouquet.wrapper.id ? 'selected' : ''}" data-type="wrapper" data-id="${w.id}">
        <div style="font-size: 1.6rem; margin-bottom: 6px;">${w.preview}</div>
        <div class="choice-name">${w.name}</div>
        <div class="choice-price">+ ${formatCurrency(w.price)}</div>
      </div>
    `).join('');

    // Render Step 4: Ribbons
    const ribbonContainer = document.getElementById('builderRibbons');
    ribbonContainer.innerHTML = opts.ribbons.map(r => `
      <div class="ribbon-pill ${r.id === state.customBouquet.ribbon.id ? 'selected' : ''}" data-type="ribbon" data-id="${r.id}">
        <span class="ribbon-color-circle" style="background-color: ${r.code};"></span>
        <span>${r.name}</span>
      </div>
    `).join('');

    // Choice Click Listeners
    document.querySelectorAll('.builder-choice-item, .ribbon-pill').forEach(el => {
      el.addEventListener('click', () => {
        const type = el.getAttribute('data-type');
        const id = el.getAttribute('data-id');

        if (type === 'main') {
          state.customBouquet.mainFlower = opts.mainFlowers.find(f => f.id === id);
          mainFlowerContainer.querySelectorAll('.builder-choice-item').forEach(b => b.classList.remove('selected'));
          el.classList.add('selected');
        } else if (type === 'accent') {
          state.customBouquet.accentFlower = opts.accentFlowers.find(a => a.id === id);
          accentContainer.querySelectorAll('.builder-choice-item').forEach(b => b.classList.remove('selected'));
          el.classList.add('selected');
        } else if (type === 'wrapper') {
          state.customBouquet.wrapper = opts.wrappers.find(w => w.id === id);
          wrapperContainer.querySelectorAll('.builder-choice-item').forEach(b => b.classList.remove('selected'));
          el.classList.add('selected');
        } else if (type === 'ribbon') {
          state.customBouquet.ribbon = opts.ribbons.find(r => r.id === id);
          ribbonContainer.querySelectorAll('.ribbon-pill').forEach(b => b.classList.remove('selected'));
          el.classList.add('selected');
        }

        updateBouquetLivePreview();
      });
    });

    const cardMessageInput = document.getElementById('customCardMessage');
    if (cardMessageInput) {
      cardMessageInput.addEventListener('input', (e) => {
        state.customBouquet.cardMessage = e.target.value;
      });
    }

    const addCustomToCartBtn = document.getElementById('addCustomToCartBtn');
    if (addCustomToCartBtn) {
      addCustomToCartBtn.addEventListener('click', () => {
        const total = calculateBouquetTotal();
        const specs = `${state.customBouquet.mainFlower.name} • ${state.customBouquet.accentFlower.name} • ${state.customBouquet.wrapper.name}`;
        
        addToCart(null, 1, {
          name: `Bó Hoa Tự Thiết Kế (${state.customBouquet.mainFlower.name.split(' ')[1] || 'Đặc Biệt'})`,
          price: total,
          specs: specs
        });
      });
    }

    updateBouquetLivePreview();
  }

  function calculateBouquetTotal() {
    const { mainFlower, accentFlower, wrapper } = state.customBouquet;
    const baseCraftFee = 50000; // Phí công cắm nghệ thuật và thiệp viết tay
    return mainFlower.price + accentFlower.price + wrapper.price + baseCraftFee;
  }

  function updateBouquetLivePreview() {
    const { mainFlower, accentFlower, wrapper, ribbon } = state.customBouquet;
    
    document.getElementById('prevMainFlower').textContent = mainFlower.name;
    document.getElementById('prevAccentFlower').textContent = accentFlower.name;
    document.getElementById('prevWrapper').textContent = wrapper.name;
    document.getElementById('prevRibbon').innerHTML = `
      <span class="ribbon-color-circle" style="display:inline-block; vertical-align:middle; width:12px; height:12px; background-color:${ribbon.code}; margin-right:4px;"></span>
      ${ribbon.name}
    `;

    const total = calculateBouquetTotal();
    document.getElementById('previewBouquetTotal').textContent = formatCurrency(total);
  }

  // --------------------------------------------------------------------------
  // 6. Checkout Flow & Payment Simulation
  // --------------------------------------------------------------------------
  function openCheckoutModal() {
    if (state.cart.length === 0) {
      showToast('Giỏ hàng trống! Hãy chọn hoa trước khi thanh toán.', 'warning');
      return;
    }

    closeCartDrawer();
    
    // Calculate total
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Math.round(subtotal * (state.discountPercent / 100));
    const finalTotal = subtotal - discount;

    const checkoutModalContent = document.getElementById('checkoutModalContent');
    const orderCode = 'FLR' + Math.floor(100000 + Math.random() * 900000);

    // Read banking configuration dynamically from store settings
    const storeSettings = JSON.parse(localStorage.getItem('owenfleur_store_settings')) || {};
    const bankName = storeSettings.bankName || 'Vietcombank';
    const bankAccount = storeSettings.bankAccount || '0985421398';
    const accountHolder = (storeSettings.accountHolder || 'TIEM HOA OWEN FLEUR').toUpperCase();
    const prefix = (storeSettings.transferPrefix || 'OWENFLEUR').toUpperCase();
    const customQr = storeSettings.customQrImage;
    const qrData = `${prefix}_${orderCode}_${finalTotal}`;
    const qrImgUrl = customQr ? customQr : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;

    let currentFinalTotal = finalTotal;

    checkoutModalContent.innerHTML = `
      <div class="checkout-body">
        <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--primary-dark); margin-bottom: 6px;">
          Xác Nhận & Đặt Hàng Giao Hoa Sáp
        </h2>
        <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 24px;">
          Cam kết hoa sáp thơm cao cấp 100%, độ bền 3 - 5 năm không tàn úa, gửi ảnh thực tế trước khi giao và đính kèm thiệp viết tay trang trọng.
        </p>

        <form id="checkoutForm" class="checkout-grid">
          <!-- Left Column: Delivery Details -->
          <div>
            <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 14px; color: var(--primary);">
              1. Thông Tin Người Nhận & Giao Hàng
            </h4>

            <div class="form-group">
              <label>Họ và tên người nhận hoa *</label>
              <input type="text" class="form-control" id="recipientName" placeholder="Ví dụ: Nguyễn Thùy Linh" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label>Số điện thoại người nhận *</label>
                <input type="tel" class="form-control" id="recipientPhone" placeholder="09xxxxxxxx" required>
              </div>
              <div class="form-group">
                <label>Số điện thoại người đặt (SMS/Zalo báo đơn) *</label>
                <input type="tel" class="form-control" id="senderPhone" placeholder="09xxxxxxxx" required>
              </div>
            </div>

            <div class="form-group">
              <label>Địa chỉ nhận hoa chính xác *</label>
              <input type="text" class="form-control" id="recipientAddress" placeholder="Số nhà, tên đường, phường/xã, quận/huyện" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label>Ngày giao hoa *</label>
                <input type="date" class="form-control" id="deliveryDate" required>
              </div>
              <div class="form-group">
                <label>Khung giờ nhận hoa *</label>
                <select class="form-control" id="deliveryTime">
                  <option value="morning">Buổi Sáng (08:00 - 11:30)</option>
                  <option value="noon">Buổi Trưa (11:30 - 14:00)</option>
                  <option value="afternoon" selected>Buổi Chiều (14:00 - 17:30)</option>
                  <option value="evening">Buổi Tối (17:30 - 20:30)</option>
                  <option value="asap">⚡ Giao Hỏa Tốc trong 2 giờ</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Nội dung ghi trên thiệp chúc mừng (Miễn phí thiệp & nắn nót viết tay)</label>
              <textarea class="form-control" id="cardMsg" rows="3" placeholder="Ví dụ: Chúc em sinh nhật thật rực rỡ và luôn hạnh phúc..."></textarea>
            </div>

            <!-- Anonymous Gifting Option -->
            <div style="margin-top: 14px; padding: 12px; background: #fffcf8; border: 1px dashed var(--gold); border-radius: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: var(--primary);">
                <input type="checkbox" id="isAnonymousGift" style="width: 18px; height: 18px; accent-color: var(--primary);">
                <span>🤫 Gửi hoa ẩn danh (Bí mật người tặng)</span>
              </label>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; margin-left: 26px;">
                Shipper sẽ tuyệt đối không tiết lộ tên hoặc SĐT của bạn cho người nhận, chỉ trao hoa và thiệp.
              </div>
            </div>

            <!-- Add-on Accessories for Soap Flowers -->
            <div style="margin-top: 18px;">
              <label style="font-size: 0.9rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 8px;">
                ✨ Phụ Kiện Nâng Cấp Bó Hoa Thêm Lung Linh (Tùy chọn)
              </label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 0.88rem; background: #fff;">
                  <span style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="checkout-addon-cb" data-name="Dây đèn LED đom đóm 3 chế độ" data-price="25000" style="accent-color: var(--primary); width: 16px; height: 16px;">
                    <span>✨ Dây đèn LED đom đóm nhấp nháy 3 chế độ</span>
                  </span>
                  <strong style="color: var(--accent);">+25.000₫</strong>
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 0.88rem; background: #fff;">
                  <span style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="checkout-addon-cb" data-name="Túi kiếng quai xách trong suốt cao cấp" data-price="35000" style="accent-color: var(--primary); width: 16px; height: 16px;">
                    <span>🛍️ Túi kiếng quai xách trong suốt bảo quản hoa</span>
                  </span>
                  <strong style="color: var(--accent);">+35.000₫</strong>
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 0.88rem; background: #fff;">
                  <span style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="checkout-addon-cb" data-name="Gấu bông mini vương miện đính kèm" data-price="45000" style="accent-color: var(--primary); width: 16px; height: 16px;">
                    <span>🧸 Gấu bông mini đội vương miện đính kèm</span>
                  </span>
                  <strong style="color: var(--accent);">+45.000₫</strong>
                </label>
              </div>
            </div>
          </div>

          <!-- Right Column: Order Summary & Payment -->
          <div>
            <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 14px; color: var(--primary);">
              2. Phương Thức Thanh Toán
            </h4>

            <div class="payment-methods-list">
              <label class="payment-option-card selected" data-method="qr">
                <input type="radio" name="payMethod" value="qr" checked style="accent-color: var(--primary);">
                <div>
                  <div style="font-weight: 600; font-size: 0.92rem;">Chuyển khoản VietQR Nhanh 24/7 (Khuyên dùng)</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Quét mã QR tự điền số tiền và nội dung</div>
                </div>
              </label>

              <label class="payment-option-card" data-method="cod">
                <input type="radio" name="payMethod" value="cod" style="accent-color: var(--primary);">
                <div>
                  <div style="font-weight: 600; font-size: 0.92rem;">Thanh toán khi nhận hoa (COD)</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Áp dụng đơn nội thành dưới 2.000.000đ</div>
                </div>
              </label>
            </div>

            <!-- VietQR Display Box -->
            <div class="vietqr-box" id="vietQrSection">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">MÃ THANH TOÁN VIETQR CHUẨN</div>
              <img src="${qrImgUrl}" alt="VietQR" class="vietqr-img" id="checkoutQrImg">
              <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
                Ngân hàng: <strong>${bankName}</strong><br>
                STK: <strong style="color: var(--primary); font-size: 0.95rem;">${bankAccount}</strong><br>
                Chủ TK: <strong>${accountHolder}</strong><br>
                Nội dung chuyển: <strong style="color: var(--accent); font-size: 0.95rem;">${prefix} ${orderCode}</strong>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="button" class="btn-copy-chip" id="btnCopyStk" style="flex: 1; justify-content: center;">
                  📋 Sao chép STK
                </button>
                <button type="button" class="btn-copy-chip" id="btnCopyMsg" style="flex: 1; justify-content: center;">
                  📋 Sao chép Nội dung
                </button>
              </div>
            </div>

            <!-- Order Total Preview -->
            <div style="background: var(--surface-alt); padding: 18px; border-radius: var(--radius-md); margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
                <span>Tổng tiền hoa (${state.cart.length} món):</span>
                <span>${formatCurrency(subtotal)}</span>
              </div>
              <div id="addonSummaryRow" style="display: none; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; color: var(--primary);">
                <span>Phụ kiện đính kèm:</span>
                <span id="addonSummaryAmount">+0₫</span>
              </div>
              ${state.discountPercent > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; color: var(--accent);">
                <span>Giảm giá voucher:</span>
                <span>-${formatCurrency(discount)}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 12px; color: var(--success);">
                <span>Phí vận chuyển hoa sáp:</span>
                <span>Miễn Phí</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; color: var(--primary-dark); padding-top: 10px; border-top: 1px dashed var(--border);">
                <span>Tổng Thanh Toán:</span>
                <span style="color: var(--accent);" id="checkoutFinalTotalDisplay">${formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 20px; font-size: 1.05rem; padding: 16px;">
              💐 Hoàn Tất Đặt Hàng
            </button>
          </div>
        </form>
      </div>
    `;

    // Dynamic Add-ons total update & VietQR re-rendering
    const addonCheckboxes = checkoutModalContent.querySelectorAll('.checkout-addon-cb');
    const addonSummaryRow = checkoutModalContent.querySelector('#addonSummaryRow');
    const addonSummaryAmount = checkoutModalContent.querySelector('#addonSummaryAmount');
    const checkoutFinalTotalDisplay = checkoutModalContent.querySelector('#checkoutFinalTotalDisplay');
    const checkoutQrImg = checkoutModalContent.querySelector('#checkoutQrImg');

    function recalculateCheckoutTotal() {
      let addonSum = 0;
      addonCheckboxes.forEach(cb => {
        if (cb.checked) {
          addonSum += parseInt(cb.getAttribute('data-price') || 0, 10);
        }
      });

      currentFinalTotal = Math.max(0, (subtotal - discount) + addonSum);
      if (addonSum > 0) {
        addonSummaryRow.style.display = 'flex';
        addonSummaryAmount.textContent = '+' + formatCurrency(addonSum);
      } else {
        addonSummaryRow.style.display = 'none';
      }
      checkoutFinalTotalDisplay.textContent = formatCurrency(currentFinalTotal);

      // Refresh VietQR code with exact final total
      if (checkoutQrImg && !customQr) {
        const dynamicQrData = `${prefix}_${orderCode}_${currentFinalTotal}`;
        checkoutQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicQrData)}`;
      }
    }

    addonCheckboxes.forEach(cb => {
      cb.addEventListener('change', recalculateCheckoutTotal);
    });

    // 1-touch copy buttons
    const btnCopyStk = checkoutModalContent.querySelector('#btnCopyStk');
    const btnCopyMsg = checkoutModalContent.querySelector('#btnCopyMsg');
    if (btnCopyStk) {
      btnCopyStk.addEventListener('click', () => {
        navigator.clipboard.writeText(bankAccount).then(() => {
          showToast(`📋 Đã sao chép STK: ${bankAccount}`, 'success');
        });
      });
    }
    if (btnCopyMsg) {
      btnCopyMsg.addEventListener('click', () => {
        const transferText = `${prefix} ${orderCode}`;
        navigator.clipboard.writeText(transferText).then(() => {
          showToast(`📋 Đã sao chép nội dung: ${transferText}`, 'success');
        });
      });
    }

    // Set default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('deliveryDate');
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().split('T')[0];
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    // Toggle QR when selecting payment
    const paymentCards = checkoutModalContent.querySelectorAll('.payment-option-card');
    const qrSection = checkoutModalContent.querySelector('#vietQrSection');

    paymentCards.forEach(card => {
      card.addEventListener('click', () => {
        paymentCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const method = card.getAttribute('data-method');
        qrSection.style.display = method === 'qr' ? 'block' : 'none';
      });
    });

    // Form submission
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const recipientName = document.getElementById('recipientName').value.trim();
      const recipientPhone = document.getElementById('recipientPhone').value.trim();
      const senderPhone = document.getElementById('senderPhone').value.trim();
      const recipientAddress = document.getElementById('recipientAddress').value.trim();
      const deliveryDate = document.getElementById('deliveryDate').value;
      const deliveryTimeSelect = document.getElementById('deliveryTime');
      const deliveryTime = deliveryTimeSelect.value;
      const deliveryTimeLabel = deliveryTimeSelect.options[deliveryTimeSelect.selectedIndex].text;
      const cardMsg = document.getElementById('cardMsg').value.trim();
      const payMethod = document.querySelector('input[name="payMethod"]:checked').value;
      const isUrgent = deliveryTime === 'asap';
      const isAnonymous = document.getElementById('isAnonymousGift').checked;

      // Collect items + selected add-ons
      const orderItems = state.cart.map(item => ({
        name: item.name + (item.details ? ` (${item.details})` : ''),
        quantity: item.quantity,
        price: item.price
      }));

      addonCheckboxes.forEach(cb => {
        if (cb.checked) {
          orderItems.push({
            name: cb.getAttribute('data-name'),
            quantity: 1,
            price: parseInt(cb.getAttribute('data-price') || 0, 10)
          });
        }
      });

      // Create structured order object for Admin Portal & Cloud Sync
      const newOrder = {
        id: orderCode,
        createdAt: new Date().toISOString(),
        recipientName: recipientName,
        recipientPhone: recipientPhone,
        senderPhone: senderPhone,
        address: recipientAddress,
        deliveryDate: deliveryDate,
        deliveryTime: deliveryTime,
        deliveryTimeLabel: deliveryTimeLabel,
        items: orderItems,
        total: currentFinalTotal,
        paymentMethod: payMethod,
        paymentStatus: payMethod === 'qr' ? 'Đã thanh toán VietQR' : 'Thu tiền khi giao (COD)',
        cardMessage: cardMsg,
        status: 'pending',
        isUrgent: isUrgent,
        isAnonymous: isAnonymous,
        floristNotes: (isUrgent ? '⚡ HỎA TỐC 2 GIỜ. ' : '') + (isAnonymous ? '🤫 GỬI ẨN DANH (Tuyệt đối không tiết lộ thông tin người đặt). ' : '') + 'Đơn đặt từ website khách hàng.'
      };

      // Save order to LocalStorage & Supabase Cloud Real-time
      if (typeof OwenCloud !== 'undefined' && OwenCloud.saveOrder) {
        OwenCloud.saveOrder(newOrder);
      } else {
        const existingOrders = JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
        existingOrders.unshift(newOrder);
        localStorage.setItem('owenfleur_orders', JSON.stringify(existingOrders));
      }

      // Send instant push notification to florist via Telegram if configured
      sendTelegramOrderAlert(newOrder);

      // Show enhanced success screen
      showOrderSuccessScreen(orderCode, recipientName, recipientAddress, currentFinalTotal, newOrder);
    });

    checkoutModal.classList.add('active');
  }

  // --------------------------------------------------------------------------
  // Instant Telegram Alert To Shop Owner Phone
  // --------------------------------------------------------------------------
  function sendTelegramOrderAlert(order) {
    const settings = JSON.parse(localStorage.getItem('owenfleur_store_settings')) || {};
    const botToken = settings.telegramBotToken;
    const chatId = settings.telegramChatId;
    if (!botToken || !chatId) return;

    const itemsText = order.items.map(it => `• ${it.quantity}x ${it.name} (${formatCurrency(it.price * it.quantity)})`).join('\n');
    const msg = `🚨 <b>CÓ ĐƠN HÀNG MỚI #${order.id} TỪ WEB!</b>\n\n` +
      `⏰ <b>Thời gian giao:</b> ${order.deliveryTimeLabel} (${order.deliveryDate})\n` +
      `👤 <b>Người nhận:</b> ${order.recipientName} - 📞 <code>${order.recipientPhone}</code>\n` +
      `📍 <b>Địa chỉ:</b> ${order.address}\n` +
      (order.isAnonymous ? `🤫 <i>Khách chọn: GỬI ẨN DANH (Không báo tên người đặt)</i>\n` : `📞 <b>SĐT người đặt:</b> <code>${order.senderPhone}</code>\n`) +
      `💐 <b>Sản phẩm:</b>\n${itemsText}\n\n` +
      `💰 <b>Tổng tiền:</b> <b>${formatCurrency(order.total)}</b> (${order.paymentStatus})\n` +
      (order.cardMessage ? `💌 <b>Nội dung thiệp:</b> <i>"${order.cardMessage}"</i>\n` : '') +
      (order.isUrgent ? `\n⚡ <b>ĐƠN HỎA TỐC 2 GIỜ - CẦN CẮM GẤP!</b>` : '');

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'HTML'
      })
    }).catch(err => console.log('Telegram alert error:', err));
  }

  function showOrderSuccessScreen(orderCode, recipientName, address, finalTotal, orderData) {
    const safeOrderCode = window.escapeHtml ? window.escapeHtml(orderCode) : orderCode;
    const safeName = window.escapeHtml ? window.escapeHtml(recipientName) : recipientName;
    const safeAddress = window.escapeHtml ? window.escapeHtml(address) : address;

    const zaloMsg = encodeURIComponent(`Chào tiệm Owen Fleur, mình vừa đặt đơn hàng #${orderCode} giao tới ${address} (${formatCurrency(finalTotal)}). Nhờ shop xác nhận và gửi ảnh hoa thực tế qua Zalo giúp mình nhé!`);
    const cleanShopPhone = (FLOWER_DATA.storeInfo.phone || '0985421398').replace(/[^0-9]/g, '');

    const checkoutModalContent = document.getElementById('checkoutModalContent');
    checkoutModalContent.innerHTML = `
      <div style="padding: 40px 24px; text-align: center;">
        <div style="width: 72px; height: 72px; background: #e9f7ef; color: var(--success); font-size: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          ✓
        </div>
        <h2 style="font-family: var(--font-serif); font-size: 2rem; color: var(--primary-dark); margin-bottom: 8px;">
          Đặt Hoa Thành Công!
        </h2>
        <p style="color: var(--text-muted); max-width: 520px; margin: 0 auto 20px; font-size: 0.95rem; line-height: 1.6;">
          Cảm ơn bạn đã tin tưởng <strong>Owen Fleur</strong>. Mã đơn hàng của bạn là <span style="color: var(--accent); font-weight: 800; font-size: 1.1rem;">#${safeOrderCode}</span>.
        </p>

        <div style="background: var(--surface-alt); max-width: 480px; margin: 0 auto 24px; padding: 18px 20px; border-radius: var(--radius-md); text-align: left; font-size: 0.9rem; border: 1px solid var(--border); line-height: 1.7;">
          <div>📍 <strong>Người nhận:</strong> ${safeName}</div>
          <div>📍 <strong>Địa chỉ giao:</strong> ${safeAddress}</div>
          <div>💵 <strong>Tổng thanh toán:</strong> <strong style="color: var(--accent);">${formatCurrency(finalTotal)}</strong></div>
          <div>📸 <strong>Quy trình:</strong> Florist sẽ cắm hoa và gửi ảnh thành phẩm duyệt qua Zalo trước khi giao!</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; max-width: 380px; margin: 0 auto;">
          <a href="https://zalo.me/${cleanShopPhone}?text=${zaloMsg}" target="_blank" class="btn-primary" style="background: #0068ff; justify-content: center; padding: 12px; font-size: 0.95rem; text-decoration: none;">
            💬 Nhắn Zalo Shop Để Duyệt Ảnh Hoa Sớm
          </a>
          <button class="btn-primary" id="trackThisOrderBtn" style="background: var(--primary); justify-content: center; padding: 12px; font-size: 0.95rem;">
            🔍 Theo Dõi Trạng Thái Đơn Hàng Này
          </button>
          <button class="btn-outline" id="finishOrderBtn" style="justify-content: center; padding: 10px; font-size: 0.9rem;">
            Tiếp Tục Mua Sắm
          </button>
        </div>
      </div>
    `;

    // Clear cart
    state.cart = [];
    saveCart();
    updateCartUI();

    document.getElementById('finishOrderBtn').addEventListener('click', () => {
      checkoutModal.classList.remove('active');
    });

    document.getElementById('trackThisOrderBtn').addEventListener('click', () => {
      checkoutModal.classList.remove('active');
      openOrderTrackingWithId(orderCode);
    });
  }

  // --------------------------------------------------------------------------
  // 7. Order Tracking System for Guest Customers
  // --------------------------------------------------------------------------
  function initOrderTracking() {
    const openTrackOrderBtn = document.getElementById('openTrackOrderBtn');
    const orderTrackingModal = document.getElementById('orderTrackingModal');
    const orderTrackingClose = document.getElementById('orderTrackingClose');
    const trackOrderForm = document.getElementById('trackOrderForm');
    const trackOrderInput = document.getElementById('trackOrderInput');
    const trackResultContainer = document.getElementById('trackResultContainer');

    if (!orderTrackingModal) return;

    if (openTrackOrderBtn) {
      openTrackOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        orderTrackingModal.classList.add('active');
        if (trackOrderInput) trackOrderInput.focus();
      });
    }

    if (orderTrackingClose) {
      orderTrackingClose.addEventListener('click', () => {
        orderTrackingModal.classList.remove('active');
      });
    }

    orderTrackingModal.addEventListener('click', (e) => {
      if (e.target === orderTrackingModal) {
        orderTrackingModal.classList.remove('active');
      }
    });

    if (trackOrderForm) {
      trackOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = trackOrderInput.value.trim().toLowerCase();
        if (!query) return;

        trackResultContainer.innerHTML = `
          <div style="text-align: center; padding: 24px; color: var(--text-muted);">
            🔄 Đang tra cứu thông tin đơn hàng trên hệ thống...
          </div>
        `;

        // Fetch from Cloud or Local
        let orders = [];
        if (typeof OwenCloud !== 'undefined' && OwenCloud.fetchOrders) {
          try {
            orders = await OwenCloud.fetchOrders();
          } catch (err) {
            orders = JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
          }
        }
        if (!orders || orders.length === 0) {
          orders = JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
        }

        const cleanQ = query.replace(/[^0-9a-zA-Z]/g, '');
        const matches = orders.filter(o => {
          const matchId = (o.id || '').toLowerCase().includes(query) || (o.id || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase().includes(cleanQ);
          const matchSender = (o.senderPhone || '').replace(/[^0-9]/g, '').includes(cleanQ);
          const matchRecip = (o.recipientPhone || '').replace(/[^0-9]/g, '').includes(cleanQ);
          return matchId || (cleanQ.length >= 4 && (matchSender || matchRecip));
        });

        renderTrackingResults(matches, query);
      });
    }
  }

  window.openOrderTrackingWithId = function(orderId) {
    const modal = document.getElementById('orderTrackingModal');
    const input = document.getElementById('trackOrderInput');
    const form = document.getElementById('trackOrderForm');
    if (modal && input && form) {
      modal.classList.add('active');
      input.value = orderId;
      form.dispatchEvent(new Event('submit'));
    }
  };

  function renderTrackingResults(orders, query) {
    const container = document.getElementById('trackResultContainer');
    if (!container) return;

    if (!orders || orders.length === 0) {
      const safeQuery = typeof escapeHtml === 'function' ? escapeHtml(query) : query;
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 16px; background: #fff8f8; border: 1px dashed #fca5a5; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <h4 style="color: #b91c1c; margin-bottom: 6px;">Không tìm thấy đơn hàng nào!</h4>
          <p style="font-size: 0.88rem; color: #64748b; max-width: 440px; margin: 0 auto 12px;">
            Không có đơn hàng nào khớp với "<strong>${safeQuery}</strong>". Vui lòng kiểm tra lại số điện thoại người đặt hoặc mã đơn hàng.
          </p>
          <a href="tel:0985421398" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem; display: inline-flex; text-decoration: none;">
            📞 Gọi Hotline Hỗ Trợ 0985 421 398
          </a>
        </div>
      `;
      return;
    }

    const steps = [
      { key: 'pending', label: 'Tiếp Nhận Đơn', icon: '📝' },
      { key: 'crafting', label: 'Đang Cắm Hoa', icon: '✂️' },
      { key: 'photo_sent', label: 'Đã Gửi Ảnh Duyệt', icon: '📸' },
      { key: 'delivering', label: 'Đang Đi Giao', icon: '🚚' },
      { key: 'delivered', label: 'Giao Thành Công', icon: '✅' }
    ];

    container.innerHTML = orders.map(order => {
      const statusIdx = steps.findIndex(s => s.key === order.status);
      const isCancelled = order.status === 'cancelled';
      const safeId = typeof escapeHtml === 'function' ? escapeHtml(order.id) : order.id;
      const safeRecipient = typeof escapeHtml === 'function' ? escapeHtml(order.recipientName) : order.recipientName;
      const safeAddress = typeof escapeHtml === 'function' ? escapeHtml(order.address) : order.address;
      const safeDelivery = typeof escapeHtml === 'function' ? escapeHtml((order.deliveryTimeLabel || 'Hỏa tốc') + ' (' + (order.deliveryDate || '') + ')') : (order.deliveryTimeLabel + ' (' + order.deliveryDate + ')');

      return `
        <div style="background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div>
              <span style="font-weight: 800; font-size: 1.15rem; color: var(--primary);">#${safeId}</span>
              <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 8px;">(${new Date(order.createdAt).toLocaleDateString('vi-VN')})</span>
            </div>
            <div>
              <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; background: ${isCancelled ? '#ffebee' : '#e8f5e9'}; color: ${isCancelled ? '#c62828' : '#2e7d32'};">
                ${isCancelled ? '❌ Đã Hủy Đơn' : (steps[statusIdx] ? steps[statusIdx].icon + ' ' + steps[statusIdx].label : order.status)}
              </span>
            </div>
          </div>

          ${!isCancelled ? `
          <!-- 5-Step Timeline -->
          <div class="tracking-timeline">
            ${steps.map((st, i) => {
              const isDone = i < statusIdx;
              const isActive = i === statusIdx;
              const cls = isDone ? 'done' : (isActive ? 'active' : '');
              return `
                <div class="tracking-step ${cls}">
                  <div class="tracking-step-dot">${isDone ? '✓' : st.icon}</div>
                  <div class="tracking-step-label">${st.label}</div>
                </div>
              `;
            }).join('')}
          </div>` : ''}

          <div style="font-size: 0.88rem; color: #475569; line-height: 1.7; background: var(--surface-alt); padding: 14px; border-radius: 8px; margin-top: 14px;">
            <div>👤 <strong>Người nhận:</strong> ${safeRecipient} (${order.recipientPhone})</div>
            <div>📍 <strong>Địa chỉ giao:</strong> ${safeAddress}</div>
            <div>⏰ <strong>Hẹn giao:</strong> <strong style="color: var(--accent);">${safeDelivery}</strong></div>
            <div>💐 <strong>Sản phẩm:</strong> ${order.items.map(it => `${it.quantity}x ${typeof escapeHtml === 'function' ? escapeHtml(it.name) : it.name}`).join(', ')}</div>
            <div>💰 <strong>Tổng thanh toán:</strong> <strong style="color: var(--primary); font-size: 0.95rem;">${formatCurrency(order.total)}</strong> (${order.paymentStatus || order.paymentMethod})</div>
            ${order.cardMessage ? `<div>💌 <strong>Thiệp chúc:</strong> <i>"${typeof escapeHtml === 'function' ? escapeHtml(order.cardMessage) : order.cardMessage}"</i></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // 8. General Event Listeners & UI Helpers
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProducts();
    });

    // Sort select
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });

    // Cart Drawer Toggle
    cartBtn.addEventListener('click', openCartDrawer);
    closeDrawerBtn.addEventListener('click', closeCartDrawer);
    cartDrawerOverlay.addEventListener('click', closeCartDrawer);

    // Quick View Close
    quickViewClose.addEventListener('click', closeQuickView);
    quickViewModal.addEventListener('click', (e) => {
      if (e.target === quickViewModal) closeQuickView();
    });

    // Checkout Close
    checkoutClose.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
    });
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove('active');
    });

    // Checkout Button in Drawer
    checkoutBtn.addEventListener('click', openCheckoutModal);

    // Coupon Apply
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === 'HOASAP10' || code === 'HOATUOI10') {
        state.discountPercent = 10;
        state.appliedCoupon = code;
        showToast('Áp dụng thành công mã giảm giá hoa sáp 10%!', 'success');
        updateCartUI();
      } else if (code === 'FLEUR20') {
        state.discountPercent = 20;
        state.appliedCoupon = code;
        showToast('Áp dụng mã VIP giảm 20% thành công!', 'success');
        updateCartUI();
      } else if (code === '') {
        showToast('Vui lòng nhập mã giảm giá', 'warning');
      } else {
        showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'warning');
      }
    });

    // Newsletter subscription form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletterEmail');
        if (emailInput && emailInput.value) {
          showToast(`Đã đăng ký nhận ưu đãi thành công cho ${emailInput.value}! Mã ưu đãi: HOASAP10`, 'success');
          emailInput.value = '';
        }
      });
    }
  }

  // Toast Function
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '🌸';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
