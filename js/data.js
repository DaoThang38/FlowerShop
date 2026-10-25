// Dữ liệu sản phẩm và cấu hình cho website tiệm hoa sáp "Owen Fleur - Tiệm Hoa Sáp Thơm Thiết Kế"
const FLOWER_DATA = {
  storeInfo: {
    name: "Owen Fleur",
    taglineFr: "Les fleurs racontent ce que le cœur ressent.",
    taglineEn: "𝐹𝑙𝑜𝑤𝑒𝑟𝑠 𝑤ℎ𝑖𝑠𝑝𝑒𝑟 𝑤ℎ𝑎𝑡 𝑡ℎ𝑒 ℎ𝑒𝑎𝑟𝑡 𝑐𝑎𝑛𝑛𝑜𝑡 𝑠𝑎𝑦.",
    taglineVi: "Hoa thì thầm những điều trái tim khó tỏ bày.",
    phone: "0985 421 398",
    phoneDisplay: "0985 421 398",
    addressHanoi: "CS1: Đống Đa - Hà Nội",
    addressHungYen: "CS2: Văn Giang - Hưng Yên",
    facebook: "https://www.facebook.com/owenfleur",
    tiktok: "https://www.tiktok.com/@owenfleur",
    email: "contact@owenfleur.vn",
    openingHours: "07:30 - 21:30 (Mỗi ngày)"
  },
  
  categories: [
    { id: "all", name: "Tất Cả Mẫu Hoa Sáp", icon: "🌸" },
    { id: "love", name: "Tình Yêu & Kỷ Niệm", icon: "💖" },
    { id: "birthday", name: "Sinh Nhật & Tốt Nghiệp", icon: "🎂" },
    { id: "opening", name: "Khai Trương - Chúc Mừng", icon: "🎉" },
    { id: "glitter", name: "Hoa Sáp Nhũ Kim Tuyến", icon: "✨" },
    { id: "box", name: "Hộp & Giỏ Hoa Sáp Cao Cấp", icon: "🎁" }
  ],

  products: [
    {
      id: "fleur-01",
      name: "Bó Hoa Hồng Sáp 'Lời Tỏ Tình Ngọt Ngào' (19 Bông)",
      category: "love",
      price: 450000,
      originalPrice: 550000,
      tag: "Bán Chạy Nhất",
      rating: 5.0,
      reviewsCount: 78,
      image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
      description: "Bó hoa hồng sáp thơm 4 lớp cao cấp màu hồng pastel kết hợp giấy mờ phong cách Hàn Quốc và cành baby khô điểm xuyết, lưu hương thơm nhẹ nhàng.",
      flowerMeaning: "Tượng trưng cho tình yêu chân thành, ngọt ngào và vĩnh cửu theo năm tháng.",
      flowersIncluded: ["Hoa hồng sáp thơm 4 lớp cao cấp", "Hoa baby khô tự nhiên", "Ruy băng voan lụa Hàn Quốc"],
      tone: "Hồng Pastel & Trắng Kem",
      careGuide: "Để nơi khô ráo thoáng mát, tránh tiếp xúc trực tiếp với nước và ánh nắng gay gắt. Hoa sáp giữ phom và hương thơm bền đẹp từ 3 - 5 năm."
    },
    {
      id: "fleur-02",
      name: "Bó Hoa Sáp Tulip 'Ánh Nắng Mùa Xuân' (15 Bông)",
      category: "birthday",
      price: 390000,
      originalPrice: 480000,
      tag: "Mới Về",
      rating: 4.9,
      reviewsCount: 45,
      image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80",
      description: "Tulip sáp thơm tone vàng nắng ấm áp kết hợp giấy gói kraft trắng thanh lịch. Món quà sinh nhật và chúc mừng tốt nghiệp được yêu thích.",
      flowerMeaning: "Tulip vàng biểu trưng cho nụ cười rạng rỡ, sự may mắn và năng lượng tích cực ngập tràn.",
      flowersIncluded: ["Hoa tulip sáp thơm mềm mịn", "Cành lá thảo mộc trang trí", "Nơ ruy băng champagne"],
      tone: "Vàng Nắng & Trắng Tinh",
      careGuide: "Không cần tưới nước. Tránh nơi có độ ẩm cao hoặc nguồn nhiệt nóng để giữ cánh hoa luôn sắc nét."
    },
    {
      id: "fleur-03",
      name: "Bó Hoa Hồng Sáp Nhũ 'Dải Ngân Hà Lấp Lánh' (33 Bông)",
      category: "glitter",
      price: 680000,
      originalPrice: 850000,
      tag: "Hot Trend",
      rating: 5.0,
      reviewsCount: 92,
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      description: "Bó hoa hồng sáp phủ nhũ kim tuyến óng ánh phối kèm dải đèn led fairy light lung linh huyền ảo trong đêm, giấy gói đen quý tộc.",
      flowerMeaning: "Tình yêu duy nhất, lấp lánh và vĩnh cửu như bầu trời sao đêm.",
      flowersIncluded: ["Hoa hồng sáp phủ nhũ kim tuyến cao cấp", "Đèn led đom đóm 3 chế độ", "Giấy gói đen mờ chống thấm"],
      tone: "Đỏ Nhũ & Đen Sang Trọng",
      careGuide: "Sử dụng pin cúc áo thay thế dễ dàng cho đèn led. Hoa sáp nhũ không bay bụi kim tuyến, bền màu mãi mãi."
    },
    {
      id: "fleur-04",
      name: "Bó Hoa Sáp Hướng Dương 'Khát Vọng Tương Lai' (7 Bông)",
      category: "birthday",
      price: 350000,
      originalPrice: 420000,
      tag: "Hoa Tốt Nghiệp",
      rating: 5.0,
      reviewsCount: 56,
      image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
      description: "Bó hoa sáp hướng dương vàng rực rỡ kết hợp chú gấu bông cử nhân mini và cành baby khô, món quà chúc mừng tốt nghiệp và thăng chức ý nghĩa.",
      flowerMeaning: "Lời chúc luôn kiên định, mạnh mẽ và hướng về tương lai tươi sáng nhất.",
      flowersIncluded: ["Hoa hướng dương sáp thơm cánh kép", "Gấu bông cử nhân đội mũ xinh xắn", "Baby khô vĩnh cửu"],
      tone: "Vàng Rực Rỡ & Nâu Vintage",
      careGuide: "Bảo quản nơi thoáng mát, hoa không tàn và giữ làm kỷ vật đáng nhớ trong nhiều năm."
    },
    {
      id: "fleur-05",
      name: "Hộp Hoa Sáp Trái Tim Mica 'Vĩnh Cửu Tình Yêu'",
      category: "box",
      price: 590000,
      originalPrice: 720000,
      tag: "Bán Chạy",
      rating: 4.9,
      reviewsCount: 64,
      image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80",
      description: "Hộp mica trong suốt xếp hình trái tim với 25 bông hồng sáp thơm tone đỏ nhung và hồng pastel, kèm dải ruy băng thắt nơ nghệ thuật.",
      flowerMeaning: "Lời nguyện ước trái tim luôn trao trọn cho người mình yêu thương, vẹn nguyên theo thời gian.",
      flowersIncluded: ["Hồng sáp thơm đỏ nhung", "Hồng sáp tone pastel", "Hộp mica nắp trong suốt cao cấp"],
      tone: "Đỏ Nhung & Trắng Sữa",
      careGuide: "Để nguyên trong hộp mica trang trí bàn làm việc hoặc phòng ngủ vừa thơm ngát vừa chống bám bụi hoàn hảo."
    },
    {
      id: "fleur-06",
      name: "Giỏ Hoa Sáp Khai Trương 'Tài Lộc Hưng Thịnh'",
      category: "opening",
      price: 850000,
      originalPrice: 1050000,
      tag: "Thiết Kế VIP",
      rating: 5.0,
      reviewsCount: 41,
      image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
      description: "Giỏ hoa sáp tone cam đào và vàng đồng phú quý, cắm dày dặn cùng hoa tú cầu sáp và cành lá đồng kim sang trọng đặt bàn tiếp tân, quầy thu ngân.",
      flowerMeaning: "Khai trương hồng phát, tài lộc dồi dào, thuận buồm xuôi gió và kinh doanh bền vững.",
      flowersIncluded: ["Hoa hồng sáp cam Spirit", "Cẩm tú cầu sáp", "Lá đô la bạc kim loại", "Giỏ cắm hoa cao cấp"],
      tone: "Cam Đào & Vàng Đồng",
      careGuide: "Trưng bày được nhiều năm tại cửa hàng hoặc văn phòng mà không lo héo úa hay phải chăm sóc phức tạp."
    },
    {
      id: "fleur-07",
      name: "Bó Hoa Hồng Sáp Khổng Lồ 99 Bông 'Bách Niên Giai Lão'",
      category: "love",
      price: 1350000,
      originalPrice: 1650000,
      tag: "Siêu Phẩm",
      rating: 5.0,
      reviewsCount: 110,
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
      description: "Bó hoa khổng lồ 99 đóa hồng sáp đỏ thắm đính ngọc trai hoặc nhũ óng ánh, gói bằng 15 lớp giấy xòe công chúa bồng bềnh đẳng cấp.",
      flowerMeaning: "99 đóa hồng sáp tượng trưng cho tình yêu trường tồn vĩnh cửu, không bao giờ nhạt phai.",
      flowersIncluded: ["99 bông hồng sáp thơm 4 lớp nở to", "Hạt ngọc trai trang trí", "Vương miện công chúa đội đầu hoa"],
      tone: "Đỏ Rực & Viền Trắng Xòe",
      careGuide: "Trưng bày phòng khách sang trọng, mùi hương xà bông dịu nhẹ lan tỏa khắp không gian phòng."
    },
    {
      id: "fleur-08",
      name: "Bó Hoa Sáp Cưới Cầm Tay 'Hạnh Phúc Trọn Đời'",
      category: "wedding",
      price: 520000,
      originalPrice: 650000,
      tag: "Hoa Cưới Bền Đẹp",
      rating: 4.9,
      reviewsCount: 38,
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      description: "Bó hoa cưới làm từ hoa sáp tone trắng kem phối hồng phấn nhẹ nhàng, đính dải ruy băng lụa tơ tằm dài thướt tha, giữ làm kỷ niệm sau ngày cưới.",
      flowerMeaning: "Lời hứa trăm năm hòa hợp, ngày cưới trọn vẹn và kỷ vật lưu giữ mãi về sau.",
      flowersIncluded: ["Hồng sáp trắng kem", "Hoa linh lan sáp", "Ruy băng voan lụa mềm mại"],
      tone: "Trắng Kem & Hồng Nhạt",
      careGuide: "Giữ hoa trong hộp kính hoặc tủ trưng bày làm kỷ vật sau ngày cưới, bền đẹp theo năm tháng."
    }
  ],

  // Cấu hình tính năng "Tự Phối Bó Hoa Sáp Của Bạn" (Custom Soap Bouquet Builder)
  customBouquetOptions: {
    mainFlowers: [
      { id: "rose_soap", name: "Hoa Hồng Sáp Thơm 4 Lớp Cao Cấp", price: 220000, img: "🌹", desc: "19 bông hồng sáp thơm ngát, cánh mềm mịn như thật" },
      { id: "glitter_rose", name: "Hoa Hồng Sáp Phủ Nhũ Kim Tuyến", price: 290000, img: "✨", desc: "19 bông hồng sáp nhũ lấp lánh huyền ảo" },
      { id: "tulip_soap", name: "Hoa Tulip Sáp Thơm Tinh Tế", price: 250000, img: "🌷", desc: "15 cành tulip sáp dáng chuẩn thanh lịch" },
      { id: "sunflower_soap", name: "Hoa Hướng Dương Sáp Vàng Ấm", price: 200000, img: "🌻", desc: "7 bông hướng dương sáp rực rỡ năng lượng" }
    ],
    accentFlowers: [
      { id: "baby_dry", name: "Cành Hoa Baby Khô Tự Nhiên", price: 60000, desc: "Baby khô vĩnh cửu tạo độ bồng bềnh tinh tế" },
      { id: "crown_led", name: "Vương Miện Quý Tộc + Đèn Led Fairy Light", price: 90000, desc: "Lung linh tỏa sáng về đêm và thêm phần kiêu sa" },
      { id: "bear_mini", name: "Gấu Bông Mini Đáng Yêu", price: 50000, desc: "Tạo nét dễ thương, ngọt ngào cho bó hoa" },
      { id: "none", name: "Không chọn phụ kiện", price: 0, desc: "Chỉ tập trung vào nét đẹp của hoa sáp chính" }
    ],
    wrappers: [
      { id: "korean_matte", name: "Giấy Mờ Phong Cách Hàn Quốc (Chống Thấm)", price: 40000, preview: "🎀" },
      { id: "vintage_kraft", name: "Giấy Xi Măng Kraft Vintage Cổ Điển", price: 30000, preview: "📜" },
      { id: "luxury_black", name: "Giấy Đen Mờ Quý Tộc Châu Âu", price: 50000, preview: "🖤" },
      { id: "clear_box", name: "Hộp Mica Trong Suốt Cao Cấp", price: 100000, preview: "🎁" }
    ],
    ribbons: [
      { id: "rose_gold", name: "Ruy Băng Hồng Pastel", code: "#F4A6B8" },
      { id: "burgundy", name: "Ruy Băng Đỏ Bordeaux", code: "#800020" },
      { id: "forest_green", name: "Ruy Băng Xanh Rêu Sang Trọng", code: "#2C5E43" },
      { id: "champagne", name: "Ruy Băng Vàng Champagne", code: "#E6C280" }
    ]
  },

  // Ý kiến khách hàng
  testimonials: [
    {
      name: "Phương Linh",
      role: "Khách hàng thân thiết",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      comment: "Hoa sáp của Owen Fleur thơm thoang thoảng rất dễ chịu, cánh hoa mịn nhìn y như hoa thật. Mình để trang trí phòng ngủ nửa năm rồi vẫn đẹp nguyên!",
      rating: 5
    },
    {
      name: "Minh Quân",
      role: "Khách tặng người yêu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      comment: "Bó hoa hồng sáp nhũ kim tuyến kèm đèn led buổi tối lung linh lắm. Bạn gái mình mê mẩn vì giữ được vĩnh cửu không lo bị tàn héo.",
      rating: 5
    },
    {
      name: "Thùy Dung",
      role: "Khách tốt nghiệp",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
      comment: "Bó hướng dương sáp tốt nghiệp gói rất chỉn chu, chụp kỷ yếu cả ngày không sợ dập gãy hay héo, mang về nhà trưng bày bàn học làm kỷ niệm rất ưng ý!",
      rating: 5
    }
  ]
};

// Hàm định dạng tiền tệ VNĐ
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
