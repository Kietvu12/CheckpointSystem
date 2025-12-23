-- Seed data for Quản Lý Điểm System
-- Run this after creating the schema

-- Insert default transaction types (if not already inserted)
INSERT IGNORE INTO loai_giao_dich (id, ten_loai_giao_dich) VALUES
(1, 'San điểm'),
(2, 'Giao lịch'),
(3, 'Hủy lịch');

-- Insert sample admin user (password should be hashed in production)
-- Default password: admin123 (should be hashed using bcrypt or similar)
INSERT INTO nguoi_dung (ten_zalo, sdt, so_diem, la_admin, mat_khau) VALUES
('Admin', '0123456789', 0.00, TRUE, '$2b$10$YourHashedPasswordHere');

-- Insert sample regular users
INSERT INTO nguoi_dung (ten_zalo, sdt, so_diem, la_admin, mat_khau) VALUES
('Nguyễn Văn A', '0987654321', 10.50, FALSE, '$2b$10$YourHashedPasswordHere'),
('Trần Thị B', '0912345678', -1.50, FALSE, '$2b$10$YourHashedPasswordHere'),
('Lê Văn C', NULL, 5.25, FALSE, '$2b$10$YourHashedPasswordHere');

