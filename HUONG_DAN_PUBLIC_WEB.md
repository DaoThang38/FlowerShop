# 🌸 HƯỚNG DẪN ĐƯA WEBSITE OWEN FLEUR LÊN INTERNET (HOÀN TOÀN MIỄN PHÍ)

Tài liệu này hướng dẫn bạn đưa website bán hoa **Owen Fleur** lên mạng thực tế trong vòng **5 - 10 phút**, với chi phí vận hành **0đ/tháng** bằng giải pháp hiện đại: **GitHub + Vercel + Supabase + Telegram**.

---

## 📋 MỤC LỤC
1. [Bước 1: Đẩy mã nguồn lên GitHub](#bước-1-đẩy-mã-nguồn-lên-github)
2. [Bước 2: Triển khai Website lên Vercel](#bước-2-triển-khai-website-lên-vercel)
3. [Bước 3: Thiết lập Database Supabase (Đồng bộ đơn hàng)](#bước-3-thiết-lập-database-supabase-đồng-bộ-đơn-hàng)
4. [Bước 4: Thiết lập Bot Telegram (Báo đơn về điện thoại)](#bước-4-thiết-lập-bot-telegram-báo-đơn-về-điện-thoại)
5. [Bước 5: Gắn tên miền riêng (Tùy chọn)](#bước-5-gắn-tên-miền-riêng-tùy-chọn)

---

## BƯỚC 1: ĐẨY MÃ NGUỒN LÊN GITHUB

1. Đăng ký tài khoản miễn phí tại **[https://github.com](https://github.com)** (nếu chưa có).
2. Tạo một kho lưu trữ mới (New repository):
   - **Repository name**: `owen-fleur` (hoặc tên tùy thích).
   - Chọn chế độ: **Private** (để giữ bảo mật nội dung và danh sách quản trị).
   - Bấm **Create repository**.
3. Mở cửa sổ lệnh (Terminal / PowerShell) tại thư mục dự án và chạy các lệnh sau:

```bash
git init
git add .
git commit -m "Khoi tao website Owen Fleur - Hoan tat full luong van hanh"
git branch -M main
git remote add origin https://github.com/<TAI_KHOAN_CUA_BAN>/owen-fleur.git
git push -u origin main
```

*(Thay `<TAI_KHOAN_CUA_BAN>` bằng tên người dùng GitHub của bạn)*.

---

## BƯỚC 2: TRIỂN KHAI WEBSITE LÊN VERCEL

1. Đăng ký / Đăng nhập **[https://vercel.com](https://vercel.com)** (chọn đăng nhập bằng tài khoản GitHub vừa tạo).
2. Tại bảng điều khiển Vercel:
   - Bấm nút **"Add New..."** ➔ Chọn **"Project"**.
   - Tìm kiếm kho lưu trữ `owen-fleur` vừa đẩy lên ➔ Bấm **"Import"**.
   - Tại mục *Framework Preset*, giữ nguyên mặc định là **Other** (vì đây là Vanilla HTML/CSS/JS).
   - Bấm **"Deploy"**.
3. Sau khoảng 30 giây, Vercel sẽ thông báo: **"Congratulations! Your project has been deployed"**.
   - Đường link website của bạn sẽ có dạng: `https://owen-fleur.vercel.app` (hoặc tên tương tự do bạn đặt).
   - Website đã có sẵn chứng chỉ bảo mật HTTPS (ổ khóa xanh) hoàn toàn miễn phí.

---

## BƯỚC 3: THIẾT LẬP DATABASE SUPABASE (ĐỒNG BỘ ĐƠN HÀNG)

Supabase đóng vai trò như một máy chủ cơ sở dữ liệu trên đám mây, giúp khách đặt trên mạng thì máy tính của tiệm lập tức nhảy đơn.

1. Đăng ký tài khoản miễn phí tại **[https://supabase.com](https://supabase.com)** (có thể đăng nhập nhanh bằng GitHub).
2. Bấm **"New Project"**:
   - **Name**: `owenfleur-db`
   - **Database Password**: Nhập mật khẩu bảo vệ của bạn (hãy lưu lại).
   - **Region**: Chọn `Singapore (ap-southeast-1)` để có tốc độ truy cập nhanh nhất tại Việt Nam.
   - Bấm **"Create new project"** (chờ 1-2 phút để Supabase khởi tạo).
3. Tạo bảng lưu trữ đơn hàng:
   - Ở thanh menu bên trái, bấm vào biểu tượng **SQL Editor** (hình `>_`).
   - Mở file `supabase_schema.sql` có sẵn trong thư mục dự án, sao chép toàn bộ nội dung và dán vào ô SQL Editor.
   - Bấm nút **"RUN"** màu xanh.
4. Lấy chìa khóa kết nối:
   - Vào mục **Project Settings** (biểu tượng bánh răng ⚙️ ở góc dưới bên trái) ➔ Chọn **API**.
   - Tìm 2 thông số:
     - `Project URL`: Dạng `https://xxxx.supabase.co`
     - `anon public key`: Dạng chuỗi ký tự dài bắt đầu bằng `eyJhbGciOi...`
5. Nhập vào trang Quản trị:
   - Truy cập vào trang quản trị: `https://ten-web-cua-ban.vercel.app/admin.html`
   - Đăng nhập tài khoản admin:
     - Tài khoản: `admin` | Mật khẩu: `admin123`
   - Vào mục **⚙️ Cài Đặt Hệ Thống** ➔ Kéo xuống phần **Cơ Sở Dữ Liệu Đám Mây (Supabase)**.
   - Dán `Project URL` và `anon public key` vào ô tương ứng.
   - Bấm **"Kiểm Tra Kết Nối Cloud"** ➔ Hiện chữ "Kết Nối Thành Công" là hoàn tất!

---

## BƯỚC 4: THIẾT LẬP BOT TELEGRAM (BÁO ĐƠN VỀ ĐIỆN THOẠI)

Mỗi khi có khách đặt hoa trên website, Telegram trên điện thoại của bạn sẽ lập tức đổ chuông và gửi trọn vẹn thông tin đơn hàng, thiệp và số điện thoại người nhận.

1. **Tạo Bot Telegram**:
   - Mở ứng dụng Telegram trên điện thoại hoặc máy tính, tìm kiếm bot có tên `@BotFather`.
   - Gửi lệnh: `/newbot`
   - Đặt tên cho bot (Ví dụ: `Owen Fleur Order Alert`).
   - Đặt username cho bot (Ví dụ: `owenfleur_bot` - bắt buộc kết thúc bằng chữ `bot`).
   - `@BotFather` sẽ gửi cho bạn một chuỗi **HTTP API Token** (Ví dụ: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
2. **Lấy Chat ID của bạn**:
   - Tìm kiếm bot có tên `@userinfobot` trên Telegram.
   - Bấm `/start`, bot sẽ trả về số `Id` của bạn (Ví dụ: `987654321`).
   - Quay lại bot của tiệm bạn vừa tạo (`@owenfleur_bot`), bấm **Start** một lần để cho phép bot gửi tin nhắn cho bạn.
3. **Cấu hình trên web**:
   - Vào trang `admin.html` ➔ **⚙️ Cài Đặt Hệ Thống** ➔ Kéo xuống mục **Thông Báo Telegram**.
   - Dán **Bot Token** và **Chat ID** vào.
   - Bấm nút **"Bắn Thử Tin Nhắn Báo Đơn"** ➔ Điện thoại của bạn sẽ rung và nhận tin nhắn test ngay lập tức!
   - Bấm **"Lưu Toàn Bộ Cấu Hình"**.

---

## BƯỚC 5: GẮN TÊN MIỀN RIÊNG (TÙY CHỌN NÂNG CẤP)

Khi muốn thương hiệu chuyên nghiệp hơn (ví dụ: `owenfleur.com` hoặc `owenfleur.vn`):

1. Mua tên miền tại các nhà cung cấp uy tín như **Tenten**, **PA Việt Nam**, **Inet**, hoặc **Namecheap**.
2. Trên bảng điều khiển của Vercel:
   - Vào dự án `owen-fleur` ➔ Chọn tab **Settings** ➔ Chọn mục **Domains**.
   - Nhập tên miền bạn vừa mua (Ví dụ: `owenfleur.com`) ➔ Bấm **Add**.
3. Vercel sẽ hiển thị bản ghi DNS (bản ghi A hoặc CNAME):
   - Đăng nhập trang quản lý tên miền nơi bạn mua, tạo bản ghi theo đúng chỉ dẫn của Vercel.
   - Sau khoảng 5 - 15 phút, tên miền sẽ hoạt động với đầy đủ SSL bảo mật miễn phí.

---

## 🔒 LỜI KHUYÊN BẢO MẬT KHI VẬN HÀNH

1. **Đổi mật khẩu mặc định**:
   - Vào `admin.html` ➔ Mục **Phân Quyền Admin** ➔ Đổi ngay mật khẩu tài khoản `admin` thành mật khẩu riêng của bạn.
2. **Ẩn trang quản trị (Nếu muốn)**:
   - Bạn có thể đổi tên file `admin.html` thành tên khó đoán, ví dụ: `quan-tri-tiem-hoa-2026.html` trước khi đẩy lên GitHub. Khi đó chỉ những người biết đường link mới vào được trang đăng nhập.
