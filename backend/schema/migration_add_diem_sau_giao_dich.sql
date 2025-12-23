-- Migration: Thêm các trường diem_sau_giao_dich_nguoi_gui và diem_sau_giao_dich_nguoi_nhan vào bảng giao_dich
-- Date: 2025-01-XX
-- Description: Thêm 2 trường để ghi lại số điểm của người gửi và người nhận sau mỗi giao dịch

ALTER TABLE `giao_dich`
ADD COLUMN `diem_sau_giao_dich_nguoi_gui` decimal(10,2) DEFAULT NULL COMMENT 'Số điểm của người gửi sau giao dịch' AFTER `so_diem_giao_dich`,
ADD COLUMN `diem_sau_giao_dich_nguoi_nhan` decimal(10,2) DEFAULT NULL COMMENT 'Số điểm của người nhận sau giao dịch' AFTER `diem_sau_giao_dich_nguoi_gui`;

