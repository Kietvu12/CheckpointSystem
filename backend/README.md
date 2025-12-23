# Backend API - Quản Lý Điểm System

## Cài đặt

```bash
# Cài đặt dependencies
pnpm install

# Tạo file .env từ .env.example
cp .env.example .env

# Cấu hình database trong file .env
```

## Chạy server

```bash
# Development mode (với watch)
pnpm dev

# Production mode
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập

### Users
- `GET /api/users` - Lấy tất cả người dùng
- `GET /api/users/:id` - Lấy người dùng theo ID
- `POST /api/users` - Tạo người dùng mới
- `POST /api/users/bulk` - Tạo nhiều người dùng cùng lúc
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Transactions
- `GET /api/transactions` - Lấy tất cả giao dịch
- `GET /api/transactions/:id` - Lấy giao dịch theo ID
- `GET /api/transactions/user/:userId` - Lấy giao dịch của người dùng
- `POST /api/transactions` - Tạo giao dịch mới
- `POST /api/transactions/bulk` - Tạo nhiều giao dịch cùng lúc

### Reports
- `GET /api/reports` - Xuất báo cáo tổng hợp
  - Query params: `start_date`, `end_date`, `id_nguoi_dung`
- `GET /api/reports/user/:userId` - Báo cáo theo người dùng
  - Query params: `start_date`, `end_date`

## Cấu trúc dự án

```
backend/
├── config/
│   └── db.js              # Kết nối database
├── models/
│   ├── UserModel.js       # Model người dùng
│   ├── TransactionModel.js # Model giao dịch
│   └── LogModel.js        # Model log
├── controllers/
│   ├── authController.js  # Controller đăng nhập
│   ├── userController.js  # Controller người dùng
│   ├── transactionController.js # Controller giao dịch
│   └── reportController.js # Controller báo cáo
├── routes/
│   ├── authRoutes.js      # Routes đăng nhập
│   ├── userRoutes.js      # Routes người dùng
│   ├── transactionRoutes.js # Routes giao dịch
│   └── reportRoutes.js    # Routes báo cáo
├── schema/
│   └── database.sql       # SQL schema
├── index.js              # Server chính
├── package.json
└── .env.example
```

## Lưu ý

1. **Mật khẩu**: Mật khẩu được lưu raw (không hash) theo yêu cầu
2. **Giao dịch**: 
   - Giao lịch: Người nhận trừ điểm, người gửi cộng điểm
   - San điểm: Người nhận cộng điểm, người gửi trừ điểm
   - Hủy lịch: Đảo ngược giao dịch "Giao lịch" với id_giao_dich_doi_chung
3. **Transaction**: Tất cả giao dịch được xử lý trong transaction để đảm bảo tính nhất quán

