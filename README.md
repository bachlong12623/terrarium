# Terrarium

Game nuôi terrarium pixel art — chăm cây, mở nhánh sinh trưởng theo cách bạn chăm sóc.

## Chơi thử

Sau khi bật GitHub Pages, mở: `https://<username>.github.io/terrarium/`

## Tính năng

- Pixel art tone màu mát: bầu trời ngày/đêm, mặt trời/trăng, sao, đom đóm đêm
- **2 loài cây** (Sen đá, Dương xỉ), mỗi loài **8 giai đoạn** sinh trưởng
- Mỗi loài **3 nhánh** theo cách chăm sóc — cây đổi hình dáng theo cách bạn chơi
- Hệ thống **hạt giống & thu hoạch**: cây Hoàn thiện thu hoạch được +2 hạt
- Cây **héo** khi quá khô/quá úng — hồi phục khi cân bằng lại độ ẩm
- Tưới, phun sương, xoay bình, bón phân, cắt tỉa (có cooldown)
- Plant Dex 2 loài, lưu game tự động, xuất/nhập save, tiến độ offline
- PWA — có thể thêm vào màn hình chính

## Phát triển

```bash
npm install
npm run dev
```

Mở `http://localhost:5173/terrarium/`

```bash
npm run build
npm run preview
```

## Deploy GitHub Pages

1. Vào **Settings → Pages → Build and deployment → GitHub Actions**
2. Push lên nhánh `main` — workflow tự build & deploy

## Cách mở nhánh

### 🪴 Sen đá

| Nhánh | Cách chăm |
|---|---|
| **Đồng minh** | Tưới vừa, xoay bình đều, ánh sáng cân bằng |
| **Sa mạc** | Ít tưới, nhiều xoay bình (ánh sáng cao) |
| **Vườn** | Ẩm vừa, bón phân, không cắt tỉa |

### 🍃 Dương xỉ

| Nhánh | Cách chăm |
|---|---|
| **Rừng** | Ẩm cao + bón phân — tán rộng |
| **Thác** | Phun sương + xoay bình — lá rủ |
| **Cột** | Sáng vừa, ít tưới — vươn cao |

Nhánh khóa ở giai đoạn **Định hình** (6) — chăm sóc từ giai đoạn 4–6 quyết định kết quả.

## Vòng chơi

1. Trồng hạt (chọn loài) → chăm sóc theo "phong cách" bạn muốn
2. Giai đoạn 6 hiện 3 silhouette mờ — nhánh dẫn sáng nhất
3. Cây khóa nhánh, lớn đến **Hoàn thiện** (8)
4. Thu hoạch → +2 hạt giống → trồng loài/nhánh khác
5. Sưu tập đủ mọi giai đoạn + nhánh trong Plant Dex
