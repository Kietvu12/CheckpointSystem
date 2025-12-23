import pool from '../config/db.js'
import ReportModel from '../models/ReportModel.js'
import UserModel from '../models/UserModel.js'
import TransactionModel from '../models/TransactionModel.js'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ReportController {
  // Lấy danh sách báo cáo với pagination và filter
  static async getAllReports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const filters = {
        ngay_bao_cao: req.query.ngay_bao_cao || null,
        search: req.query.search || null
      }
      
      const result = await ReportModel.getAll(page, limit, filters)
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get all reports error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách báo cáo',
        error: error.message
      })
    }
  }

  // Lấy chi tiết báo cáo
  static async getReportById(req, res) {
    try {
      const { id } = req.params
      const report = await ReportModel.getById(id)
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo'
        })
      }
      
      // Lấy danh sách users với điểm hiện tại
      const [users] = await pool.execute(
        'SELECT id, ten_zalo, sdt, so_diem FROM nguoi_dung ORDER BY ten_zalo ASC'
      )
      
      // Lấy danh sách transactions trong ngày báo cáo
      const [transactions] = await pool.execute(`
        SELECT 
          gd.id,
          gd.id_nguoi_gui,
          gd.id_nguoi_nhan,
          gd.id_loai_giao_dich,
          gd.so_diem_giao_dich,
          gd.noi_dung_giao_dich,
          gd.created_at,
          lg.ten_loai_giao_dich,
          ng.ten_zalo as ten_nguoi_gui,
          nn.ten_zalo as ten_nguoi_nhan
        FROM giao_dich gd
        LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
        LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
        LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
        WHERE DATE(gd.created_at) = ?
        ORDER BY gd.created_at DESC
      `, [report.ngay_bao_cao])
      
      res.json({
        success: true,
        data: {
          report,
          users,
          transactions
        }
      })
    } catch (error) {
      console.error('Get report by ID error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết báo cáo',
        error: error.message
      })
    }
  }

  // Tạo báo cáo mới
  static async createReport(req, res) {
    try {
      const { ngay_bao_cao } = req.body
      
      if (!ngay_bao_cao) {
        return res.status(400).json({
          success: false,
          message: 'Ngày báo cáo là bắt buộc'
        })
      }
      
      // Kiểm tra xem đã có báo cáo cho ngày này chưa
      const existingReport = await ReportModel.getByDate(ngay_bao_cao)
      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'Đã có báo cáo cho ngày này'
        })
      }
      
      const ten_bao_cao = `Báo cáo ngày ${ngay_bao_cao}`
      const reportData = {
        ten_bao_cao,
        ngay_bao_cao,
        loai_bao_cao: 'thu_cong'
      }
      
      const report = await ReportModel.create(reportData)
      
      res.json({
        success: true,
        data: report
      })
    } catch (error) {
      console.error('Create report error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo báo cáo',
        error: error.message
      })
    }
  }

  // Xuất báo cáo ra Excel
  static async exportToExcel(req, res) {
    try {
      const { id } = req.params
      const report = await ReportModel.getById(id)
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo'
        })
      }
      
      // Lấy danh sách users với điểm tại thời điểm báo cáo
      // Lấy điểm từ logs tại thời điểm cuối cùng trong ngày báo cáo, nếu không có thì lấy điểm hiện tại
      const [users] = await pool.execute(`
        SELECT 
          nd.id,
          nd.ten_zalo,
          nd.sdt,
          COALESCE(
            (SELECT 
              CASE 
                WHEN gd.id_nguoi_nhan = nd.id THEN l.so_diem_con_lai_nguoi_nhan
                WHEN gd.id_nguoi_gui = nd.id THEN l.so_diem_con_lai_nguoi_gui
              END
            FROM logs l
            INNER JOIN giao_dich gd ON l.id_giao_dich = gd.id
            WHERE DATE(gd.created_at) = ? 
              AND (gd.id_nguoi_gui = nd.id OR gd.id_nguoi_nhan = nd.id)
            ORDER BY l.created_at DESC
            LIMIT 1),
            nd.so_diem
          ) as so_diem
        FROM nguoi_dung nd
        ORDER BY nd.ten_zalo ASC
      `, [report.ngay_bao_cao])
      
      // Lấy danh sách transactions trong ngày báo cáo
      const [transactions] = await pool.execute(`
        SELECT 
          gd.id,
          gd.id_nguoi_gui,
          gd.id_nguoi_nhan,
          gd.id_loai_giao_dich,
          gd.so_diem_giao_dich,
          gd.noi_dung_giao_dich,
          gd.created_at,
          lg.ten_loai_giao_dich,
          ng.ten_zalo as ten_nguoi_gui,
          nn.ten_zalo as ten_nguoi_nhan
        FROM giao_dich gd
        LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
        LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
        LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
        WHERE DATE(gd.created_at) = ?
        ORDER BY gd.created_at DESC
      `, [report.ngay_bao_cao])
      
      // Tạo workbook
      const workbook = XLSX.utils.book_new()
      
      // Sheet 1: Danh sách thành viên
      const usersData = users.map(user => ({
        'ID': user.id,
        'Tên Zalo': user.ten_zalo,
        'Số điện thoại': user.sdt || '',
        'Điểm hiện tại': parseFloat(user.so_diem)
      }))
      const usersSheet = XLSX.utils.json_to_sheet(usersData)
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Danh sách thành viên')
      
      // Sheet 2: Danh sách giao dịch
      const transactionsData = transactions.map(tx => ({
        'ID': tx.id,
        'Người gửi': tx.ten_nguoi_gui,
        'Người nhận': tx.ten_nguoi_nhan,
        'Loại giao dịch': tx.ten_loai_giao_dich,
        'Số điểm': parseFloat(tx.so_diem_giao_dich),
        'Nội dung': tx.noi_dung_giao_dich || '',
        'Ngày giờ': new Date(tx.created_at).toLocaleString('vi-VN')
      }))
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Danh sách giao dịch')
      
      // Tạo thư mục reports nếu chưa có
      const reportsDir = path.join(__dirname, '../reports')
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }
      
      // Tên file
      // Đảm bảo ngay_bao_cao là string
      const ngayBaoCaoStr = report.ngay_bao_cao instanceof Date 
        ? report.ngay_bao_cao.toISOString().split('T')[0]
        : String(report.ngay_bao_cao)
      const fileName = `BaoCao_${ngayBaoCaoStr.replace(/-/g, '_')}_${Date.now()}.xlsx`
      const filePath = path.join(reportsDir, fileName)
      
      // Ghi file
      XLSX.writeFile(workbook, filePath)
      
      // Cập nhật đường dẫn file trong database
      const relativePath = `reports/${fileName}`
      await ReportModel.updateFilePath(id, relativePath)
      
      // Gửi file về client
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
      
      const fileBuffer = fs.readFileSync(filePath)
      res.send(fileBuffer)
    } catch (error) {
      console.error('Export to Excel error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất báo cáo Excel',
        error: error.message
      })
    }
  }
  // Xuất báo cáo tổng hợp
  static async getReport(req, res) {
    try {
      const { start_date, end_date, id_nguoi_dung } = req.query

      let query = `
        SELECT 
          gd.id,
          gd.id_nguoi_gui,
          gd.id_nguoi_nhan,
          gd.id_loai_giao_dich,
          gd.so_diem_giao_dich,
          gd.id_giao_dich_doi_chung,
          gd.noi_dung_giao_dich,
          gd.created_at,
          lg.ten_loai_giao_dich,
          ng.ten_zalo as ten_nguoi_gui,
          ng.sdt as sdt_nguoi_gui,
          nn.ten_zalo as ten_nguoi_nhan,
          nn.sdt as sdt_nguoi_nhan,
          l.so_diem_con_lai_nguoi_gui,
          l.so_diem_con_lai_nguoi_nhan
        FROM giao_dich gd
        LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
        LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
        LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
        LEFT JOIN logs l ON gd.id = l.id_giao_dich
        WHERE 1=1
      `

      const params = []

      if (start_date) {
        query += ' AND DATE(gd.created_at) >= ?'
        params.push(start_date)
      }

      if (end_date) {
        query += ' AND DATE(gd.created_at) <= ?'
        params.push(end_date)
      }

      if (id_nguoi_dung) {
        query += ' AND (gd.id_nguoi_gui = ? OR gd.id_nguoi_nhan = ?)'
        params.push(id_nguoi_dung, id_nguoi_dung)
      }

      query += ' ORDER BY gd.created_at DESC'

      const [transactions] = await pool.execute(query, params)

      // Thống kê tổng hợp
      const stats = {
        tong_giao_dich: transactions.length,
        tong_diem_giao_dich: 0,
        theo_loai: {
          'San điểm': { so_luong: 0, tong_diem: 0 },
          'Giao lịch': { so_luong: 0, tong_diem: 0 },
          'Hủy lịch': { so_luong: 0, tong_diem: 0 }
        }
      }

      transactions.forEach(tx => {
        const diem = parseFloat(tx.so_diem_giao_dich)
        stats.tong_diem_giao_dich += Math.abs(diem)
        
        if (stats.theo_loai[tx.ten_loai_giao_dich]) {
          stats.theo_loai[tx.ten_loai_giao_dich].so_luong++
          stats.theo_loai[tx.ten_loai_giao_dich].tong_diem += Math.abs(diem)
        }
      })

      res.json({
        success: true,
        data: {
          transactions,
          stats
        }
      })
    } catch (error) {
      console.error('Get report error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất báo cáo',
        error: error.message
      })
    }
  }

  // Báo cáo theo người dùng
  static async getReportByUser(req, res) {
    try {
      const { userId } = req.params
      const { start_date, end_date } = req.query

      let query = `
        SELECT 
          gd.id,
          gd.id_nguoi_gui,
          gd.id_nguoi_nhan,
          gd.id_loai_giao_dich,
          gd.so_diem_giao_dich,
          gd.id_giao_dich_doi_chung,
          gd.noi_dung_giao_dich,
          gd.created_at,
          lg.ten_loai_giao_dich,
          ng.ten_zalo as ten_nguoi_gui,
          nn.ten_zalo as ten_nguoi_nhan,
          l.so_diem_con_lai_nguoi_gui,
          l.so_diem_con_lai_nguoi_nhan,
          CASE 
            WHEN gd.id_nguoi_gui = ? THEN 'Gửi'
            WHEN gd.id_nguoi_nhan = ? THEN 'Nhận'
          END as vai_tro
        FROM giao_dich gd
        LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
        LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
        LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
        LEFT JOIN logs l ON gd.id = l.id_giao_dich
        WHERE (gd.id_nguoi_gui = ? OR gd.id_nguoi_nhan = ?)
      `

      const params = [userId, userId, userId, userId]

      if (start_date) {
        query += ' AND DATE(gd.created_at) >= ?'
        params.push(start_date)
      }

      if (end_date) {
        query += ' AND DATE(gd.created_at) <= ?'
        params.push(end_date)
      }

      query += ' ORDER BY gd.created_at DESC'

      const [transactions] = await pool.execute(query, params)

      // Lấy thông tin người dùng
      const [user] = await pool.execute(
        'SELECT * FROM nguoi_dung WHERE id = ?',
        [userId]
      )

      if (!user[0]) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        })
      }

      // Thống kê
      const stats = {
        tong_giao_dich: transactions.length,
        tong_diem_nhan: 0,
        tong_diem_gui: 0,
        diem_hien_tai: parseFloat(user[0].so_diem),
        theo_loai: {
          'San điểm': { so_luong: 0, tong_diem: 0 },
          'Giao lịch': { so_luong: 0, tong_diem: 0 },
          'Hủy lịch': { so_luong: 0, tong_diem: 0 }
        }
      }

      transactions.forEach(tx => {
        const diem = parseFloat(tx.so_diem_giao_dich)
        
        if (tx.vai_tro === 'Nhận') {
          stats.tong_diem_nhan += Math.abs(diem)
        } else {
          stats.tong_diem_gui += Math.abs(diem)
        }

        if (stats.theo_loai[tx.ten_loai_giao_dich]) {
          stats.theo_loai[tx.ten_loai_giao_dich].so_luong++
          stats.theo_loai[tx.ten_loai_giao_dich].tong_diem += Math.abs(diem)
        }
      })

      res.json({
        success: true,
        data: {
          user: {
            id: user[0].id,
            ten_zalo: user[0].ten_zalo,
            sdt: user[0].sdt,
            so_diem: user[0].so_diem
          },
          transactions,
          stats
        }
      })
    } catch (error) {
      console.error('Get report by user error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất báo cáo người dùng',
        error: error.message
      })
    }
  }
}

export default ReportController

