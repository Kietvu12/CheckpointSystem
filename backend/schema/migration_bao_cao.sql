-- Migration: Tạo bảng bao_cao
-- Created for MySQL/MariaDB

CREATE TABLE IF NOT EXISTS bao_cao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_bao_cao VARCHAR(255) NOT NULL COMMENT 'Tên báo cáo (ví dụ: Báo cáo ngày 2024-01-15)',
    ngay_bao_cao DATE NOT NULL COMMENT 'Ngày của báo cáo',
    duong_dan_file VARCHAR(500) NULL COMMENT 'Đường dẫn file Excel đã xuất (nếu có)',
    loai_bao_cao ENUM('tu_dong', 'thu_cong') NOT NULL DEFAULT 'thu_cong' COMMENT 'Loại báo cáo: tự động (23h59) hoặc thủ công',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ngay_bao_cao (ngay_bao_cao),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

