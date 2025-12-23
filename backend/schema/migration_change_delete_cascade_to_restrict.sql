-- Migration: Thay đổi ON DELETE CASCADE thành RESTRICT cho bảng giao_dich
-- Mục đích: Bảo vệ dữ liệu giao dịch khi xóa người dùng
-- Ngày tạo: 2025-01-XX

-- Lưu ý: Migration này sẽ ngăn việc xóa người dùng nếu họ có giao dịch liên quan
-- Để xóa người dùng, cần xóa tất cả giao dịch liên quan trước

-- Bước 1: Xóa foreign key constraints cũ
ALTER TABLE giao_dich 
DROP FOREIGN KEY giao_dich_ibfk_1; -- id_nguoi_gui

ALTER TABLE giao_dich 
DROP FOREIGN KEY giao_dich_ibfk_2; -- id_nguoi_nhan

-- Bước 2: Tạo lại foreign key constraints với RESTRICT
ALTER TABLE giao_dich 
ADD CONSTRAINT fk_giao_dich_nguoi_gui 
FOREIGN KEY (id_nguoi_gui) 
REFERENCES nguoi_dung(id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

ALTER TABLE giao_dich 
ADD CONSTRAINT fk_giao_dich_nguoi_nhan 
FOREIGN KEY (id_nguoi_nhan) 
REFERENCES nguoi_dung(id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Lưu ý: Nếu tên foreign key constraint khác, cần kiểm tra bằng lệnh:
-- SHOW CREATE TABLE giao_dich;
-- Sau đó thay thế tên constraint trong các lệnh DROP FOREIGN KEY ở trên

