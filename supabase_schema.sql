-- ==========================================================
-- OWEN FLEUR - CẤU HÌNH DATABASE SUPABASE (MIỄN PHÍ)
-- Hướng dẫn:
-- 1. Đăng nhập https://supabase.com -> Tạo New Project
-- 2. Vào mục "SQL Editor" ở menu bên trái
-- 3. Dán toàn bộ mã bên dưới và bấm nút "RUN"
-- ==========================================================

-- 1. Tạo bảng lưu trữ đơn hàng hoa
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

-- 2. Đăng ký nhận thông báo thời gian thực (Real-time WebSockets)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 3. Phân quyền truy cập Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Cho phép khách đặt hoa đẩy đơn vào bảng
DROP POLICY IF EXISTS "Cho phép khách đặt hoa (Insert)" ON public.orders;
CREATE POLICY "Cho phép khách đặt hoa (Insert)" ON public.orders FOR INSERT WITH CHECK (true);

-- Cho phép đọc đơn hàng
DROP POLICY IF EXISTS "Cho phép đọc đơn hàng (Select)" ON public.orders;
CREATE POLICY "Cho phép đọc đơn hàng (Select)" ON public.orders FOR SELECT USING (true);

-- Cho phép chủ tiệm cập nhật trạng thái đơn
DROP POLICY IF EXISTS "Cho phép cập nhật trạng thái đơn (Update)" ON public.orders;
CREATE POLICY "Cho phép cập nhật trạng thái đơn (Update)" ON public.orders FOR UPDATE USING (true);
