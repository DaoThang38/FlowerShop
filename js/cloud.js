// ==========================================================
// OWEN FLEUR - CLOUD DATABASE & SECURITY ADAPTER (SUPABASE)
// Real-time Order Sync, XSS Protection & Cloud Persistence
// ==========================================================

// Global XSS Sanitizer for both Customer & Admin Portals
window.escapeHtml = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Play crystal-clear notification chime using Web Audio API
window.playOrderNotificationSound = function() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (higher)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Second tone (harmonic chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.warn('Audio chime notice:', e);
  }
};

const OwenCloud = {
  client: null,
  configKey: 'owenfleur_cloud_config',

  // Embedded project credentials for public storefront & cross-device sync
  defaultConfig: {
    supabaseUrl: 'https://qevrsfwfibjbmjuucdjv.supabase.co',
    supabaseKey: 'sb_publishable_IdN2sVw_ALs7XWcNsjPwaA__BZJRdGP',
    enabled: true
  },

  getConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(this.configKey));
      if (cfg && cfg.supabaseUrl && cfg.supabaseKey && cfg.enabled) {
        return cfg;
      }
      return (this.defaultConfig.supabaseUrl && this.defaultConfig.supabaseKey) ? this.defaultConfig : (cfg || { supabaseUrl: '', supabaseKey: '', enabled: false });
    } catch (e) {
      return (this.defaultConfig.supabaseUrl && this.defaultConfig.supabaseKey) ? this.defaultConfig : { supabaseUrl: '', supabaseKey: '', enabled: false };
    }
  },

  isConfigured() {
    const cfg = this.getConfig();
    return !!(cfg.supabaseUrl && cfg.supabaseKey && cfg.enabled);
  },

  init() {
    const cfg = this.getConfig();
    if (cfg.supabaseUrl && cfg.supabaseKey && window.supabase && window.supabase.createClient) {
      try {
        this.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
        console.log('🌸 Owen Fleur Cloud: Supabase connected successfully.');
      } catch (err) {
        console.error('🌸 Owen Fleur Cloud initialization error:', err);
        this.client = null;
      }
    }
  },

  async testConnection(url, key) {
    if (!window.supabase || !window.supabase.createClient) {
      return { success: false, message: 'Thư viện Supabase JS chưa được tải. Vui lòng kiểm tra kết nối mạng.' };
    }
    try {
      const testClient = window.supabase.createClient(url.trim(), key.trim());
      const { data, error } = await testClient.from('orders').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        return { success: false, message: `Lỗi kết nối: ${error.message}` };
      }
      return { success: true, message: '✅ Kết nối Supabase thành công! Bảng orders đã sẵn sàng nhận dữ liệu.' };
    } catch (err) {
      return { success: false, message: `Không thể kết nối: ${err.message}` };
    }
  },

  saveConfig(url, key, enabled = true) {
    const cfg = {
      supabaseUrl: url.trim(),
      supabaseKey: key.trim(),
      enabled: enabled
    };
    localStorage.setItem(this.configKey, JSON.stringify(cfg));
    this.init();
    return cfg;
  },

  // Save new order to Cloud Database + LocalStorage
  async saveOrder(order) {
    // 1. Always update local storage first for instant reliability
    try {
      const localOrders = JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
      const exists = localOrders.some(o => o.id === order.id);
      if (!exists) {
        localOrders.unshift(order);
        localStorage.setItem('owenfleur_orders', JSON.stringify(localOrders));
      }
    } catch (e) {
      console.warn('Local storage save error:', e);
    }

    // 2. If Cloud Database is active, push to Cloud
    if (this.client) {
      try {
        const payload = {
          id: order.id,
          recipient_name: order.recipientName,
          recipient_phone: order.recipientPhone,
          sender_phone: order.senderPhone || null,
          address: order.address,
          delivery_date: order.deliveryDate,
          delivery_time: order.deliveryTime,
          delivery_time_label: order.deliveryTimeLabel,
          items: order.items,
          total: order.total,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          card_message: order.cardMessage || null,
          status: order.status || 'pending',
          is_urgent: !!order.isUrgent,
          florist_notes: order.floristNotes || null,
          created_at: order.createdAt || new Date().toISOString()
        };

        const { data, error } = await this.client.from('orders').upsert([payload]);
        if (error) {
          console.error('🌸 Cloud save order error:', error);
        } else {
          console.log('🌸 Đã đồng bộ đơn hàng #' + order.id + ' lên Supabase Cloud!');
        }
      } catch (err) {
        console.error('🌸 Network cloud push error:', err);
      }
    }
  },

  // Fetch all orders from Cloud (with fallback to local)
  async fetchOrders() {
    if (!this.client) {
      return JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
    }

    try {
      const { data, error } = await this.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('🌸 Failed to fetch from cloud, fallback to local:', error);
        return JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
      }

      if (data && data.length >= 0) {
        // Map database column names to JS camelCase
        const mapped = data.map(row => ({
          id: row.id,
          createdAt: row.created_at,
          recipientName: row.recipient_name,
          recipientPhone: row.recipient_phone,
          senderPhone: row.sender_phone,
          address: row.address,
          deliveryDate: row.delivery_date,
          deliveryTime: row.delivery_time,
          deliveryTimeLabel: row.delivery_time_label,
          items: row.items || [],
          total: Number(row.total || 0),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          cardMessage: row.card_message,
          status: row.status,
          isUrgent: Boolean(row.is_urgent),
          floristNotes: row.florist_notes
        }));

        // Cache into localStorage
        localStorage.setItem('owenfleur_orders', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('🌸 Cloud fetch error, using local:', err);
    }
    return JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
  },

  // Update order status on Cloud
  async updateOrderStatus(orderId, status, notes = null) {
    let resolvedNote = null;
    if (notes !== null) {
      if (typeof notes === 'object' && notes !== null) {
        resolvedNote = notes.floristNotes || notes.notes || '';
      } else {
        resolvedNote = String(notes);
      }
      if (resolvedNote.includes('[object Object]')) {
        resolvedNote = resolvedNote.replace(/\[object Object\]/g, '').trim();
      }
    }

    // Update local first
    try {
      const localOrders = JSON.parse(localStorage.getItem('owenfleur_orders')) || [];
      const ord = localOrders.find(o => o.id === orderId);
      if (ord) {
        ord.status = status;
        if (resolvedNote !== null) ord.floristNotes = resolvedNote;
        localStorage.setItem('owenfleur_orders', JSON.stringify(localOrders));
      }
    } catch (e) {}

    // Update cloud
    if (this.client) {
      try {
        const updateData = { status };
        if (resolvedNote !== null) updateData.florist_notes = resolvedNote;
        await this.client.from('orders').update(updateData).eq('id', orderId);
      } catch (err) {
        console.error('🌸 Cloud update status error:', err);
      }
    }
  },

  // Real-time listener for incoming orders
  subscribeToOrders(onNewOrder, onUpdateOrder) {
    if (!this.client) return null;

    try {
      const channel = this.client
        .channel('realtime_orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
          const row = payload.new;
          const order = {
            id: row.id,
            createdAt: row.created_at,
            recipientName: row.recipient_name,
            recipientPhone: row.recipient_phone,
            senderPhone: row.sender_phone,
            address: row.address,
            deliveryDate: row.delivery_date,
            deliveryTime: row.delivery_time,
            deliveryTimeLabel: row.delivery_time_label,
            items: row.items || [],
            total: Number(row.total || 0),
            paymentMethod: row.payment_method,
            paymentStatus: row.payment_status,
            cardMessage: row.card_message,
            status: row.status,
            isUrgent: Boolean(row.is_urgent),
            floristNotes: row.florist_notes
          };

          window.playOrderNotificationSound();
          if (typeof onNewOrder === 'function') onNewOrder(order);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
          const row = payload.new;
          if (typeof onUpdateOrder === 'function') onUpdateOrder(row);
        })
        .subscribe();

      return channel;
    } catch (err) {
      console.warn('🌸 Could not subscribe to realtime orders:', err);
      return null;
    }
  },

  // Returns pre-filled SQL setup script for Supabase
  getSchemaSQL() {
    return `-- ==========================================================
-- OWEN FLEUR DATABASE SCHEMA SETUP (SUPABASE SQL EDITOR)
-- Sao chép toàn bộ đoạn này dán vào SQL Editor của Supabase và bấm RUN
-- ==========================================================

-- 1. Tạo bảng lưu trữ đơn hàng
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    sender_phone TEXT,
    address TEXT NOT NULL,
    delivery_date TEXT,
    delivery_time TEXT,
    delivery_time_label TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT,
    card_message TEXT,
    status TEXT DEFAULT 'pending',
    is_urgent BOOLEAN DEFAULT false,
    florist_notes TEXT
);

-- 2. Bật tính năng Real-time để chuông báo đơn nhảy tức thì
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 3. Phân quyền truy cập (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép khách đặt hoa (Insert)" ON public.orders;
CREATE POLICY "Cho phép khách đặt hoa (Insert)" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép đọc đơn hàng (Select)" ON public.orders;
CREATE POLICY "Cho phép đọc đơn hàng (Select)" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép cập nhật trạng thái đơn (Update)" ON public.orders;
CREATE POLICY "Cho phép cập nhật trạng thái đơn (Update)" ON public.orders FOR UPDATE USING (true);
`;
  }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.OwenCloud = OwenCloud;
  document.addEventListener('DOMContentLoaded', () => {
    OwenCloud.init();
  });
}
