-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: quanlydiem
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bao_cao`
--

DROP TABLE IF EXISTS `bao_cao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bao_cao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_bao_cao` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên báo cáo (ví dụ: Báo cáo ngày 2024-01-15)',
  `ngay_bao_cao` date NOT NULL COMMENT 'Ngày của báo cáo',
  `duong_dan_file` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Đường dẫn file Excel đã xuất (nếu có)',
  `loai_bao_cao` enum('tu_dong','thu_cong') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'thu_cong' COMMENT 'Loại báo cáo: tự động (23h59) hoặc thủ công',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ngay_bao_cao` (`ngay_bao_cao`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `giao_dich`
--

DROP TABLE IF EXISTS `giao_dich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giao_dich` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_gui` int NOT NULL,
  `id_nguoi_nhan` int NOT NULL,
  `id_loai_giao_dich` int NOT NULL,
  `so_diem_giao_dich` decimal(10,2) NOT NULL COMMENT 'Số điểm trong giao dịch',
  `id_giao_dich_doi_chung` int DEFAULT NULL COMMENT 'ID của giao dịch đối chứng (nếu có)',
  `noi_dung_giao_dich` text COLLATE utf8mb4_unicode_ci COMMENT 'Nội dung giao dịch (có thể NULL)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nguoi_gui` (`id_nguoi_gui`),
  KEY `idx_nguoi_nhan` (`id_nguoi_nhan`),
  KEY `idx_loai_giao_dich` (`id_loai_giao_dich`),
  KEY `idx_giao_dich_doi_chung` (`id_giao_dich_doi_chung`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_giao_dich_nguoi_gui` FOREIGN KEY (`id_nguoi_gui`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_giao_dich_nguoi_nhan` FOREIGN KEY (`id_nguoi_nhan`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `giao_dich_ibfk_3` FOREIGN KEY (`id_loai_giao_dich`) REFERENCES `loai_giao_dich` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `giao_dich_ibfk_4` FOREIGN KEY (`id_giao_dich_doi_chung`) REFERENCES `giao_dich` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loai_giao_dich`
--

DROP TABLE IF EXISTS `loai_giao_dich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loai_giao_dich` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_loai_giao_dich` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '3 loại: San điểm, Giao lịch, Hủy lịch',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_loai_giao_dich` (`ten_loai_giao_dich`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_giao_dich` int NOT NULL,
  `so_diem_con_lai_nguoi_nhan` decimal(10,2) NOT NULL COMMENT 'Số điểm còn lại của người nhận sau giao dịch',
  `so_diem_con_lai_nguoi_gui` decimal(10,2) NOT NULL COMMENT 'Số điểm còn lại của người gửi sau giao dịch',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_giao_dich` (`id_giao_dich`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`id_giao_dich`) REFERENCES `giao_dich` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nguoi_dung` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_zalo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sdt` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_diem` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Số điểm có thể là số thập phân, số âm (vd: -1.5, 2.5, 3, -0.5)',
  `la_admin` tinyint(1) NOT NULL DEFAULT '0',
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mật khẩu đã được hash',
  `thong_tin_xe` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Thông tin xe',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ten_zalo` (`ten_zalo`),
  KEY `idx_sdt` (`sdt`),
  KEY `idx_la_admin` (`la_admin`)
) ENGINE=InnoDB AUTO_INCREMENT=1271 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-06 10:09:29
