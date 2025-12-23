-- Migration: Thêm trường nội dung giao dịch vào bảng giao_dich
-- Date: 2024

-- Thêm cột noi_dung_giao_dich vào bảng giao_dich
ALTER TABLE giao_dich 
ADD COLUMN noi_dung_giao_dich TEXT NULL COMMENT 'Nội dung giao dịch (có thể NULL)';

