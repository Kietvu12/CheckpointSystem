-- Database Schema for Quản Lý Điểm System
-- Created for MySQL/MariaDB

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS giao_dich;
DROP TABLE IF EXISTS loai_giao_dich;
DROP TABLE IF EXISTS nguoi_dung;

-- 1. Bảng người dùng
CREATE TABLE nguoi_dung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_zalo VARCHAR(255) NOT NULL,
    sdt VARCHAR(20) NULL,
    so_diem DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số điểm có thể là số thập phân, số âm (vd: -1.5, 2.5, 3, -0.5)',
    la_admin BOOLEAN NOT NULL DEFAULT FALSE,
    mat_khau VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã được hash',
    thong_tin_xe LONGTEXT NULL COMMENT 'Thông tin xe',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ten_zalo (ten_zalo),
    INDEX idx_sdt (sdt),
    INDEX idx_la_admin (la_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng loại giao dịch
CREATE TABLE loai_giao_dich (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_loai_giao_dich VARCHAR(100) NOT NULL UNIQUE COMMENT '3 loại: San điểm, Giao lịch, Hủy lịch',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default transaction types
INSERT INTO loai_giao_dich (ten_loai_giao_dich) VALUES
('San điểm'),
('Giao lịch'),
('Hủy lịch');

-- 3. Bảng giao dịch
CREATE TABLE giao_dich (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_nguoi_gui INT NOT NULL,
    id_nguoi_nhan INT NOT NULL,
    id_loai_giao_dich INT NOT NULL,
    so_diem_giao_dich DECIMAL(10, 2) NOT NULL COMMENT 'Số điểm trong giao dịch',
    id_giao_dich_doi_chung INT NULL COMMENT 'ID của giao dịch đối chứng (nếu có)',
    noi_dung_giao_dich TEXT NULL COMMENT 'Nội dung giao dịch (có thể NULL)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_nguoi_gui) REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_nguoi_nhan) REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_loai_giao_dich) REFERENCES loai_giao_dich(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_giao_dich_doi_chung) REFERENCES giao_dich(id) ON DELETE SET NULL,
    INDEX idx_nguoi_gui (id_nguoi_gui),
    INDEX idx_nguoi_nhan (id_nguoi_nhan),
    INDEX idx_loai_giao_dich (id_loai_giao_dich),
    INDEX idx_giao_dich_doi_chung (id_giao_dich_doi_chung),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng log
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_giao_dich INT NOT NULL,
    so_diem_con_lai_nguoi_nhan DECIMAL(10, 2) NOT NULL COMMENT 'Số điểm còn lại của người nhận sau giao dịch',
    so_diem_con_lai_nguoi_gui DECIMAL(10, 2) NOT NULL COMMENT 'Số điểm còn lại của người gửi sau giao dịch',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_giao_dich) REFERENCES giao_dich(id) ON DELETE CASCADE,
    INDEX idx_giao_dich (id_giao_dich),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

