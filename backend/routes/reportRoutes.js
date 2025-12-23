import express from 'express'
import ReportController from '../controllers/reportController.js'

const router = express.Router()

// Lấy danh sách báo cáo (với pagination và filter)
router.get('/list', ReportController.getAllReports)

// Lấy chi tiết báo cáo
router.get('/:id', ReportController.getReportById)

// Tạo báo cáo mới
router.post('/', ReportController.createReport)

// Xuất báo cáo ra Excel
router.get('/:id/export', ReportController.exportToExcel)

// Xuất báo cáo tổng hợp (API cũ - giữ lại để tương thích)
router.get('/', ReportController.getReport)

// Báo cáo theo người dùng
router.get('/user/:userId', ReportController.getReportByUser)

export default router

