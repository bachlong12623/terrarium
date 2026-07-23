# Terrarium

Game nuôi terrarium pixel art — chăm cây, mở nhánh sinh trưởng theo cách bạn chăm sóc.

## Chơi thử

Sau khi bật GitHub Pages, mở: `https://<username>.github.io/terrarium/`

## Tính năng

- Pixel art tone màu mát, responsive desktop & mobile
- Sen đá với **8 giai đoạn** sinh trưởng
- **3 nhánh** theo cách chăm: Đồng minh, Sa mạc, Vườn
- Tưới, phun sương, xoay bình, bón phân, cắt tỉa
- Plant Dex, lưu game tự động, xuất/nhập save
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

| Nhánh | Cách chăm |
|---|---|
| **Đồng minh** | Tưới vừa, xoay bình đều, ánh sáng cân bằng |
| **Sa mạc** | Ít tưới, nhiều xoay bình (ánh sáng cao) |
| **Vườn** | Ẩm vừa, bón phân, không cắt tỉa |

Nhánh khóa ở giai đoạn **Định hình** (6) — chăm sóc từ giai đoạn 4–6 quyết định kết quả.
