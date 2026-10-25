// ==========================================================
// OWEN FLEUR - ADMIN PORTAL SCRIPT & WORKFLOW LOGIC
// Full Product CRUD, Customer CRM & VietQR Payment Configuration
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State & Data Seeding
  const state = {
    currentTab: 'orders',
    currentFilter: 'all',
    searchQuery: '',
    customerSearchQuery: '',
    orders: getStoredOrders(),
    storeSettings: getStoredSettings(),
    products: getStoredProducts(),
    builderOptions: getStoredBuilderOptions(),
    currentBuilderSubtab: 'mainFlowers',
    admins: getStoredAdmins(),
    currentAdmin: getStoredCurrentAdmin()
  };

  // 1. Initial State & Data Seeding
  // Clean order management: no fake mock data, starts clean for production
  function getStoredOrders() {
    let orders = JSON.parse(localStorage.getItem('owenfleur_orders'));
    if (!orders) {
      orders = [];
      localStorage.setItem('owenfleur_orders', JSON.stringify(orders));
    } else {
      // Automatically clean up any past development test mock orders
      orders = orders.filter(o => o.id !== 'FLR-89214' && o.id !== 'FLR-89210' && o.id !== 'FLR-89195');
      localStorage.setItem('owenfleur_orders', JSON.stringify(orders));
    }
    return orders;
  }

  function getStoredSettings() {
    let settings = JSON.parse(localStorage.getItem('owenfleur_store_settings'));
    if (!settings) {
      settings = {
        name: "Owen Fleur",
        taglineFr: "Les fleurs racontent ce que le cœur ressent.",
        taglineEn: "𝐹𝑙𝑜𝑤𝑒𝑟𝑠 𝑤ℎ𝑖𝑠𝑝𝑒𝑟 𝑤ℎ𝑎𝑡 𝑡ℎ𝑒 ℎ𝑒𝑎𝑟𝑡 𝑐𝑎𝑛𝑛𝑜𝑡 𝑠𝑎𝑦.",
        taglineVi: "Hoa thì thầm những điều trái tim khó tỏ bày.",
        phone: "0985 421 398",
        addressHanoi: "CS1: Đống Đa - Hà Nội",
        addressHungYen: "CS2: Văn Giang - Hưng Yên",
        facebook: "https://www.facebook.com/owenfleur",
        tiktok: "https://www.tiktok.com/@owenfleur",
        announcement: "💐 Ưu đãi tháng này: Nhập mã HOASAP10 giảm ngay 10% • Freeship nội thành từ 500k",
        // Banking & VietQR config
        bankName: "Vietcombank",
        bankAccount: "0985421398",
        accountHolder: "TIEM HOA OWEN FLEUR",
        transferPrefix: "OWENFLEUR",
        customQrImage: ""
      };
      localStorage.setItem('owenfleur_store_settings', JSON.stringify(settings));
    } else {
      let needsSave = false;
      if (settings.addressHanoi && !settings.addressHanoi.includes('CS1:')) {
        settings.addressHanoi = 'CS1: ' + settings.addressHanoi;
        needsSave = true;
      }
      if (settings.addressHungYen && !settings.addressHungYen.includes('CS2:')) {
        settings.addressHungYen = 'CS2: ' + settings.addressHungYen;
        needsSave = true;
      }
      if (needsSave) {
        localStorage.setItem('owenfleur_store_settings', JSON.stringify(settings));
      }
    }
    return settings;
  }

  function getStoredProducts() {
    let products = JSON.parse(localStorage.getItem('owenfleur_products'));
    const isSoapData = products && products.some(p => p.name.includes('Sáp') || p.category === 'glitter');
    if (!products || products.length === 0 || !isSoapData) {
      products = (typeof FLOWER_DATA !== 'undefined' && FLOWER_DATA.products) ? [...FLOWER_DATA.products] : [];
      localStorage.setItem('owenfleur_products', JSON.stringify(products));
    }
    return products;
  }

  function getStoredBuilderOptions() {
    let opts = null;
    try {
      opts = JSON.parse(localStorage.getItem('owenfleur_builder_options'));
    } catch (e) {}

    const isValid = opts && 
      Array.isArray(opts.mainFlowers) && opts.mainFlowers.length > 0 &&
      Array.isArray(opts.accentFlowers) &&
      Array.isArray(opts.wrappers) &&
      Array.isArray(opts.ribbons);

    if (!isValid) {
      const defaultOpts = (typeof FLOWER_DATA !== 'undefined' && FLOWER_DATA.customBouquetOptions)
        ? JSON.parse(JSON.stringify(FLOWER_DATA.customBouquetOptions))
        : {
            mainFlowers: [],
            accentFlowers: [],
            wrappers: [],
            ribbons: []
          };
      opts = {
        mainFlowers: defaultOpts.mainFlowers || [],
        accentFlowers: defaultOpts.accentFlowers || [],
        wrappers: defaultOpts.wrappers || [],
        ribbons: defaultOpts.ribbons || [],
        baseCraftFee: (defaultOpts && typeof defaultOpts.baseCraftFee === 'number') ? defaultOpts.baseCraftFee : 50000
      };
      try {
        localStorage.setItem('owenfleur_builder_options', JSON.stringify(opts));
      } catch (err) {}
    } else {
      if (typeof opts.baseCraftFee !== 'number') {
        opts.baseCraftFee = 50000;
        try {
          localStorage.setItem('owenfleur_builder_options', JSON.stringify(opts));
        } catch (err) {}
      }
    }
    return opts;
  }

  function getStoredAdmins() {
    let admins = JSON.parse(localStorage.getItem('owenfleur_admins'));
    // If admins has mock "Lê Hoàng" or is empty, cleanly seed with ONLY the single Master Account
    const hasMock = admins && admins.some(a => a.name && (a.name.includes('Lê Hoàng') || a.username === 'florist_lan'));
    if (!admins || admins.length === 0 || hasMock) {
      admins = [
        {
          id: 'adm_master',
          username: 'admin',
          password: 'admin123',
          name: 'Chủ Tiệm Owen Fleur',
          role: 'Chủ Tiệm (Super Admin)',
          avatar: '👑',
          isMaster: true,
          createdAt: new Date().toISOString().split('T')[0]
        }
      ];
      localStorage.setItem('owenfleur_admins', JSON.stringify(admins));
    }
    return admins;
  }

  function getStoredCurrentAdmin() {
    try {
      // Prioritize active session storage so closing browser/tab requires clean login
      let cur = JSON.parse(sessionStorage.getItem('owenfleur_current_admin'));
      if (!cur) {
        cur = JSON.parse(localStorage.getItem('owenfleur_current_admin'));
      }
      // If cached profile has mock "Lê Hoàng", clear it immediately!
      if (cur && cur.name && cur.name.includes('Lê Hoàng')) {
        sessionStorage.removeItem('owenfleur_current_admin');
        localStorage.removeItem('owenfleur_current_admin');
        return null;
      }
      return cur || null;
    } catch(e) {
      return null;
    }
  }

  // DOM Elements
  const ordersListContainer = document.getElementById('ordersListContainer');
  const navItems = document.querySelectorAll('.admin-nav-item');
  const viewPanes = document.querySelectorAll('.admin-view-pane');
  const urgentCountBadge = document.getElementById('urgentCountBadge');
  const orderSearchInput = document.getElementById('orderSearchInput');
  const filterPills = document.querySelectorAll('.filter-pill');
  const storeSettingsForm = document.getElementById('storeSettingsForm');

  // Customer CRM Elements
  const customersTableBody = document.getElementById('customersTableBody');
  const customerSearchInput = document.getElementById('customerSearchInput');
  const exportCustomersBtn = document.getElementById('exportCustomersBtn');

  // Product CRUD Elements
  const adminProductsTableBody = document.getElementById('adminProductsTableBody');
  const addNewProductBtn = document.getElementById('addNewProductBtn');
  const productEditModal = document.getElementById('productEditModal');
  const productEditModalClose = document.getElementById('productEditModalClose');
  const cancelProductEditBtn = document.getElementById('cancelProductEditBtn');
  const productEditForm = document.getElementById('productEditForm');
  const prodImageInput = document.getElementById('prodEditImage');
  const prodImagePreview = document.getElementById('prodImagePreview');

  // Helper: Downscale & Compress Image to Max Width/Height & Quality (Avoid localStorage 5MB quota errors)
  function resizeAndCompressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Initialize Dashboard
  initAuth();
  initNavigation();
  updateMetrics();
  renderOrders();
  renderCustomersTable();
  renderProductsTable();
  renderBuilderTable();
  renderAdminsTable();
  initSettingsForm();
  initProductCRUD();
  initBuilderManagement();
  initAdminManagement();
  initManualOrderCreation();
  initCloudSync();

  // --------------------------------------------------------------------------
  // 2. Navigation between Views
  // --------------------------------------------------------------------------
  function initNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');

        // Check master permission for Staff Management and Settings
        if ((tab === 'admins' || tab === 'settings') && state.currentAdmin) {
          const isMaster = state.currentAdmin.isMaster || state.currentAdmin.username === 'admin';
          if (!isMaster) {
            alert('⚠️ Quyền truy cập bị từ chối: Chỉ Tài Khoản Tổng (Chủ Tiệm) mới có quyền truy cập mục này!');
            return;
          }
        }

        state.currentTab = tab;

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        viewPanes.forEach(pane => {
          if (pane.id === `${tab}View`) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });

        if (tab === 'urgent') {
          state.currentFilter = 'urgent';
          renderOrders();
        } else if (tab === 'orders') {
          state.currentFilter = 'all';
          renderOrders();
        } else if (tab === 'customers') {
          renderCustomersTable();
        } else if (tab === 'products') {
          renderProductsTable();
        } else if (tab === 'builder') {
          renderBuilderTable();
        } else if (tab === 'admins') {
          renderAdminsTable();
        }
      });
    });

    // Filter pills in Orders tab
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentFilter = pill.getAttribute('data-status');
        renderOrders();
      });
    });

    // Search orders
    if (orderSearchInput) {
      orderSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderOrders();
      });
    }

  }

  // --------------------------------------------------------------------------
  // 3. Render Metrics
  // --------------------------------------------------------------------------
  function updateMetrics() {
    const totalRev = state.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const urgentCount = state.orders.filter(o => o.isUrgent && o.status !== 'delivered' && o.status !== 'cancelled').length;
    const craftingCount = state.orders.filter(o => o.status === 'crafting').length;
    const deliveringCount = state.orders.filter(o => o.status === 'delivering').length;

    document.getElementById('metricRevenue').textContent = formatCurrency(totalRev);
    document.getElementById('metricUrgent').textContent = urgentCount;
    document.getElementById('metricCrafting').textContent = craftingCount;
    document.getElementById('metricDelivering').textContent = deliveringCount;

    urgentCountBadge.textContent = urgentCount;
    urgentCountBadge.style.display = urgentCount > 0 ? 'inline-block' : 'none';
  }

  // --------------------------------------------------------------------------
  // 4. Render Orders List
  // --------------------------------------------------------------------------
  function renderOrders() {
    let filtered = [...state.orders];

    if (state.currentFilter === 'urgent') {
      filtered = filtered.filter(o => o.isUrgent);
    } else if (state.currentFilter !== 'all') {
      filtered = filtered.filter(o => o.status === state.currentFilter);
    }

    if (state.searchQuery !== '') {
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(state.searchQuery) ||
        o.recipientName.toLowerCase().includes(state.searchQuery) ||
        o.recipientPhone.includes(state.searchQuery) ||
        o.address.toLowerCase().includes(state.searchQuery)
      );
    }

    filtered.sort((a, b) => {
      // 1. Cancelled orders always go to the very bottom!
      if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
      if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;

      // 2. Urgent active orders go to the very top
      const aUrgent = a.isUrgent && a.status !== 'delivered' && a.status !== 'cancelled';
      const bUrgent = b.isUrgent && b.status !== 'delivered' && b.status !== 'cancelled';
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      // 3. Newest orders first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filtered.length === 0) {
      ordersListContainer.innerHTML = `
        <div style="background: #fff; border-radius: var(--radius-md); padding: 50px 20px; text-align: center; border: 1px dashed var(--admin-border);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🌸</div>
          <h3 style="color: var(--admin-primary); margin-bottom: 6px; font-family: var(--font-serif); font-size: 1.4rem;">Chưa Có Đơn Hàng Nào</h3>
          <p style="color: var(--admin-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto 18px auto;">
            Hệ thống đã sẵn sàng đón đơn. Đơn mới khách đặt qua website hoặc nhân viên tạo tại quầy sẽ tự động xuất hiện tại đây theo thời gian thực!
          </p>
          <button class="btn-admin btn-admin-primary" onclick="document.getElementById('openManualOrderModalBtn').click()">
            ✨ + Tạo Đơn Hàng Đầu Tiên
          </button>
        </div>
      `;
      return;
    }

    let hasShownArchiveHeader = false;
    const cancelledCount = state.orders.filter(o => o.status === 'cancelled').length;

    ordersListContainer.innerHTML = filtered.map(order => {
      const isCancelled = order.status === 'cancelled';
      const safeId = window.escapeHtml ? window.escapeHtml(order.id) : order.id;
      const safeName = window.escapeHtml ? window.escapeHtml(order.recipientName) : order.recipientName;
      const safePhone = window.escapeHtml ? window.escapeHtml(order.recipientPhone) : order.recipientPhone;
      const safeAddress = window.escapeHtml ? window.escapeHtml(order.address) : order.address;
      const safeTimeLabel = window.escapeHtml ? window.escapeHtml(order.deliveryTimeLabel || 'Trong ngày') : (order.deliveryTimeLabel || 'Trong ngày');
      const safeDate = window.escapeHtml ? window.escapeHtml(order.deliveryDate || '') : (order.deliveryDate || '');
      const safeCardMsg = window.escapeHtml ? window.escapeHtml(order.cardMessage || '') : (order.cardMessage || '');
      const safeFloristNotes = window.escapeHtml ? window.escapeHtml(order.floristNotes || '') : (order.floristNotes || '');

      let archiveHeaderHtml = '';
      if (state.currentFilter === 'all' && isCancelled && !hasShownArchiveHeader) {
        hasShownArchiveHeader = true;
        archiveHeaderHtml = `
          <div style="margin: 36px 0 16px 0; display: flex; align-items: center; gap: 14px;">
            <div style="height: 1px; flex: 1; background: #cbd5e1;"></div>
            <span style="font-size: 0.88rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 6px;">
              🗄️ Khu Vực Lưu Trữ Đơn Đã Hủy (${cancelledCount} đơn)
            </span>
            <div style="height: 1px; flex: 1; background: #cbd5e1;"></div>
          </div>
        `;
      }

      return archiveHeaderHtml + `
      <div class="order-row-card ${isCancelled ? 'is-cancelled' : (order.isUrgent ? 'is-urgent' : '')}" id="orderCard-${safeId}">
        <div class="order-header-row">
          <div class="order-code-group">
            <span class="order-id">#${safeId}</span>
            ${isCancelled ? `<span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 800;">❌ ĐÃ HỦY / LƯU TRỮ</span>` : (order.isUrgent ? `<span class="urgent-tag">⚡ KHẨN CẤP / HỎA TỐC</span>` : '')}
            <span style="font-size: 0.8rem; color: var(--admin-muted);">
              Đặt lúc: ${new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="status-badge ${order.status}">
              ${getStatusBadgeName(order.status)}
            </span>
            <span style="font-size: 1.15rem; font-weight: 800; color: ${isCancelled ? '#94a3b8' : 'var(--admin-primary)'};">
              ${formatCurrency(order.total)}
            </span>
          </div>
        </div>

        <div class="order-body-grid">
          <!-- Col 1: Items List -->
          <div>
            <div style="font-weight: 700; color: var(--admin-primary); margin-bottom: 8px; font-size: 0.88rem;">
              💐 Mẫu hoa đặt (${order.items.length} món):
            </div>
            <ul class="order-items-list">
              ${order.items.map(it => `
                <li>
                  <span><strong>${it.quantity}x</strong> ${window.escapeHtml ? window.escapeHtml(it.name) : it.name}</span>
                  <span style="font-weight: 600;">${formatCurrency(it.price * it.quantity)}</span>
                </li>
              `).join('')}
            </ul>

            ${safeCardMsg ? `
              <div class="order-card-message">
                💌 <strong>Nội dung thiệp:</strong> "${safeCardMsg}"
              </div>
            ` : ''}
          </div>

          <!-- Col 2: Recipient Details -->
          <div class="order-recipient-info">
            <div style="font-weight: 700; color: var(--admin-primary); margin-bottom: 8px; font-size: 0.88rem;">
              📍 Thông tin người nhận:
            </div>
            <div><span class="label">Người nhận:</span> <strong>${safeName}</strong></div>
            <div><span class="label">Số điện thoại:</span> <a href="tel:${safePhone}" style="color: var(--admin-accent); font-weight: 600;">${safePhone}</a></div>
            <div><span class="label">Địa chỉ:</span> ${safeAddress}</div>
            <div style="margin-top: 4px; color: ${isCancelled ? '#64748b' : 'var(--admin-urgent)'}; font-weight: 600;">
              ⏰ Giờ hẹn giao: ${safeTimeLabel} (${safeDate})
            </div>
          </div>

          <!-- Col 3: Payment & Florist Notes -->
          <div>
            <div style="font-weight: 700; color: var(--admin-primary); margin-bottom: 8px; font-size: 0.88rem;">
              💳 Thanh toán & Ghi chú florist:
            </div>
            <div style="font-size: 0.85rem; margin-bottom: 8px;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; background: ${isCancelled ? '#f1f5f9' : '#edf7f2'}; color: ${isCancelled ? '#64748b' : '#1e5e3a'}; font-weight: 600;">
                ${window.escapeHtml ? window.escapeHtml(order.paymentStatus || order.paymentMethod) : (order.paymentStatus || order.paymentMethod)}
              </span>
            </div>
            <div style="background: #f4f6f5; padding: 10px; border-radius: var(--radius-sm); font-size: 0.82rem; color: var(--admin-muted);">
              <strong>Ghi chú:</strong> ${safeFloristNotes || 'Chưa có ghi chú đặc biệt.'}
            </div>
          </div>
        </div>

        <!-- Action bar -->
        <div class="order-actions-bar">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--admin-muted);">Chuyển trạng thái:</span>
            <select class="status-selector" data-action="change-status" data-id="${safeId}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Chờ Xác Nhận</option>
              <option value="crafting" ${order.status === 'crafting' ? 'selected' : ''}>✂️ Đang Cắm Hoa (Crafting)</option>
              <option value="photo_sent" ${order.status === 'photo_sent' ? 'selected' : ''}>📸 Đã Cắm Xong - Chờ Duyệt Ảnh</option>
              <option value="delivering" ${order.status === 'delivering' ? 'selected' : ''}>🚚 Đang Giao Hoa Cho Khách</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Đã Giao Thành Công</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Hủy Đơn Hàng (Lưu trữ)</option>
            </select>
          </div>

          <div class="order-btns-group">
            ${isCancelled ? `
              <button class="btn-admin" style="background: #e8f5e9; color: #1e5e3a; border: 1px solid #c2e2d0; font-size: 0.82rem; padding: 6px 14px;" onclick="restoreOrderById('${safeId}')" title="Khôi phục lại đơn hàng về trạng thái Chờ xác nhận">
                ♻️ Khôi Phục Đơn
              </button>
              <button class="btn-admin" style="background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; font-size: 0.82rem; padding: 6px 14px;" onclick="deleteOrderPermanently('${safeId}')" title="Xóa vĩnh viễn đơn hàng này">
                🗑️ Xóa Vĩnh Viễn
              </button>
            ` : `
              ${(order.recipientPhone || order.senderPhone) ? `
              <a href="https://zalo.me/${(order.recipientPhone || order.senderPhone).replace(/[^0-9]/g, '')}" target="_blank" class="btn-admin" style="background: #0068ff; color: #fff; padding: 7px 12px; font-size: 0.8rem; text-decoration: none;" title="Nhắn Zalo gửi ảnh duyệt hoa">
                💬 Zalo Khách
              </a>
              <a href="tel:${(order.recipientPhone || order.senderPhone).replace(/[^0-9]/g, '')}" class="btn-admin btn-admin-outline" style="padding: 7px 10px; font-size: 0.8rem; text-decoration: none;" title="Gọi điện thoại">
                📞 Gọi
              </a>` : ''}
              <button class="btn-admin ${order.isUrgent ? 'btn-admin-outline' : 'btn-admin-urgent'}" data-action="toggle-urgent" data-id="${safeId}">
                ${order.isUrgent ? '⚡ Hủy Khẩn Cấp' : '⚡ ĐẨY HỎA TỐC GẤP'}
              </button>
              <button class="btn-admin btn-admin-outline" data-action="print-slip" data-id="${safeId}">
                🖨️ In Phiếu Giao & Thiệp
              </button>
              <button class="btn-admin btn-admin-outline" data-action="edit-note" data-id="${safeId}">
                📝 Ghi Chú
              </button>
            `}
          </div>
        </div>
      </div>
    `;
    }).join('');

    ordersListContainer.querySelectorAll('[data-action="change-status"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = select.getAttribute('data-id');
        updateOrderStatus(id, e.target.value);
      });
    });

    ordersListContainer.querySelectorAll('[data-action="toggle-urgent"]').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleOrderUrgent(btn.getAttribute('data-id'));
      });
    });

    ordersListContainer.querySelectorAll('[data-action="print-slip"]').forEach(btn => {
      btn.addEventListener('click', () => {
        openPrintModal(btn.getAttribute('data-id'));
      });
    });

    ordersListContainer.querySelectorAll('[data-action="edit-note"]').forEach(btn => {
      btn.addEventListener('click', () => {
        editOrderNote(btn.getAttribute('data-id'));
      });
    });
  }

  function getStatusBadgeName(status) {
    switch (status) {
      case 'pending': return 'Chờ Xác Nhận';
      case 'crafting': return '✂️ Đang Cắm Hoa';
      case 'photo_sent': return '📸 Đã Gửi Ảnh Duyệt';
      case 'delivering': return '🚚 Đang Đi Giao';
      case 'delivered': return '✅ Giao Thành Công';
      case 'cancelled': return '❌ Đã Hủy (Lưu trữ)';
      default: return status;
    }
  }

  function updateOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    if (newStatus === 'cancelled') {
      const confirmCancel = confirm(`Bạn có chắc chắn muốn HỦY đơn hàng #${orderId}?\nĐơn sẽ được tự động chuyển xuống khu vực lưu trữ dưới cùng.`);
      if (!confirmCancel) {
        renderOrders();
        return;
      }
      order.isUrgent = false;
    }

    order.status = newStatus;
    saveOrders();
    if (window.OwenCloud && OwenCloud.updateOrderStatus) {
      OwenCloud.updateOrderStatus(orderId, newStatus, { isUrgent: order.isUrgent });
    }
    updateMetrics();
    renderOrders();
    renderCustomersTable();

    if (newStatus === 'cancelled') {
      showAdminToast(`❌ Đã hủy đơn #${orderId} và chuyển xuống khu vực lưu trữ dưới cùng!`, 'info');
    } else {
      showAdminToast(`Đã chuyển đơn #${orderId} sang trạng thái: "${getStatusBadgeName(newStatus)}"`, 'success');
    }
  }

  window.restoreOrderById = function(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = 'pending';
    saveOrders();
    if (window.OwenCloud && OwenCloud.updateOrderStatus) {
      OwenCloud.updateOrderStatus(orderId, 'pending', { isUrgent: order.isUrgent });
    }
    updateMetrics();
    renderOrders();
    renderCustomersTable();
    showAdminToast(`♻️ Đã khôi phục đơn #${orderId} về trạng thái Chờ Xác Nhận!`, 'success');
  };

  window.deleteOrderPermanently = function(orderId) {
    const isMaster = state.currentAdmin && (state.currentAdmin.isMaster || state.currentAdmin.username === 'admin');
    if (!isMaster) {
      alert('⚠️ Chỉ Tài Khoản Tổng mới có quyền xóa vĩnh viễn đơn hàng!');
      return;
    }
    if (confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng #${orderId}?\nHành động này không thể hoàn tác!`)) {
      state.orders = state.orders.filter(o => o.id !== orderId);
      saveOrders();
      updateMetrics();
      renderOrders();
      renderCustomersTable();
      showAdminToast(`🗑️ Đã xóa vĩnh viễn đơn hàng #${orderId}`, 'info');
    }
  };

  function toggleOrderUrgent(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      order.isUrgent = !order.isUrgent;
      saveOrders();
      if (window.OwenCloud && OwenCloud.updateOrderStatus) {
        OwenCloud.updateOrderStatus(orderId, order.status, { isUrgent: order.isUrgent });
      }
      updateMetrics();
      renderOrders();
      if (order.isUrgent) {
        showAdminToast(`⚡ ĐÃ ĐẨY ĐƠN #${orderId} LÊN MỨC ĐỘ KHẨN CẤP / HỎA TỐC!`, 'urgent');
      } else {
        showAdminToast(`Đã hạ mức khẩn cấp đơn #${orderId}`, 'info');
      }
    }
  }

  function editOrderNote(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    const currentNote = order.floristNotes || '';
    const newNote = prompt(`Nhập ghi chú cho thợ cắm hoa / shipper đơn #${orderId}:`, currentNote);
    if (newNote !== null) {
      order.floristNotes = newNote.trim();
      saveOrders();
      if (window.OwenCloud && OwenCloud.updateOrderStatus) {
        OwenCloud.updateOrderStatus(orderId, order.status, { floristNotes: order.floristNotes });
      }
      renderOrders();
      showAdminToast('Đã lưu ghi chú đơn hàng!', 'success');
    }
  }

  function saveOrders() {
    localStorage.setItem('owenfleur_orders', JSON.stringify(state.orders));
  }

  // --------------------------------------------------------------------------
  // 5. CUSTOMER CRM: Lưu trữ & Quản lý thông tin khách hàng đã gửi
  // --------------------------------------------------------------------------
  function extractCustomersFromOrders() {
    const map = new Map();

    state.orders.forEach(order => {
      const phoneKey = (order.senderPhone || order.recipientPhone || '').trim();
      if (!phoneKey) return;

      if (!map.has(phoneKey)) {
        map.set(phoneKey, {
          name: order.recipientName || 'Khách Vãng Lai',
          phone: phoneKey,
          recipientPhone: order.recipientPhone || phoneKey,
          address: order.address,
          orderCount: 0,
          totalSpent: 0,
          orders: [],
          lastOrderDate: order.createdAt
        });
      }

      const cust = map.get(phoneKey);
      cust.orderCount += 1;
      if (order.status !== 'cancelled') {
        cust.totalSpent += (order.total || 0);
      }
      cust.orders.push(order.id);
      if (new Date(order.createdAt) > new Date(cust.lastOrderDate)) {
        cust.lastOrderDate = order.createdAt;
        cust.address = order.address;
        cust.name = order.recipientName;
      }
    });

    return Array.from(map.values());
  }

  function renderCustomersTable() {
    if (!customersTableBody) return;
    let customers = extractCustomersFromOrders();

    if (state.customerSearchQuery) {
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(state.customerSearchQuery) ||
        c.phone.includes(state.customerSearchQuery) ||
        c.address.toLowerCase().includes(state.customerSearchQuery)
      );
    }

    // Sort by highest total spent
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    if (customers.length === 0) {
      customersTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--admin-muted);">
            Chưa có thông tin khách hàng nào được ghi nhận.
          </td>
        </tr>
      `;
      return;
    }

    customersTableBody.innerHTML = customers.map(cust => {
      const isVip = cust.totalSpent >= 2500000 || cust.orderCount >= 3;
      const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
      const safeName = typeof escapeHtml === 'function' ? escapeHtml(cust.name) : cust.name;
      const safePhone = typeof escapeHtml === 'function' ? escapeHtml(cust.phone) : cust.phone;
      const safeAddress = typeof escapeHtml === 'function' ? escapeHtml(cust.address) : cust.address;
      const safeOrders = typeof escapeHtml === 'function' ? escapeHtml(cust.orders.join(', ')) : cust.orders.join(', ');

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--admin-primary);">${safeName}</div>
            <div style="font-size: 0.78rem; color: var(--admin-muted);">Đã đặt: ${safeOrders}</div>
          </td>
          <td>
            <strong>${safePhone}</strong>
          </td>
          <td style="max-width: 220px; font-size: 0.85rem;">
            ${safeAddress}
          </td>
          <td>
            <span style="font-weight: 700; font-size: 0.95rem;">${cust.orderCount}</span> đơn
          </td>
          <td>
            <strong style="color: var(--admin-accent); font-size: 1rem;">${formatCurrency(cust.totalSpent)}</strong>
          </td>
          <td>
            <span class="customer-badge ${isVip ? 'vip' : 'regular'}">
              ${isVip ? '🌟 VIP Thân Thiết' : '🌱 Khách Thân Quen'}
            </span>
          </td>
          <td style="font-size: 0.82rem; color: var(--admin-muted);">
            ${new Date(cust.lastOrderDate).toLocaleDateString('vi-VN')}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="tel:${cleanPhone}" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 0.78rem;" title="Gọi điện">
                📞 Gọi
              </a>
              <a href="https://zalo.me/${cleanPhone}" target="_blank" class="btn-admin btn-admin-primary" style="padding: 5px 10px; font-size: 0.78rem; background: #0068ff;" title="Nhắn Zalo">
                💬 Zalo
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Customer search listener
  if (customerSearchInput) {
    customerSearchInput.addEventListener('input', (e) => {
      state.customerSearchQuery = e.target.value.toLowerCase().trim();
      renderCustomersTable();
    });
  }

  // Export Customer List to CSV
  if (exportCustomersBtn) {
    exportCustomersBtn.addEventListener('click', () => {
      const customers = extractCustomersFromOrders();
      if (customers.length === 0) {
        showAdminToast('Không có dữ liệu khách hàng để xuất!', 'info');
        return;
      }

      let csv = "\uFEFF"; // UTF-8 BOM for Excel Vietnamese characters
      csv += "Họ và Tên,Số Điện Thoại,Địa Chỉ Giao Hàng,Số Đơn Đã Đặt,Tổng Chi Tiêu (VNĐ),Hạng Khách Hàng,Lần Đặt Gần Nhất\n";
      customers.forEach(c => {
        const isVip = c.totalSpent >= 2500000 || c.orderCount >= 3 ? "VIP Thân Thiết" : "Khách Thân Quen";
        const cleanAddr = `"${c.address.replace(/"/g, '""')}"`;
        const cleanName = `"${c.name.replace(/"/g, '""')}"`;
        csv += `${cleanName},${c.phone},${cleanAddr},${c.orderCount},${c.totalSpent},${isVip},${new Date(c.lastOrderDate).toLocaleDateString('vi-VN')}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `danh_sach_khach_hang_owenfleur_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showAdminToast('✅ Đã xuất danh sách khách hàng ra file Excel / CSV!', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 6. FULL PRODUCT CRUD: Thêm, sửa ảnh (tải file / URL), giá, mô tả, danh mục & xóa hoa
  // --------------------------------------------------------------------------
  function initProductCRUD() {
    // Open Add Product modal
    if (addNewProductBtn) {
      addNewProductBtn.addEventListener('click', () => {
        openProductModal(null);
      });
    }

    // Close modal
    if (productEditModalClose) {
      productEditModalClose.addEventListener('click', closeProductModal);
    }
    if (cancelProductEditBtn) {
      cancelProductEditBtn.addEventListener('click', closeProductModal);
    }

    // Image Upload Dual Tabs
    const tabUploadFile = document.getElementById('tabUploadFile');
    const tabEnterUrl = document.getElementById('tabEnterUrl');
    const fileUploadContainer = document.getElementById('fileUploadContainer');
    const urlInputContainer = document.getElementById('urlInputContainer');
    const prodEditImageFile = document.getElementById('prodEditImageFile');
    const uploadFileText = document.getElementById('uploadFileText');

    if (tabUploadFile && tabEnterUrl) {
      tabUploadFile.addEventListener('click', () => {
        tabUploadFile.classList.add('active');
        tabEnterUrl.classList.remove('active');
        if (fileUploadContainer) fileUploadContainer.style.display = 'block';
        if (urlInputContainer) urlInputContainer.style.display = 'none';
      });

      tabEnterUrl.addEventListener('click', () => {
        tabEnterUrl.classList.add('active');
        tabUploadFile.classList.remove('active');
        if (fileUploadContainer) fileUploadContainer.style.display = 'none';
        if (urlInputContainer) urlInputContainer.style.display = 'block';
      });
    }


    // Handle Local File Upload with Auto-Compression
    if (prodEditImageFile) {
      prodEditImageFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP)!');
          return;
        }

        if (uploadFileText) {
          uploadFileText.textContent = `⏳ Đang xử lý ảnh "${file.name}"...`;
        }

        try {
          const compressedBase64 = await resizeAndCompressImage(file, 800, 800, 0.82);
          if (prodImageInput) prodImageInput.value = compressedBase64;
          if (prodImagePreview) prodImagePreview.src = compressedBase64;
          if (uploadFileText) {
            uploadFileText.textContent = `✅ Đã chọn ảnh: ${file.name} (Đã tối ưu chuẩn web)`;
          }
          showAdminToast(`📁 Đã nạp và tối ưu ảnh "${file.name}" thành công!`, 'success');
        } catch (err) {
          console.error('File compression error:', err);
          const reader = new FileReader();
          reader.onload = function(evt) {
            const rawBase64 = evt.target.result;
            if (prodImageInput) prodImageInput.value = rawBase64;
            if (prodImagePreview) prodImagePreview.src = rawBase64;
            if (uploadFileText) uploadFileText.textContent = `✅ Đã chọn ảnh: ${file.name}`;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Live Image preview on URL input
    if (prodImageInput) {
      prodImageInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        prodImagePreview.src = url || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80';
      });
    }

    // Submit Product Form (Add or Edit)
    if (productEditForm) {
      productEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProductFormData();
      });
    }
  }

  function renderProductsTable() {
    if (!adminProductsTableBody) return;

    adminProductsTableBody.innerHTML = state.products.map(prod => `
      <tr>
        <td>
          <img class="prod-thumb" src="${prod.image}" alt="${prod.name}">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--admin-primary);">${prod.name}</div>
          <div style="font-size: 0.8rem; color: var(--admin-muted); max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${prod.description || ''}
          </div>
        </td>
        <td>
          <span style="background: #f4efe9; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">
            ${getCategoryName(prod.category)}
          </span>
        </td>
        <td>
          <strong style="color: var(--admin-accent); font-size: 1rem;">${formatCurrency(prod.price)}</strong>
          ${prod.originalPrice ? `<div style="text-decoration: line-through; font-size: 0.78rem; color: var(--admin-muted);">${formatCurrency(prod.originalPrice)}</div>` : ''}
        </td>
        <td>
          <span style="background: #edf7f2; color: #1e5e3a; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
            ${prod.tag || 'Mẫu chuẩn'}
          </span>
        </td>
        <td style="font-size: 0.85rem; color: var(--admin-muted);">
          ${prod.tone || 'Pastel'}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-admin btn-admin-outline" style="padding: 6px 10px; font-size: 0.8rem;" onclick="openProductEditById('${prod.id}')" title="Sửa chi tiết">
              ✏️ Sửa
            </button>
            <button class="btn-admin" style="padding: 6px 10px; font-size: 0.8rem; background: #fee2e2; color: #991b1b;" onclick="deleteProductById('${prod.id}')" title="Xóa mẫu hoa">
              🗑️ Xóa
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function getCategoryName(cat) {
    switch (cat) {
      case 'love': return '💖 Tình Yêu';
      case 'birthday': return '🎂 Sinh Nhật';
      case 'opening': return '🎉 Khai Trương';
      case 'wedding': return '💍 Hoa Cưới';
      case 'box': return '🎁 Giỏ & Hộp Hoa';
      default: return cat;
    }
  }

  function openProductModal(product = null) {
    const modalTitle = document.getElementById('productModalTitle');
    const idInput = document.getElementById('prodEditId');
    const nameInput = document.getElementById('prodEditName');
    const catSelect = document.getElementById('prodEditCategory');
    const priceInput = document.getElementById('prodEditPrice');
    const origPriceInput = document.getElementById('prodEditOriginalPrice');
    const toneInput = document.getElementById('prodEditTone');
    const tagInput = document.getElementById('prodEditTag');
    const flowersInput = document.getElementById('prodEditFlowersIncluded');
    const imgInput = document.getElementById('prodEditImage');
    const descInput = document.getElementById('prodEditDesc');
    const meaningInput = document.getElementById('prodEditMeaning');
    const careInput = document.getElementById('prodEditCareGuide');
    const fileUploadText = document.getElementById('uploadFileText');
    const fileInput = document.getElementById('prodEditImageFile');
    const tabUploadFile = document.getElementById('tabUploadFile');
    const tabEnterUrl = document.getElementById('tabEnterUrl');
    const fileUploadContainer = document.getElementById('fileUploadContainer');
    const urlInputContainer = document.getElementById('urlInputContainer');

    if (fileInput) fileInput.value = '';

    if (product) {
      modalTitle.textContent = `Chỉnh Sửa Mẫu Hoa: ${product.name}`;
      idInput.value = product.id;
      nameInput.value = product.name;
      catSelect.value = product.category || 'love';
      priceInput.value = product.price;
      origPriceInput.value = product.originalPrice || '';
      toneInput.value = product.tone || '';
      tagInput.value = product.tag || '';
      flowersInput.value = Array.isArray(product.flowersIncluded) ? product.flowersIncluded.join(', ') : (product.flowersIncluded || '');
      imgInput.value = product.image || '';
      prodImagePreview.src = product.image || '';
      descInput.value = product.description || '';
      meaningInput.value = product.flowerMeaning || '';
      careInput.value = product.careGuide || '';

      if (fileUploadText) {
        fileUploadText.textContent = product.image && product.image.startsWith('data:') 
          ? '✅ Đang dùng ảnh tự tải lên (Nhấn để chọn ảnh mới thay thế)' 
          : 'Nhấn để chọn ảnh mới từ máy tính';
      }
    } else {
      modalTitle.textContent = "🌸 Thêm Mẫu Hoa Mới Vào Shop";
      idInput.value = '';
      nameInput.value = '';
      catSelect.value = 'love';
      priceInput.value = '';
      origPriceInput.value = '';
      toneInput.value = 'Hồng Pastel & Trắng Kem';
      tagInput.value = 'Mới Về';
      flowersInput.value = 'Hoa Hồng Sáp Thơm 4 Lớp, Cành Baby Khô';
      imgInput.value = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80';
      prodImagePreview.src = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80';
      descInput.value = 'Thiết kế hoa sáp thơm cao cấp cánh mềm mịn, lưu hương dịu nhẹ và giữ sắc đẹp vĩnh cửu 3-5 năm.';
      meaningInput.value = 'Biểu trưng cho tình yêu chân thành, sự gắn kết bền chặt không bao giờ tàn phai.';
      careInput.value = 'Để nơi khô ráo thoáng mát, tránh nước và ánh nắng trực tiếp. Bền đẹp 3 - 5 năm.';
      if (fileUploadText) fileUploadText.textContent = 'Nhấn để chọn ảnh từ máy tính';
    }

    // Default to File Upload tab
    if (tabUploadFile && tabEnterUrl) {
      tabUploadFile.classList.add('active');
      tabEnterUrl.classList.remove('active');
      if (fileUploadContainer) fileUploadContainer.style.display = 'block';
      if (urlInputContainer) urlInputContainer.style.display = 'none';
    }

    productEditModal.classList.add('active');
  }

  function closeProductModal() {
    productEditModal.classList.remove('active');
  }

  function saveProductFormData() {
    const id = document.getElementById('prodEditId').value.trim();
    const name = document.getElementById('prodEditName').value.trim();
    const category = document.getElementById('prodEditCategory').value;
    const price = parseInt(document.getElementById('prodEditPrice').value, 10);
    const originalPrice = document.getElementById('prodEditOriginalPrice').value ? parseInt(document.getElementById('prodEditOriginalPrice').value, 10) : null;
    const tone = document.getElementById('prodEditTone').value.trim();
    const tag = document.getElementById('prodEditTag').value.trim();
    const flowersStr = document.getElementById('prodEditFlowersIncluded').value.trim();
    const flowersIncluded = flowersStr ? flowersStr.split(',').map(s => s.trim()) : ['Hoa sáp thơm cao cấp'];
    const image = (document.getElementById('prodEditImage').value || '').trim() || (prodImagePreview ? prodImagePreview.src : '');
    const description = document.getElementById('prodEditDesc').value.trim();
    const flowerMeaning = document.getElementById('prodEditMeaning').value.trim();
    const careGuide = document.getElementById('prodEditCareGuide').value.trim();

    if (!image) {
      alert('Vui lòng chọn hoặc dán link ảnh cho mẫu hoa!');
      return;
    }

    if (id) {
      // Update existing
      const existing = state.products.find(p => p.id === id);
      if (existing) {
        existing.name = name;
        existing.category = category;
        existing.price = price;
        existing.originalPrice = originalPrice;
        existing.tone = tone;
        existing.tag = tag;
        existing.flowersIncluded = flowersIncluded;
        existing.image = image;
        existing.description = description;
        existing.flowerMeaning = flowerMeaning;
        existing.careGuide = careGuide;
        showAdminToast(`Đã cập nhật thông tin mẫu hoa "${name}"!`, 'success');
      }
    } else {
      // Add new
      const newProd = {
        id: 'fleur-' + Date.now(),
        name,
        category,
        price,
        originalPrice,
        tone,
        tag,
        rating: 5.0,
        reviewsCount: 1,
        flowersIncluded,
        image,
        description,
        flowerMeaning,
        careGuide
      };
      state.products.unshift(newProd);
      showAdminToast(`🌸 Đã thêm mẫu hoa mới "${name}" vào website!`, 'success');
    }

    // Save to localStorage safely
    try {
      localStorage.setItem('owenfleur_products', JSON.stringify(state.products));
    } catch (e) {
      console.error('Storage error:', e);
      alert('⚠️ Dung lượng bộ nhớ trình duyệt bị đầy! Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    renderProductsTable();
    closeProductModal();
  }

  window.openProductEditById = function(productId) {
    const prod = state.products.find(p => p.id === productId);
    if (prod) openProductModal(prod);
  };

  window.deleteProductById = function(productId) {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    if (confirm(`Bạn có chắc chắn muốn xóa mẫu hoa "${prod.name}" khỏi website?`)) {
      state.products = state.products.filter(p => p.id !== productId);
      localStorage.setItem('owenfleur_products', JSON.stringify(state.products));
      renderProductsTable();
      showAdminToast(`Đã xóa mẫu hoa "${prod.name}"`, 'info');
    }
  };

  // --------------------------------------------------------------------------
  // 7. STORE SETTINGS & VIETQR PAYMENT CONFIG
  // --------------------------------------------------------------------------
  function initSettingsForm() {
    if (!storeSettingsForm) return;

    // Fill current settings into form
    document.getElementById('cfgStoreName').value = state.storeSettings.name || '';
    document.getElementById('cfgTaglineFr').value = state.storeSettings.taglineFr || '';
    document.getElementById('cfgTaglineEn').value = state.storeSettings.taglineEn || '';
    document.getElementById('cfgHotline').value = state.storeSettings.phone || '';
    document.getElementById('cfgAddressHanoi').value = state.storeSettings.addressHanoi || '';
    document.getElementById('cfgAddressHungYen').value = state.storeSettings.addressHungYen || '';
    document.getElementById('cfgFacebook').value = state.storeSettings.facebook || '';
    document.getElementById('cfgTiktok').value = state.storeSettings.tiktok || '';
    document.getElementById('cfgAnnouncement').value = state.storeSettings.announcement || '';

    // Banking fields
    document.getElementById('cfgBankName').value = state.storeSettings.bankName || 'Vietcombank';
    document.getElementById('cfgBankAccount').value = state.storeSettings.bankAccount || '0985421398';
    document.getElementById('cfgAccountHolder').value = state.storeSettings.accountHolder || 'TIEM HOA OWEN FLEUR';
    document.getElementById('cfgTransferPrefix').value = state.storeSettings.transferPrefix || 'OWENFLEUR';
    document.getElementById('cfgCustomQrImage').value = state.storeSettings.customQrImage || '';

    // Telegram Push Notification fields
    const cfgTgToken = document.getElementById('cfgTelegramBotToken');
    const cfgTgChat = document.getElementById('cfgTelegramChatId');
    if (cfgTgToken) cfgTgToken.value = state.storeSettings.telegramBotToken || '';
    if (cfgTgChat) cfgTgChat.value = state.storeSettings.telegramChatId || '';

    const btnTestTg = document.getElementById('btnTestTelegramAlert');
    if (btnTestTg) {
      btnTestTg.addEventListener('click', () => {
        const token = cfgTgToken ? cfgTgToken.value.trim() : '';
        const chat = cfgTgChat ? cfgTgChat.value.trim() : '';
        if (!token || !chat) {
          showAdminToast('⚠️ Vui lòng nhập Telegram Bot Token và Chat ID trước khi test!', 'urgent');
          return;
        }

        showAdminToast('🔔 Đang bắn tin nhắn test tới Telegram của bạn...', 'info');
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat,
            text: '🔔 <b>[TEST THÀNH CÔNG - TIỆM HOA OWEN FLEUR]</b>\n\nChúc mừng! Hệ thống đã kết nối hoàn hảo với điện thoại của bạn. Mọi đơn hoa sáp đặt từ khách hàng trên Internet sẽ lập tức báo về đây!',
            parse_mode: 'HTML'
          })
        }).then(res => res.json()).then(data => {
          if (data.ok) {
            showAdminToast('🎉 Tin nhắn đã nổ chuông trên điện thoại Telegram của bạn!', 'success');
          } else {
            showAdminToast(`❌ Telegram báo lỗi: ${data.description}`, 'urgent');
          }
        }).catch(err => {
          showAdminToast('❌ Lỗi kết nối tới Telegram API: ' + err.message, 'urgent');
        });
      });
    }

    updateLiveQrPreview();

    // Listeners for live QR preview
    ['cfgBankName', 'cfgBankAccount', 'cfgAccountHolder', 'cfgTransferPrefix', 'cfgCustomQrImage'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateLiveQrPreview);
    });

    storeSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.storeSettings = {
        name: document.getElementById('cfgStoreName').value.trim(),
        taglineFr: document.getElementById('cfgTaglineFr').value.trim(),
        taglineEn: document.getElementById('cfgTaglineEn').value.trim(),
        phone: document.getElementById('cfgHotline').value.trim(),
        addressHanoi: document.getElementById('cfgAddressHanoi').value.trim(),
        addressHungYen: document.getElementById('cfgAddressHungYen').value.trim(),
        facebook: document.getElementById('cfgFacebook').value.trim(),
        tiktok: document.getElementById('cfgTiktok').value.trim(),
        announcement: document.getElementById('cfgAnnouncement').value.trim(),
        // Bank config
        bankName: document.getElementById('cfgBankName').value,
        bankAccount: document.getElementById('cfgBankAccount').value.trim(),
        accountHolder: document.getElementById('cfgAccountHolder').value.trim().toUpperCase(),
        transferPrefix: document.getElementById('cfgTransferPrefix').value.trim().toUpperCase() || 'OWENFLEUR',
        customQrImage: document.getElementById('cfgCustomQrImage').value.trim(),
        // Telegram Alert config
        telegramBotToken: cfgTgToken ? cfgTgToken.value.trim() : '',
        telegramChatId: cfgTgChat ? cfgTgChat.value.trim() : ''
      };

      localStorage.setItem('owenfleur_store_settings', JSON.stringify(state.storeSettings));
      updateLiveQrPreview();
      showAdminToast('🎉 Đã lưu cấu hình cửa hàng & chuông báo Telegram thành công!', 'success');
    });
  }

  function updateLiveQrPreview() {
    const bank = document.getElementById('cfgBankName').value;
    const stk = document.getElementById('cfgBankAccount').value.trim() || '0985421398';
    const holder = (document.getElementById('cfgAccountHolder').value.trim() || 'TIEM HOA OWEN FLEUR').toUpperCase();
    const prefix = document.getElementById('cfgTransferPrefix').value.trim() || 'OWENFLEUR';
    const customImg = document.getElementById('cfgCustomQrImage').value.trim();

    const previewImg = document.getElementById('qrLivePreviewImg');
    const previewInfo = document.getElementById('qrLivePreviewInfo');

    if (customImg) {
      previewImg.src = customImg;
    } else {
      // Use VietQR standard generator
      previewImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(prefix + '_TEST_1000000')}`;
    }

    previewInfo.innerHTML = `
      Ngân hàng: <strong>${bank}</strong><br>
      STK: <strong>${stk}</strong><br>
      Chủ TK: <strong>${holder}</strong>
    `;
  }

  // --------------------------------------------------------------------------
  // 8. PRINTABLE SLIP MODAL
  // --------------------------------------------------------------------------
  function openPrintModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const safeId = typeof escapeHtml === 'function' ? escapeHtml(order.id) : order.id;
    const safeTimeLabel = typeof escapeHtml === 'function' ? escapeHtml(order.deliveryTimeLabel || 'Hỏa tốc') : (order.deliveryTimeLabel || 'Hỏa tốc');
    const safeDate = typeof escapeHtml === 'function' ? escapeHtml(order.deliveryDate || '') : (order.deliveryDate || '');
    const safeRecipientName = typeof escapeHtml === 'function' ? escapeHtml(order.recipientName || '') : (order.recipientName || '');
    const safeRecipientPhone = typeof escapeHtml === 'function' ? escapeHtml(order.recipientPhone || '') : (order.recipientPhone || '');
    const safeAddress = typeof escapeHtml === 'function' ? escapeHtml(order.address || '') : (order.address || '');
    const safeSenderPhone = typeof escapeHtml === 'function' ? escapeHtml(order.senderPhone || '') : (order.senderPhone || '');
    const safeCardMessage = typeof escapeHtml === 'function' ? escapeHtml(order.cardMessage || 'Không có lời nhắn.') : (order.cardMessage || 'Không có lời nhắn.');
    const safePaymentStatus = typeof escapeHtml === 'function' ? escapeHtml(order.paymentStatus || order.paymentMethod || '') : (order.paymentStatus || order.paymentMethod || '');

    const modalContent = document.getElementById('printSlipModalContent');
    modalContent.innerHTML = `
      <div id="printableSlip" style="padding: 24px; font-family: sans-serif; color: #000; background: #fff;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 14px; margin-bottom: 14px;">
          <h2 style="margin: 0; font-size: 1.5rem; text-transform: uppercase;">OWEN FLEUR 🌿</h2>
          <div style="font-size: 0.85rem; font-style: italic;">“Les fleurs racontent ce que le cœur ressent”</div>
          <div style="font-size: 0.82rem; margin-top: 4px;">Hotline: ${state.storeSettings.phone || '0985 421 398'} | ${state.storeSettings.addressHanoi || 'CS1: Đống Đa - Hà Nội'} & ${state.storeSettings.addressHungYen || 'CS2: Văn Giang - Hưng Yên'}</div>
          <h3 style="margin-top: 10px; font-size: 1.15rem; background: #eee; padding: 4px 8px; display: inline-block;">
            PHIẾU GIAO HOA & THIỆP CHÚC MỪNG (${order.isUrgent ? '⚡ HỎA TỐC GẤP' : 'TIÊU CHUẨN'})
          </h3>
        </div>

        <div style="margin-bottom: 12px; font-size: 0.9rem;">
          <div><strong>Mã đơn hàng:</strong> #${safeId}</div>
          <div><strong>Ngày giờ giao hẹn:</strong> <span style="font-size: 1.05rem; font-weight: bold; color: red;">${safeTimeLabel} (${safeDate})</span></div>
          <div><strong>Người nhận:</strong> <span style="font-size: 1.05rem; font-weight: bold;">${safeRecipientName}</span> - SĐT: <strong>${safeRecipientPhone}</strong></div>
          <div><strong>Địa chỉ giao:</strong> <strong>${safeAddress}</strong></div>
          <div><strong>SĐT người đặt (báo đơn):</strong> ${safeSenderPhone}</div>
        </div>

        <div style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 10px 0; margin-bottom: 14px;">
          <strong>Danh sách sản phẩm hoa:</strong>
          <ul style="margin: 6px 0 0 20px;">
            ${order.items.map(it => {
              const safeItemName = typeof escapeHtml === 'function' ? escapeHtml(it.name) : it.name;
              return `<li>${it.quantity}x ${safeItemName} - ${formatCurrency(it.price * it.quantity)}</li>`;
            }).join('')}
          </ul>
          <div style="text-align: right; font-size: 1.1rem; font-weight: bold; margin-top: 8px;">
            Tổng tiền: ${formatCurrency(order.total)} (${safePaymentStatus})
          </div>
        </div>

        <div style="border: 2px solid #333; border-radius: 8px; padding: 14px; margin-bottom: 16px; background: #fffcf8;">
          <div style="font-weight: bold; font-size: 0.95rem; text-transform: uppercase; margin-bottom: 6px;">
            💌 NỘI DUNG GHI TRÊN THIỆP TẶNG (Nét chữ nắn nót, trang trọng):
          </div>
          <div style="font-size: 1.05rem; font-style: italic; line-height: 1.6;">
            "${safeCardMessage}"
          </div>
        </div>

        <div style="font-size: 0.8rem; border-top: 1px dashed #666; padding-top: 8px; display: flex; justify-content: space-between;">
          <div>Florist cắm hoa: .......................</div>
          <div>Shipper giao hàng: .......................</div>
          <div>Chữ ký người nhận: .......................</div>
        </div>

        <div style="text-align: center; margin-top: 24px;" class="no-print">
          <button class="btn-admin btn-admin-primary" onclick="window.print()" style="font-size: 1rem; padding: 12px 28px;">
            🖨️ Tiến Hành In Phiếu Ngay
          </button>
        </div>
      </div>
    `;

    document.getElementById('printSlipModal').classList.add('active');
  }

  const printModalClose = document.getElementById('printSlipModalClose');
  if (printModalClose) {
    printModalClose.addEventListener('click', () => {
      document.getElementById('printSlipModal').classList.remove('active');
    });
  }

  // --------------------------------------------------------------------------
  // 9. TOAST NOTIFICATION
  // --------------------------------------------------------------------------
  function showAdminToast(msg, type = 'info') {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'urgent' ? '#e63946' : type === 'success' ? '#172f23' : '#2c5e43'};
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      animation: slideInToast 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>${type === 'urgent' ? '⚡' : '✨'}</span> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --------------------------------------------------------------------------
  // 11. MULTI-ADMIN AUTHENTICATION & LOGIN / LOGOUT SYSTEM
  // --------------------------------------------------------------------------
  function initAuth() {
    const loginOverlay = document.getElementById('adminLoginOverlay');
    const loginForm = document.getElementById('adminLoginForm');
    const loginUser = document.getElementById('loginUsername');
    const loginPass = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginErrorMsg');
    const logoutBtn = document.getElementById('logoutBtn');
    const rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');

    // Load remembered username if saved
    const rememberedUser = localStorage.getItem('owenfleur_remember_user');
    if (rememberedUser && loginUser) {
      loginUser.value = rememberedUser;
      if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    }

    // Toggle password visibility
    if (togglePasswordBtn && loginPass) {
      togglePasswordBtn.addEventListener('click', () => {
        const isPassword = loginPass.type === 'password';
        loginPass.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = isPassword ? '🔒' : '👁️';
        togglePasswordBtn.setAttribute('title', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      });
    }

    // Check if session exists
    if (state.currentAdmin) {
      updateLoggedInAdminUI();
      if (loginOverlay) loginOverlay.classList.add('hidden');
    } else {
      if (loginOverlay) loginOverlay.classList.remove('hidden');
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = loginUser.value.trim().toLowerCase();
        const password = loginPass.value.trim();

        const found = state.admins.find(a => a.username.toLowerCase() === username && a.password === password);
        if (found) {
          state.currentAdmin = found;
          sessionStorage.setItem('owenfleur_current_admin', JSON.stringify(found));

          // Handle remember me
          if (rememberMeCheckbox && rememberMeCheckbox.checked) {
            localStorage.setItem('owenfleur_current_admin', JSON.stringify(found));
            localStorage.setItem('owenfleur_remember_user', username);
          } else {
            localStorage.removeItem('owenfleur_current_admin');
            localStorage.removeItem('owenfleur_remember_user');
          }

          updateLoggedInAdminUI();
          if (loginOverlay) loginOverlay.classList.add('hidden');
          if (loginError) loginError.style.display = 'none';
          loginPass.value = '';
          if (!rememberMeCheckbox || !rememberMeCheckbox.checked) {
            loginUser.value = '';
          }
          showAdminToast(`Chào mừng ${found.name} (${found.role}) đã đăng nhập!`, 'success');
        } else {
          if (loginError) {
            loginError.textContent = '❌ Sai tên đăng nhập hoặc mật khẩu! Vui lòng thử lại.';
            loginError.style.display = 'block';
          }
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?')) {
          state.currentAdmin = null;
          sessionStorage.removeItem('owenfleur_current_admin');
          localStorage.removeItem('owenfleur_current_admin');
          if (loginOverlay) {
            loginOverlay.classList.remove('hidden');
            if (loginPass) loginPass.value = '';
          }
          showAdminToast('Đã đăng xuất tài khoản thành công.', 'info');
        }
      });
    }
  }

  function updateLoggedInAdminUI() {
    if (!state.currentAdmin) return;
    const cur = state.currentAdmin;
    const avatarEl = document.getElementById('currentUserAvatar');
    const nameEl = document.getElementById('currentUserName');
    const roleEl = document.getElementById('currentUserRole');
    const creatorBadge = document.getElementById('currentAdminNameBadge');
    const navItemAdmins = document.getElementById('navItemAdmins');
    const navItemSettings = document.getElementById('navItemSettings');

    if (avatarEl) avatarEl.textContent = cur.avatar || '👤';
    if (nameEl) nameEl.textContent = cur.name;
    if (roleEl) roleEl.textContent = cur.role;
    if (creatorBadge) creatorBadge.textContent = `${cur.name} (${cur.role})`;

    // Phân quyền bảo mật: Chỉ Tài Khoản Tổng (Master Admin - admin) mới thấy mục Phân Quyền & Cài Đặt
    const isMaster = cur.isMaster || cur.username === 'admin';
    if (navItemAdmins) navItemAdmins.style.display = isMaster ? 'flex' : 'none';
    if (navItemSettings) navItemSettings.style.display = isMaster ? 'flex' : 'none';

    // Nếu tài khoản phụ đang đứng ở tab bị cấm thì chuyển ngay về tab Quản lý đơn hàng
    if (!isMaster && (state.currentTab === 'admins' || state.currentTab === 'settings')) {
      const ordersNav = document.querySelector('[data-tab="orders"]');
      if (ordersNav) ordersNav.click();
    }
  }

  // --------------------------------------------------------------------------
  // 12. ADMIN ACCOUNTS MANAGEMENT (VIEW, ADD, DELETE)
  // --------------------------------------------------------------------------
  function initAdminManagement() {
    const openAddAdminModalBtn = document.getElementById('openAddAdminModalBtn');
    const addAdminModal = document.getElementById('addAdminModal');
    const addAdminModalClose = document.getElementById('addAdminModalClose');
    const addAdminCancelBtn = document.getElementById('addAdminCancelBtn');
    const addAdminForm = document.getElementById('addAdminForm');

    if (openAddAdminModalBtn) {
      openAddAdminModalBtn.addEventListener('click', () => {
        const isMaster = state.currentAdmin && (state.currentAdmin.isMaster || state.currentAdmin.username === 'admin');
        if (!isMaster) {
          alert('⚠️ Chỉ Tài Khoản Tổng mới có quyền tạo thêm tài khoản quản trị!');
          return;
        }
        if (addAdminModal) addAdminModal.classList.add('active');
      });
    }

    const closeAddAdmin = () => {
      if (addAdminModal) addAdminModal.classList.remove('active');
      if (addAdminForm) addAdminForm.reset();
    };

    if (addAdminModalClose) addAdminModalClose.addEventListener('click', closeAddAdmin);
    if (addAdminCancelBtn) addAdminCancelBtn.addEventListener('click', closeAddAdmin);

    if (addAdminForm) {
      addAdminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const isMaster = state.currentAdmin && (state.currentAdmin.isMaster || state.currentAdmin.username === 'admin');
        if (!isMaster) {
          alert('⚠️ Chỉ Tài Khoản Tổng mới có quyền cấp tài khoản mới!');
          return;
        }

        const name = document.getElementById('newAdminName').value.trim();
        const username = document.getElementById('newAdminUsername').value.trim().toLowerCase();
        const password = document.getElementById('newAdminPassword').value.trim();
        const role = document.getElementById('newAdminRole').value;

        if (state.admins.some(a => a.username.toLowerCase() === username)) {
          alert('Tên đăng nhập này đã tồn tại trong hệ thống! Vui lòng chọn tên khác.');
          return;
        }

        let avatar = '👤';
        if (role.includes('Quản lý') || role.includes('Chủ')) avatar = '👑';
        else if (role.includes('Florist') || role.includes('Cắm')) avatar = '🌸';
        else if (role.includes('CSKH') || role.includes('Bán hàng')) avatar = '🎧';
        else if (role.includes('Shipper') || role.includes('Giao')) avatar = '🚚';

        const newAdmin = {
          id: 'adm_' + Date.now(),
          username,
          password,
          name,
          role,
          avatar,
          isMaster: false,
          createdAt: new Date().toISOString().split('T')[0]
        };

        state.admins.push(newAdmin);
        localStorage.setItem('owenfleur_admins', JSON.stringify(state.admins));
        renderAdminsTable();
        closeAddAdmin();
        showAdminToast(`🎉 Đã cấp tài khoản thành công cho nhân sự "${name}" (${username})!`, 'success');
      });
    }
  }

  function renderAdminsTable() {
    const tableBody = document.getElementById('adminsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = state.admins.map(adm => {
      const isRoot = adm.isMaster || adm.username === 'admin';
      let roleClass = 'sales';
      if (isRoot) roleClass = 'owner';
      else if (adm.role && (adm.role.includes('Florist') || adm.role.includes('Cắm'))) roleClass = 'florist';

      const isCurrent = state.currentAdmin && state.currentAdmin.username === adm.username;

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.5rem; width: 40px; height: 40px; border-radius: 50%; background: #edf7f2; display: flex; align-items: center; justify-content: center; border: 1px solid #c2e2d0;">
                ${adm.avatar || '👤'}
              </span>
              <div>
                <strong style="color: var(--admin-primary); font-size: 0.95rem;">${adm.name}</strong>
                ${isRoot ? '<span style="font-size: 0.72rem; color: #b45309; font-weight: 800; margin-left: 6px; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">👑 TÀI KHOẢN TỔNG</span>' : ''}
                ${isCurrent ? '<span style="font-size: 0.72rem; color: #2a9d8f; font-weight: 800; margin-left: 6px; background: #e6f4ea; padding: 2px 6px; border-radius: 4px;">(Bạn đang đăng nhập)</span>' : ''}
              </div>
            </div>
          </td>
          <td>
            <code style="background: #eef2f0; padding: 4px 10px; border-radius: 6px; font-weight: 700; color: #172f23; font-size: 0.88rem;">${adm.username}</code>
          </td>
          <td>
            <span style="font-family: monospace; letter-spacing: 2px; color: #777;">••••••••</span>
            <span style="font-size: 0.78rem; color: var(--admin-muted); margin-left: 6px;">(${adm.password})</span>
          </td>
          <td>
            <span class="role-badge ${roleClass}">${adm.role}</span>
          </td>
          <td style="font-size: 0.85rem; color: var(--admin-muted);">${adm.createdAt || 'Mặc định'}</td>
          <td>
            ${isRoot ? `
              <span style="font-size: 0.8rem; color: var(--admin-muted); font-style: italic;">Quản trị tối cao (Không thể xóa)</span>
            ` : `
              <button class="btn-admin" style="padding: 6px 12px; font-size: 0.8rem; background: #fee2e2; color: #991b1b;" onclick="deleteAdminById('${adm.id}')">
                🗑️ Xóa Tài Khoản
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  window.deleteAdminById = function(adminId) {
    const isMaster = state.currentAdmin && (state.currentAdmin.isMaster || state.currentAdmin.username === 'admin');
    if (!isMaster) {
      alert('⚠️ Chỉ Tài Khoản Tổng mới có quyền xóa tài khoản nhân sự!');
      return;
    }
    const adm = state.admins.find(a => a.id === adminId);
    if (!adm) return;
    if (adm.isMaster || adm.username === 'admin') {
      alert('Không thể xóa Tài Khoản Tổng của hệ thống!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản của "${adm.name}" (${adm.username}) khỏi hệ thống?`)) {
      state.admins = state.admins.filter(a => a.id !== adminId);
      localStorage.setItem('owenfleur_admins', JSON.stringify(state.admins));
      renderAdminsTable();
      showAdminToast(`Đã xóa tài khoản "${adm.name}"`, 'info');
    }
  };

  // --------------------------------------------------------------------------
  // 13. MANUAL ORDER CREATION BY ADMIN (HOTLINE / QUẦY / SOCIAL)
  // --------------------------------------------------------------------------
  function initManualOrderCreation() {
    const openManualOrderModalBtn = document.getElementById('openManualOrderModalBtn');
    const manualOrderModal = document.getElementById('manualOrderModal');
    const manualOrderModalClose = document.getElementById('manualOrderModalClose');
    const moCancelBtn = document.getElementById('moCancelBtn');
    const manualOrderForm = document.getElementById('manualOrderForm');
    const moAddItemBtn = document.getElementById('moAddItemBtn');
    const moItemsList = document.getElementById('moItemsList');
    const moDeliveryDate = document.getElementById('moDeliveryDate');
    const moShippingFee = document.getElementById('moShippingFee');
    const moSubtotalDisplay = document.getElementById('moSubtotalDisplay');
    const moTotalDisplay = document.getElementById('moTotalDisplay');
    const moDeliveryTime = document.getElementById('moDeliveryTime');
    const moIsUrgent = document.getElementById('moIsUrgent');

    // Default to today
    if (moDeliveryDate) {
      moDeliveryDate.value = new Date().toISOString().split('T')[0];
    }

    if (openManualOrderModalBtn) {
      openManualOrderModalBtn.addEventListener('click', () => {
        updateLoggedInAdminUI();
        if (moItemsList) {
          moItemsList.innerHTML = '';
          addManualOrderItemRow();
          calculateManualOrderTotals();
        }
        if (manualOrderModal) manualOrderModal.classList.add('active');
      });
    }

    const closeManualOrder = () => {
      if (manualOrderModal) manualOrderModal.classList.remove('active');
    };

    if (manualOrderModalClose) manualOrderModalClose.addEventListener('click', closeManualOrder);
    if (moCancelBtn) moCancelBtn.addEventListener('click', closeManualOrder);

    if (moAddItemBtn) {
      moAddItemBtn.addEventListener('click', () => {
        addManualOrderItemRow();
        calculateManualOrderTotals();
      });
    }

    // Auto toggle urgent checkbox when ASAP is selected
    if (moDeliveryTime && moIsUrgent) {
      moDeliveryTime.addEventListener('change', () => {
        if (moDeliveryTime.value === 'asap') {
          moIsUrgent.checked = true;
        }
      });
      moIsUrgent.addEventListener('change', () => {
        if (moIsUrgent.checked && moDeliveryTime.value !== 'asap') {
          moDeliveryTime.value = 'asap';
        }
      });
    }

    if (moShippingFee) {
      moShippingFee.addEventListener('input', calculateManualOrderTotals);
    }

    function addManualOrderItemRow() {
      if (!moItemsList) return;
      const row = document.createElement('div');
      row.className = 'manual-order-item-row';

      const optionsHtml = state.products.map(p => `
        <option value="${p.name}" data-price="${p.price}">
          ${p.name} - ${formatCurrency(p.price)}
        </option>
      `).join('');

      row.innerHTML = `
        <select class="mo-item-product" required>
          ${optionsHtml}
        </select>
        <input type="number" class="mo-item-qty" value="1" min="1" max="99" required title="Số lượng">
        <div class="item-price-preview">0₫</div>
        <button type="button" class="btn-remove-item" title="Xóa hoa này">&times;</button>
      `;

      const sel = row.querySelector('.mo-item-product');
      const qty = row.querySelector('.mo-item-qty');
      const pricePreview = row.querySelector('.item-price-preview');
      const removeBtn = row.querySelector('.btn-remove-item');

      const updateRowPrice = () => {
        const selectedOption = sel.options[sel.selectedIndex];
        const unitPrice = selectedOption ? parseInt(selectedOption.getAttribute('data-price') || 0, 10) : 0;
        const q = parseInt(qty.value || 1, 10);
        pricePreview.textContent = formatCurrency(unitPrice * q);
        calculateManualOrderTotals();
      };

      sel.addEventListener('change', updateRowPrice);
      qty.addEventListener('input', updateRowPrice);

      removeBtn.addEventListener('click', () => {
        if (moItemsList.children.length > 1) {
          row.remove();
          calculateManualOrderTotals();
        } else {
          showAdminToast('Đơn hàng cần có ít nhất 1 mẫu hoa!', 'urgent');
        }
      });

      moItemsList.appendChild(row);
      updateRowPrice();
    }

    function calculateManualOrderTotals() {
      let subtotal = 0;
      if (moItemsList) {
        const rows = moItemsList.querySelectorAll('.manual-order-item-row');
        rows.forEach(row => {
          const sel = row.querySelector('.mo-item-product');
          const qty = row.querySelector('.mo-item-qty');
          if (sel && qty) {
            const selectedOption = sel.options[sel.selectedIndex];
            const unitPrice = selectedOption ? parseInt(selectedOption.getAttribute('data-price') || 0, 10) : 0;
            const q = parseInt(qty.value || 1, 10);
            subtotal += (unitPrice * q);
          }
        });
      }

      const shippingFee = parseInt((moShippingFee && moShippingFee.value) || 0, 10);
      const total = subtotal + shippingFee;

      if (moSubtotalDisplay) moSubtotalDisplay.textContent = formatCurrency(subtotal);
      if (moTotalDisplay) moTotalDisplay.textContent = formatCurrency(total);
      return { subtotal, shippingFee, total };
    }

    if (manualOrderForm) {
      manualOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const { subtotal, shippingFee, total } = calculateManualOrderTotals();

        const items = [];
        const rows = moItemsList.querySelectorAll('.manual-order-item-row');
        rows.forEach(row => {
          const sel = row.querySelector('.mo-item-product');
          const qty = row.querySelector('.mo-item-qty');
          const selectedOption = sel.options[sel.selectedIndex];
          const unitPrice = selectedOption ? parseInt(selectedOption.getAttribute('data-price') || 0, 10) : 0;
          const q = parseInt(qty.value || 1, 10);
          items.push({
            name: sel.value,
            quantity: q,
            price: unitPrice
          });
        });

        if (shippingFee > 0) {
          items.push({
            name: 'Phí giao hàng',
            quantity: 1,
            price: shippingFee
          });
        }

        const sourceMap = {
          store: 'Tại quầy tiệm',
          hotline: 'Hotline điện thoại',
          facebook: 'Fanpage Facebook',
          tiktok: 'TikTok Shop',
          zalo: 'Zalo'
        };

        const timeLabelMap = {
          asap: '⚡ Hỏa Tốc Trong 2 Giờ (Gấp)',
          morning: 'Buổi Sáng (08:00 - 11:30)',
          noon: 'Buổi Trưa (11:30 - 14:00)',
          afternoon: 'Buổi Chiều (14:00 - 17:30)',
          evening: 'Buổi Tối (17:30 - 20:30)'
        };

        const newId = 'FLR-' + Math.floor(10000 + Math.random() * 90000);
        const sourceVal = document.getElementById('moSource').value;
        const timeVal = document.getElementById('moDeliveryTime').value;
        const isUrgentVal = document.getElementById('moIsUrgent').checked;
        const creatorName = state.currentAdmin ? state.currentAdmin.name : 'Admin';

        const newOrder = {
          id: newId,
          createdAt: new Date().toISOString(),
          recipientName: document.getElementById('moRecipientName').value.trim(),
          recipientPhone: document.getElementById('moRecipientPhone').value.trim(),
          senderPhone: document.getElementById('moSenderPhone').value.trim() || document.getElementById('moRecipientPhone').value.trim(),
          address: document.getElementById('moAddress').value.trim(),
          deliveryDate: document.getElementById('moDeliveryDate').value,
          deliveryTime: timeVal,
          deliveryTimeLabel: timeLabelMap[timeVal] || 'Tiêu chuẩn',
          items: items,
          total: total,
          paymentMethod: document.getElementById('moPaymentMethod').value,
          paymentStatus: document.getElementById('moPaymentStatus').value,
          cardMessage: document.getElementById('moCardMessage').value.trim(),
          status: document.getElementById('moInitialStatus').value,
          isUrgent: isUrgentVal,
          floristNotes: (document.getElementById('moFloristNotes').value.trim() ? document.getElementById('moFloristNotes').value.trim() + ' | ' : '') + `[Đơn tạo bởi: ${creatorName} - Kênh: ${sourceMap[sourceVal] || sourceVal}]`
        };

        state.orders.unshift(newOrder);
        saveOrders();
        if (window.OwenCloud && OwenCloud.saveOrder) {
          OwenCloud.saveOrder(newOrder);
        }
        updateMetrics();
        renderOrders();
        renderCustomersTable();
        closeManualOrder();
        manualOrderForm.reset();

        showAdminToast(`🎉 Đã tạo đơn hàng mới #${newId} thành công cho khách ${newOrder.recipientName}!`, 'success');

        // Optional prompt to print delivery slip immediately
        setTimeout(() => {
          if (confirm(`Đơn hàng #${newId} đã được tạo thành công! Bạn có muốn mở Phiếu Giao Hoa & Thiệp chúc mừng để in ngay không?`)) {
            openPrintModal(newId);
          }
        }, 300);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 15. CLOUD DATABASE SYNC & REALTIME SUBSCRIPTION (SUPABASE)
  // --------------------------------------------------------------------------
  function initCloudSync() {
    const cfgSupabaseUrl = document.getElementById('cfgSupabaseUrl');
    const cfgSupabaseKey = document.getElementById('cfgSupabaseKey');
    const btnTestCloud = document.getElementById('btnTestCloudConnection');
    const btnSaveCloud = document.getElementById('btnSaveCloudConfig');
    const btnToggleSql = document.getElementById('btnToggleSqlGuide');
    const sqlGuideBox = document.getElementById('sqlSetupGuide');
    const sqlCodeBlock = document.getElementById('sqlCodeBlock');
    const btnCopySql = document.getElementById('btnCopySql');
    const cloudStatusBadge = document.getElementById('cloudStatusBadge');

    if (!window.OwenCloud) return;

    // Load current config
    const curCfg = OwenCloud.getConfig();
    if (cfgSupabaseUrl) cfgSupabaseUrl.value = curCfg.url || '';
    if (cfgSupabaseKey) cfgSupabaseKey.value = curCfg.key || '';
    if (sqlCodeBlock) sqlCodeBlock.value = OwenCloud.getSchemaSQL();

    function updateBadge(status, text) {
      if (!cloudStatusBadge) return;
      if (status === 'connected') {
        cloudStatusBadge.style.background = '#e8f5e9';
        cloudStatusBadge.style.color = '#2e7d32';
        cloudStatusBadge.textContent = '🟢 ' + text;
      } else if (status === 'testing') {
        cloudStatusBadge.style.background = '#fff8e1';
        cloudStatusBadge.style.color = '#f57f17';
        cloudStatusBadge.textContent = '🟡 ' + text;
      } else {
        cloudStatusBadge.style.background = '#ffebee';
        cloudStatusBadge.style.color = '#c62828';
        cloudStatusBadge.textContent = '🔴 ' + text;
      }
    }

    if (curCfg.url && curCfg.key) {
      updateBadge('connected', 'Đã lưu cấu hình Supabase Cloud');
    } else {
      updateBadge('disconnected', 'Đang dùng LocalStorage (Chưa kết nối Cloud)');
    }

    if (btnToggleSql && sqlGuideBox) {
      btnToggleSql.addEventListener('click', () => {
        const isHidden = sqlGuideBox.style.display === 'none';
        sqlGuideBox.style.display = isHidden ? 'block' : 'none';
        btnToggleSql.textContent = isHidden ? 'Ẩn Hướng Dẫn & Mã SQL' : '📖 Xem Câu Lệnh SQL Tạo Bảng (Chỉ cần chạy 1 lần)';
      });
    }

    if (btnCopySql && sqlCodeBlock) {
      btnCopySql.addEventListener('click', () => {
        sqlCodeBlock.select();
        navigator.clipboard.writeText(sqlCodeBlock.value).then(() => {
          showAdminToast('📋 Đã sao chép toàn bộ mã SQL vào bộ nhớ tạm! Hãy paste vào SQL Editor trên Supabase.', 'success');
        }).catch(() => {
          document.execCommand('copy');
          showAdminToast('📋 Đã sao chép mã SQL!', 'success');
        });
      });
    }

    if (btnTestCloud) {
      btnTestCloud.addEventListener('click', async () => {
        const url = cfgSupabaseUrl ? cfgSupabaseUrl.value.trim() : '';
        const key = cfgSupabaseKey ? cfgSupabaseKey.value.trim() : '';
        if (!url || !key) {
          showAdminToast('⚠️ Vui lòng nhập đầy đủ Supabase Project URL và Public Anon Key!', 'urgent');
          return;
        }

        updateBadge('testing', 'Đang kiểm tra kết nối Cloud...');
        OwenCloud.saveConfig(url, key);
        const result = await OwenCloud.testConnection();
        if (result.success) {
          updateBadge('connected', 'Kết Nối Thành Công (Cloud Online)');
          showAdminToast('🎉 ' + result.message, 'success');
        } else {
          updateBadge('disconnected', 'Lỗi Kết Nối');
          showAdminToast('❌ ' + result.message, 'urgent');
        }
      });
    }

    if (btnSaveCloud) {
      btnSaveCloud.addEventListener('click', async () => {
        const url = cfgSupabaseUrl ? cfgSupabaseUrl.value.trim() : '';
        const key = cfgSupabaseKey ? cfgSupabaseKey.value.trim() : '';
        OwenCloud.saveConfig(url, key);
        showAdminToast('💾 Đã lưu thông tin cấu hình Cloud Database!', 'success');

        if (url && key) {
          updateBadge('testing', 'Đang tải đơn hàng từ Cloud...');
          const cloudOrders = await OwenCloud.fetchOrders();
          if (cloudOrders && cloudOrders.length > 0) {
            state.orders = cloudOrders;
            saveOrders();
            updateMetrics();
            renderOrders();
            renderCustomersTable();
            showAdminToast(`📥 Đã đồng bộ ${cloudOrders.length} đơn hàng từ Cloud Supabase!`, 'success');
          }
          updateBadge('connected', 'Đang Trực Tuyến & Đồng Bộ');
        } else {
          updateBadge('disconnected', 'Đang dùng LocalStorage');
        }
      });
    }

    // Load initial orders from Cloud if configured
    if (curCfg.url && curCfg.key) {
      OwenCloud.fetchOrders().then(cloudOrders => {
        if (cloudOrders && cloudOrders.length > 0) {
          state.orders = cloudOrders;
          saveOrders();
          updateMetrics();
          renderOrders();
          renderCustomersTable();
        }
      });
    }

    // Subscribe to realtime orders from internet buyers
    OwenCloud.subscribeToOrders((incomingOrder) => {
      const exists = state.orders.find(o => o.id === incomingOrder.id);
      if (!exists) {
        state.orders.unshift(incomingOrder);
        saveOrders();
        updateMetrics();
        renderOrders();
        renderCustomersTable();
        if (window.playOrderNotificationSound) {
          window.playOrderNotificationSound();
        }
        showAdminToast(`🔔 ĐƠN HÀNG MỚI TỪ INTERNET #${incomingOrder.id}: ${incomingOrder.recipientName} (${formatCurrency(incomingOrder.total)})!`, 'urgent');
      } else {
        Object.assign(exists, incomingOrder);
        saveOrders();
        updateMetrics();
        renderOrders();
        renderCustomersTable();
      }
    });

    // Instant cross-tab localStorage event listener (multi-tab sync without page reload)
    window.addEventListener('storage', (e) => {
      if (e.key === 'owenfleur_orders') {
        try {
          const freshOrders = JSON.parse(e.newValue || '[]');
          if (Array.isArray(freshOrders)) {
            const hadIds = new Set(state.orders.map(o => o.id));
            const newOrders = freshOrders.filter(o => !hadIds.has(o.id));

            state.orders = freshOrders;
            updateMetrics();
            renderOrders();
            renderCustomersTable();

            if (newOrders.length > 0) {
              if (window.playOrderNotificationSound) {
                window.playOrderNotificationSound();
              }
              const latest = newOrders[0];
              showAdminToast(`🔔 ĐƠN HÀNG MỚI VỪA ĐẶT #${latest.id}: ${latest.recipientName} (${formatCurrency(latest.total)})!`, 'urgent');
            }
          }
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      } else if (e.key === 'owenfleur_builder_options') {
        try {
          const fresh = JSON.parse(e.newValue || '{}');
          if (fresh && fresh.mainFlowers) {
            state.builderOptions = fresh;
            if (state.currentTab === 'builder') {
              renderBuilderTable();
            }
          }
        } catch (err) {}
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. Custom Bouquet Builder Management
  // --------------------------------------------------------------------------
  function initBuilderManagement() {
    const subtabButtons = document.querySelectorAll('.builder-subtab-btn');
    const baseFeeInput = document.getElementById('cfgBuilderBaseFee');
    const saveBaseFeeBtn = document.getElementById('btnSaveBuilderBaseFee');
    const openAddBtn = document.getElementById('btnOpenAddBuilderOptionModal');
    const resetDefaultsBtn = document.getElementById('btnResetBuilderDefaults');

    const modal = document.getElementById('builderOptionModal');
    const modalClose = document.getElementById('builderOptionModalClose');
    const modalCancel = document.getElementById('builderOptionModalCancel');
    const form = document.getElementById('builderOptionForm');

    const optIdInput = document.getElementById('builderOptionId');
    const categorySelect = document.getElementById('builderOptionCategory');
    const nameInput = document.getElementById('builderOptionName');
    const priceInput = document.getElementById('builderOptionPrice');
    const descInput = document.getElementById('builderOptionDesc');
    const visualInput = document.getElementById('builderOptionVisual');
    const uploadFileInput = document.getElementById('builderOptionUploadFile');
    const colorPicker = document.getElementById('builderOptionColorPicker');
    const colorCodeInput = document.getElementById('builderOptionColorCode');

    const groupPrice = document.getElementById('groupBuilderOptionPrice');
    const groupDesc = document.getElementById('groupBuilderOptionDesc');
    const groupVisual = document.getElementById('groupBuilderOptionVisual');
    const groupColor = document.getElementById('groupBuilderOptionColor');

    const modalTitle = document.getElementById('builderOptionModalTitle');
    const previewVisual = document.getElementById('builderModalPreviewVisual');
    const previewName = document.getElementById('builderModalPreviewName');
    const previewSub = document.getElementById('builderModalPreviewSub');

    // Subtab switching
    subtabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const subtab = btn.getAttribute('data-subtab');
        state.currentBuilderSubtab = subtab;
        subtabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderBuilderTable();
      });
    });

    // Save Base Craft Fee
    if (saveBaseFeeBtn && baseFeeInput) {
      saveBaseFeeBtn.addEventListener('click', () => {
        const fee = Math.max(0, parseInt(baseFeeInput.value, 10) || 0);
        state.builderOptions.baseCraftFee = fee;
        saveBuilderOptions();
        showAdminToast(`✂️ Đã cập nhật Phí công cắm nghệ thuật: ${formatCurrency(fee)}!`);
      });
    }

    // Reset Defaults
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn khôi phục danh mục Tự Phối Hoa về cấu hình gốc mặc định không? Mọi tùy chỉnh riêng sẽ được làm mới.')) {
          const defaultOpts = (typeof FLOWER_DATA !== 'undefined' && FLOWER_DATA.customBouquetOptions)
            ? JSON.parse(JSON.stringify(FLOWER_DATA.customBouquetOptions))
            : {};
          state.builderOptions = {
            mainFlowers: defaultOpts.mainFlowers || [],
            accentFlowers: defaultOpts.accentFlowers || [],
            wrappers: defaultOpts.wrappers || [],
            ribbons: defaultOpts.ribbons || [],
            baseCraftFee: (defaultOpts && typeof defaultOpts.baseCraftFee === 'number') ? defaultOpts.baseCraftFee : 50000
          };
          saveBuilderOptions();
          renderBuilderTable();
          showAdminToast('🔄 Đã khôi phục danh mục hoa phối về mặc định của tiệm!');
        }
      });
    }

    // Modal Field Toggling
    function updateModalFieldsByCategory(cat) {
      if (cat === 'mainFlowers') {
        if (groupPrice) groupPrice.style.display = 'block';
        if (groupDesc) groupDesc.style.display = 'block';
        if (groupVisual) groupVisual.style.display = 'block';
        if (groupColor) groupColor.style.display = 'none';
      } else if (cat === 'accentFlowers') {
        if (groupPrice) groupPrice.style.display = 'block';
        if (groupDesc) groupDesc.style.display = 'block';
        if (groupVisual) groupVisual.style.display = 'none';
        if (groupColor) groupColor.style.display = 'none';
      } else if (cat === 'wrappers') {
        if (groupPrice) groupPrice.style.display = 'block';
        if (groupDesc) groupDesc.style.display = 'none';
        if (groupVisual) groupVisual.style.display = 'block';
        if (groupColor) groupColor.style.display = 'none';
      } else if (cat === 'ribbons') {
        if (groupPrice) groupPrice.style.display = 'none';
        if (groupDesc) groupDesc.style.display = 'none';
        if (groupVisual) groupVisual.style.display = 'none';
        if (groupColor) groupColor.style.display = 'block';
      }
      updateModalLivePreview();
    }

    function updateModalLivePreview() {
      const cat = categorySelect ? categorySelect.value : 'mainFlowers';
      const name = nameInput ? (nameInput.value.trim() || 'Tên tùy chọn') : '';
      const price = priceInput ? (parseInt(priceInput.value, 10) || 0) : 0;
      const desc = descInput ? descInput.value.trim() : '';
      const visual = visualInput ? visualInput.value.trim() : '';
      const color = colorCodeInput ? colorCodeInput.value.trim() : '#F4A6B8';

      if (previewName) previewName.textContent = name;

      if (previewVisual) {
        if (cat === 'ribbons') {
          previewVisual.innerHTML = `<span class="builder-swatch-circle" style="background-color: ${color}; width: 28px; height: 28px;"></span>`;
        } else if (visual && (visual.startsWith('http') || visual.startsWith('data:'))) {
          previewVisual.innerHTML = `<img src="${visual}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
          previewVisual.textContent = visual || (cat === 'mainFlowers' ? '🌸' : (cat === 'wrappers' ? '🎀' : '✨'));
        }
      }

      if (previewSub) {
        if (cat === 'ribbons') {
          previewSub.textContent = `Nơ lụa mềm mại • Mã màu ${color}`;
        } else {
          const priceText = price > 0 ? `+ ${formatCurrency(price)}` : 'Miễn phí';
          previewSub.textContent = desc ? `${priceText} • ${desc}` : priceText;
        }
      }
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        updateModalFieldsByCategory(categorySelect.value);
      });
    }

    [nameInput, priceInput, descInput, visualInput].forEach(el => {
      if (el) el.addEventListener('input', updateModalLivePreview);
    });

    if (colorPicker && colorCodeInput) {
      colorPicker.addEventListener('input', (e) => {
        colorCodeInput.value = e.target.value.toUpperCase();
        updateModalLivePreview();
      });
      colorCodeInput.addEventListener('input', (e) => {
        colorPicker.value = e.target.value;
        updateModalLivePreview();
      });
    }

    // Image Upload Compression for Visual
    if (uploadFileInput) {
      uploadFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          showAdminToast('⏳ Đang tối ưu & nén ảnh...');
          const compressed = await resizeAndCompressImage(file, 400, 400, 0.85);
          if (visualInput) {
            visualInput.value = compressed;
            updateModalLivePreview();
          }
          showAdminToast('✅ Đã tải ảnh minh họa thành công!');
        } catch (err) {
          console.error('Builder image compress error:', err);
          alert('Không thể nén ảnh, vui lòng thử lại bằng ảnh định dạng JPG/PNG khác.');
        }
      });
    }

    // Open Add Modal
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        if (modalTitle) modalTitle.textContent = '➕ Thêm Tùy Chọn Mới Cho Bó Hoa';
        if (optIdInput) optIdInput.value = '';
        if (categorySelect) categorySelect.value = state.currentBuilderSubtab || 'mainFlowers';
        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '50000';
        if (descInput) descInput.value = '';
        if (visualInput) visualInput.value = state.currentBuilderSubtab === 'mainFlowers' ? '🌸' : '🎀';
        if (colorPicker) colorPicker.value = '#F4A6B8';
        if (colorCodeInput) colorCodeInput.value = '#F4A6B8';

        updateModalFieldsByCategory(categorySelect ? categorySelect.value : 'mainFlowers');
        if (modal) modal.classList.add('active');
        if (nameInput) nameInput.focus();
      });
    }

    // Close Modal
    function closeModal() {
      if (modal) modal.classList.remove('active');
    }
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Form Submit (Save / Edit)
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cat = categorySelect.value;
        const id = optIdInput.value.trim();
        const name = nameInput.value.trim();
        const price = Math.max(0, parseInt(priceInput.value, 10) || 0);
        const desc = descInput ? descInput.value.trim() : '';
        const visual = visualInput ? visualInput.value.trim() : '';
        const color = colorCodeInput ? colorCodeInput.value.trim().toUpperCase() : '#F4A6B8';

        if (!name) {
          alert('Vui lòng nhập tên tùy chọn!');
          return;
        }

        if (!Array.isArray(state.builderOptions[cat])) {
          state.builderOptions[cat] = [];
        }

        const list = state.builderOptions[cat];

        if (id) {
          // Edit existing
          const item = list.find(x => x.id === id);
          if (item) {
            item.name = name;
            if (cat === 'ribbons') {
              item.code = color;
            } else if (cat === 'mainFlowers') {
              item.price = price;
              item.desc = desc;
              item.img = visual || '🌸';
            } else if (cat === 'accentFlowers') {
              item.price = price;
              item.desc = desc;
            } else if (cat === 'wrappers') {
              item.price = price;
              item.preview = visual || '🎀';
            }
          }
        } else {
          // Create new
          const newId = `${cat.slice(0, 4)}_${Date.now()}`;
          const newItem = { id: newId, name: name };
          if (cat === 'ribbons') {
            newItem.code = color;
          } else if (cat === 'mainFlowers') {
            newItem.price = price;
            newItem.desc = desc;
            newItem.img = visual || '🌸';
          } else if (cat === 'accentFlowers') {
            newItem.price = price;
            newItem.desc = desc;
          } else if (cat === 'wrappers') {
            newItem.price = price;
            newItem.preview = visual || '🎀';
          }
          list.push(newItem);
        }

        saveBuilderOptions();
        closeModal();
        state.currentBuilderSubtab = cat;
        // sync active subtab button
        subtabButtons.forEach(b => {
          if (b.getAttribute('data-subtab') === cat) b.classList.add('active');
          else b.classList.remove('active');
        });
        renderBuilderTable();
        showAdminToast(`🌸 Đã lưu tùy chọn "${name}" thành công!`);
      });
    }
  }

  function saveBuilderOptions() {
    try {
      localStorage.setItem('owenfleur_builder_options', JSON.stringify(state.builderOptions));
    } catch (e) {
      console.error('Storage error while saving builder options:', e);
      alert('Bộ nhớ trình duyệt đầy, vui lòng sử dụng ảnh có dung lượng nhỏ hơn.');
    }
  }

  function renderBuilderTable() {
    const opts = state.builderOptions;
    if (!opts) return;

    // Update Badges
    const badgeMain = document.getElementById('badgeMainFlowers');
    const badgeAccent = document.getElementById('badgeAccentFlowers');
    const badgeWrap = document.getElementById('badgeWrappers');
    const badgeRib = document.getElementById('badgeRibbons');

    if (badgeMain) badgeMain.textContent = (opts.mainFlowers || []).length;
    if (badgeAccent) badgeAccent.textContent = (opts.accentFlowers || []).length;
    if (badgeWrap) badgeWrap.textContent = (opts.wrappers || []).length;
    if (badgeRib) badgeRib.textContent = (opts.ribbons || []).length;

    // Sync Base Craft Fee Input
    const baseFeeInput = document.getElementById('cfgBuilderBaseFee');
    if (baseFeeInput && typeof opts.baseCraftFee === 'number') {
      baseFeeInput.value = opts.baseCraftFee;
    }

    const subtab = state.currentBuilderSubtab || 'mainFlowers';
    const descEl = document.getElementById('builderSubtabDescription');
    const thead = document.getElementById('builderTableHead');
    const tbody = document.getElementById('builderTableBody');

    if (!thead || !tbody) return;

    if (subtab === 'mainFlowers') {
      if (descEl) descEl.textContent = 'Danh sách các loại hoa sáp khách có thể chọn làm hoa chủ đạo (Hoa chính định hình phong cách bó hoa).';
      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">Minh Họa</th>
          <th>Tên Mẫu Hoa Sáp</th>
          <th>Giá Tiền Bán</th>
          <th>Mô Tả Quy Cách (Số cành/bông)</th>
          <th style="width: 150px; text-align: center;">Thao Tác</th>
        </tr>
      `;
      const list = opts.mainFlowers || [];
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 28px; color: var(--admin-muted);">Chưa có loại hoa chủ đạo nào. Hãy bấm "+ Thêm Tùy Chọn Mới" để tạo.</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => {
          const isImgUrl = item.img && (item.img.startsWith('http') || item.img.startsWith('data:'));
          const visualHtml = isImgUrl 
            ? `<div class="builder-visual-chip"><img src="${item.img}" alt="${item.name}"></div>`
            : `<div class="builder-visual-chip">${item.img || '🌹'}</div>`;

          return `
            <tr>
              <td>${visualHtml}</td>
              <td><strong style="color: var(--admin-primary);">${item.name}</strong></td>
              <td><span style="font-weight: 700; color: #166534;">+ ${formatCurrency(item.price)}</span></td>
              <td style="color: var(--admin-muted); font-size: 0.85rem;">${item.desc || '—'}</td>
              <td style="text-align: center;">
                <button type="button" class="btn-admin btn-admin-outline" onclick="editBuilderItem('mainFlowers', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 4px;">✏️ Sửa</button>
                <button type="button" class="btn-admin btn-admin-outline" onclick="deleteBuilderItem('mainFlowers', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5;">🗑️</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } else if (subtab === 'accentFlowers') {
      if (descEl) descEl.textContent = 'Phụ kiện trang trí thêm (Vương miện LED, gấu bông mini, cành hoa baby khô vĩnh cửu...) giúp bó hoa lộng lẫy hơn.';
      thead.innerHTML = `
        <tr>
          <th>Tên Phụ Kiện / Quà Tặng Kèm</th>
          <th>Giá Tiền Cộng Thêm</th>
          <th>Mô Tả Chi Tiết</th>
          <th style="width: 150px; text-align: center;">Thao Tác</th>
        </tr>
      `;
      const list = opts.accentFlowers || [];
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 28px; color: var(--admin-muted);">Chưa có phụ kiện nào.</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => `
          <tr>
            <td><strong style="color: var(--admin-primary);">${item.name}</strong></td>
            <td>
              ${item.price > 0 
                ? `<span style="font-weight: 700; color: #166534;">+ ${formatCurrency(item.price)}</span>` 
                : `<span style="display:inline-block; padding: 2px 8px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.78rem;">Miễn Phí</span>`}
            </td>
            <td style="color: var(--admin-muted); font-size: 0.85rem;">${item.desc || '—'}</td>
            <td style="text-align: center;">
              <button type="button" class="btn-admin btn-admin-outline" onclick="editBuilderItem('accentFlowers', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 4px;">✏️ Sửa</button>
              <button type="button" class="btn-admin btn-admin-outline" onclick="deleteBuilderItem('accentFlowers', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5;">🗑️</button>
            </td>
          </tr>
        `).join('');
      }
    } else if (subtab === 'wrappers') {
      if (descEl) descEl.textContent = 'Các chất liệu và kiểu dáng bọc hoa: Giấy mờ chống thấm Hàn Quốc, giấy xi măng Kraft vintage, hoặc hộp mica trong suốt sang trọng.';
      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">Minh Họa</th>
          <th>Phong Cách Giấy Gói / Hộp Mica</th>
          <th>Giá Tiền</th>
          <th style="width: 150px; text-align: center;">Thao Tác</th>
        </tr>
      `;
      const list = opts.wrappers || [];
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 28px; color: var(--admin-muted);">Chưa có mẫu giấy gói nào.</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => {
          const isImgUrl = item.preview && (item.preview.startsWith('http') || item.preview.startsWith('data:'));
          const visualHtml = isImgUrl 
            ? `<div class="builder-visual-chip"><img src="${item.preview}" alt="${item.name}"></div>`
            : `<div class="builder-visual-chip">${item.preview || '🎀'}</div>`;

          return `
            <tr>
              <td>${visualHtml}</td>
              <td><strong style="color: var(--admin-primary);">${item.name}</strong></td>
              <td><span style="font-weight: 700; color: #166534;">+ ${formatCurrency(item.price)}</span></td>
              <td style="text-align: center;">
                <button type="button" class="btn-admin btn-admin-outline" onclick="editBuilderItem('wrappers', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 4px;">✏️ Sửa</button>
                <button type="button" class="btn-admin btn-admin-outline" onclick="deleteBuilderItem('wrappers', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5;">🗑️</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } else if (subtab === 'ribbons') {
      if (descEl) descEl.textContent = 'Màu sắc nơ ruy băng lụa cao cấp thắt nơ hoàn thiện bó hoa (Pastel, Đỏ bordeaux, Xanh rêu, Vàng champagne...).';
      thead.innerHTML = `
        <tr>
          <th style="width: 70px;">Màu Nơ</th>
          <th>Tên Màu Ruy Băng Lụa</th>
          <th>Mã Màu (Hex Code)</th>
          <th style="width: 150px; text-align: center;">Thao Tác</th>
        </tr>
      `;
      const list = opts.ribbons || [];
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 28px; color: var(--admin-muted);">Chưa có màu nơ ruy băng nào.</td></tr>`;
      } else {
        tbody.innerHTML = list.map(item => `
          <tr>
            <td>
              <span class="builder-swatch-circle" style="background-color: ${item.code || '#F4A6B8'};"></span>
            </td>
            <td><strong style="color: var(--admin-primary);">${item.name}</strong></td>
            <td><code style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 700; color: #334155;">${item.code || '#F4A6B8'}</code></td>
            <td style="text-align: center;">
              <button type="button" class="btn-admin btn-admin-outline" onclick="editBuilderItem('ribbons', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 4px;">✏️ Sửa</button>
              <button type="button" class="btn-admin btn-admin-outline" onclick="deleteBuilderItem('ribbons', '${item.id}')" style="padding: 5px 10px; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5;">🗑️</button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  // Global Helpers for onclick edit and delete
  window.editBuilderItem = function(category, id) {
    const list = state.builderOptions[category] || [];
    const item = list.find(x => x.id === id);
    if (!item) return;

    const modal = document.getElementById('builderOptionModal');
    const modalTitle = document.getElementById('builderOptionModalTitle');
    const optIdInput = document.getElementById('builderOptionId');
    const categorySelect = document.getElementById('builderOptionCategory');
    const nameInput = document.getElementById('builderOptionName');
    const priceInput = document.getElementById('builderOptionPrice');
    const descInput = document.getElementById('builderOptionDesc');
    const visualInput = document.getElementById('builderOptionVisual');
    const colorPicker = document.getElementById('builderOptionColorPicker');
    const colorCodeInput = document.getElementById('builderOptionColorCode');

    if (modalTitle) modalTitle.textContent = `✏️ Chỉnh Sửa: ${item.name}`;
    if (optIdInput) optIdInput.value = item.id;
    if (categorySelect) categorySelect.value = category;
    if (nameInput) nameInput.value = item.name || '';
    if (priceInput) priceInput.value = item.price !== undefined ? item.price : 0;
    if (descInput) descInput.value = item.desc || '';
    if (visualInput) visualInput.value = item.img || item.preview || '';
    if (colorPicker) colorPicker.value = item.code || '#F4A6B8';
    if (colorCodeInput) colorCodeInput.value = item.code || '#F4A6B8';

    // Trigger field toggle and preview
    categorySelect.dispatchEvent(new Event('change'));
    nameInput.dispatchEvent(new Event('input'));

    if (modal) modal.classList.add('active');
  };

  window.deleteBuilderItem = function(category, id) {
    const list = state.builderOptions[category] || [];
    if (list.length <= 1) {
      alert('Không thể xóa tùy chọn cuối cùng! Khách hàng cần ít nhất 1 tùy chọn để hoàn thành bó hoa.');
      return;
    }

    const item = list.find(x => x.id === id);
    const itemName = item ? item.name : 'tùy chọn này';

    if (confirm(`Bạn có chắc chắn muốn xóa "${itemName}" khỏi danh sách phối hoa không?`)) {
      state.builderOptions[category] = list.filter(x => x.id !== id);
      saveBuilderOptions();
      renderBuilderTable();
      showAdminToast(`🗑️ Đã xóa "${itemName}" thành công!`);
    }
  };
});

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
