-- Migration: Thêm cột trạng thái vào bảng giao_dich
-- Ngày tạo: 2025-12-09
-- Mô tả: Thêm cột trang_thai để quản lý trạng thái chốt của giao dịch

USE quanlydiem;

-- Thêm cột trang_thai vào bảng giao_dich
ALTER TABLE `giao_dich` 
ADD COLUMN `trang_thai` ENUM('chua_chot', 'da_chot') 
COLLATE utf8mb4_unicode_ci 
NOT NULL DEFAULT 'chua_chot' 
COMMENT 'Trạng thái giao dịch: chua_chot (chưa chốt), da_chot (đã chốt)'
AFTER `noi_dung_giao_dich`;

-- Thêm index cho cột trang_thai để tối ưu truy vấn
ALTER TABLE `giao_dich` 
ADD INDEX `idx_trang_thai` (`trang_thai`);

-- Cập nhật tất cả các giao dịch hiện tại thành trạng thái 'chua_chot'
-- (Các giao dịch mới tạo mặc định sẽ là 'chua_chot', admin có thể chốt sau)
UPDATE `giao_dich` SET `trang_thai` = 'chua_chot';

-- Kiểm tra kết quả
SELECT 
    'Migration completed successfully' AS status,
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN trang_thai = 'chua_chot' THEN 1 ELSE 0 END) AS chua_chot_count,
    SUM(CASE WHEN trang_thai = 'da_chot' THEN 1 ELSE 0 END) AS da_chot_count
FROM `giao_dich`;

-- Rollback (nếu cần):
-- ALTER TABLE `giao_dich` DROP INDEX `idx_trang_thai`;
-- ALTER TABLE `giao_dich` DROP COLUMN `trang_thai`;

