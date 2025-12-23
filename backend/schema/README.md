# Database Schema Documentation

## Tổng quan
Schema database cho hệ thống Quản Lý Điểm với 4 bảng chính.

## Cấu trúc Database

### 1. Bảng `nguoi_dung` (Người dùng)
Quản lý thông tin người dùng trong hệ thống.

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `id` | INT (AUTO_INCREMENT) | ID duy nhất của người dùng |
| `ten_zalo` | VARCHAR(255) | Tên Zalo (bắt buộc) |
| `sdt` | VARCHAR(20) | Số điện thoại (có thể NULL) |
| `so_diem` | DECIMAL(10, 2) | Số điểm hiện tại (có thể âm, ví dụ: -1.5, 2.5, 3, -0.5) |
| `la_admin` | BOOLEAN | Có phải admin không (mặc định: FALSE) |
| `mat_khau` | VARCHAR(255) | Mật khẩu đã được hash |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

**Indexes:**
- `idx_ten_zalo` trên `ten_zalo`
- `idx_sdt` trên `sdt`
- `idx_la_admin` trên `la_admin`

### 2. Bảng `loai_giao_dich` (Loại giao dịch)
Quản lý các loại giao dịch trong hệ thống.

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `id` | INT (AUTO_INCREMENT) | ID duy nhất của loại giao dịch |
| `ten_loai_giao_dich` | VARCHAR(100) | Tên loại giao dịch (UNIQUE) |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

**Các loại giao dịch mặc định:**
1. San điểm
2. Giao lịch
3. Hủy lịch

### 3. Bảng `giao_dich` (Giao dịch)
Quản lý các giao dịch điểm giữa người dùng.

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `id` | INT (AUTO_INCREMENT) | ID duy nhất của giao dịch |
| `id_nguoi_gui` | INT | ID người gửi (FK → nguoi_dung.id) |
| `id_nguoi_nhan` | INT | ID người nhận (FK → nguoi_dung.id) |
| `id_loai_giao_dich` | INT | ID loại giao dịch (FK → loai_giao_dich.id) |
| `so_diem_giao_dich` | DECIMAL(10, 2) | Số điểm trong giao dịch |
| `id_giao_dich_doi_chung` | INT | ID giao dịch đối chứng (có thể NULL, FK → giao_dich.id) |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

**Foreign Keys:**
- `id_nguoi_gui` → `nguoi_dung.id` (CASCADE on delete)
- `id_nguoi_nhan` → `nguoi_dung.id` (CASCADE on delete)
- `id_loai_giao_dich` → `loai_giao_dich.id` (RESTRICT on delete)
- `id_giao_dich_doi_chung` → `giao_dich.id` (SET NULL on delete)

**Indexes:**
- `idx_nguoi_gui` trên `id_nguoi_gui`
- `idx_nguoi_nhan` trên `id_nguoi_nhan`
- `idx_loai_giao_dich` trên `id_loai_giao_dich`
- `idx_giao_dich_doi_chung` trên `id_giao_dich_doi_chung`
- `idx_created_at` trên `created_at`

### 4. Bảng `logs` (Log)
Lưu trữ log về số điểm còn lại sau mỗi giao dịch.

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `id` | INT (AUTO_INCREMENT) | ID duy nhất của log |
| `id_giao_dich` | INT | ID giao dịch (FK → giao_dich.id) |
| `so_diem_con_lai_nguoi_nhan` | DECIMAL(10, 2) | Số điểm còn lại của người nhận sau giao dịch |
| `so_diem_con_lai_nguoi_gui` | DECIMAL(10, 2) | Số điểm còn lại của người gửi sau giao dịch |
| `created_at` | TIMESTAMP | Thời gian tạo |

**Foreign Keys:**
- `id_giao_dich` → `giao_dich.id` (CASCADE on delete)

**Indexes:**
- `idx_giao_dich` trên `id_giao_dich`
- `idx_created_at` trên `created_at`

## Cài đặt

### Sử dụng SQL trực tiếp:
```bash
mysql -u your_username -p your_database < schema/database.sql
mysql -u your_username -p your_database < schema/seed.sql
```

### Sử dụng Prisma:
```bash
# Cài đặt Prisma
npm install prisma @prisma/client

# Tạo migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (nếu có)
npx prisma db seed
```

## Lưu ý

1. **Mật khẩu**: Luôn hash mật khẩu trước khi lưu vào database (sử dụng bcrypt hoặc tương tự)
2. **Số điểm**: Có thể là số âm hoặc số thập phân (ví dụ: -1.5, 2.5, 3, -0.5)
3. **Foreign Keys**: Đảm bảo tham chiếu đúng và xử lý cascade delete phù hợp
4. **Indexes**: Đã được tối ưu cho các truy vấn thường xuyên

## Quan hệ giữa các bảng

```
nguoi_dung (1) ──< (N) giao_dich (người gửi)
nguoi_dung (1) ──< (N) giao_dich (người nhận)
loai_giao_dich (1) ──< (N) giao_dich
giao_dich (1) ──< (N) logs
giao_dich (1) ──< (1) giao_dich (đối chứng, self-reference)
```

