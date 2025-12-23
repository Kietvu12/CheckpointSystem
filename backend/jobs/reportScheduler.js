import cron from 'node-cron'
import ReportModel from '../models/ReportModel.js'
import pool from '../config/db.js'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Hàm tạo và xuất báo cáo tự động
const generateDailyReport = async () => {
  try {
    console.log('🔄 Bắt đầu tạo báo cáo tự động...')
    
    // Lấy ngày hôm qua (vì chạy vào 23h59)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const ngay_bao_cao = yesterday.toISOString().split('T')[0]
    
    // Kiểm tra xem đã có báo cáo cho ngày này chưa
    const existingReport = await ReportModel.getByDate(ngay_bao_cao)
    if (existingReport) {
      console.log(`⚠️ Đã có báo cáo cho ngày ${ngay_bao_cao}, bỏ qua...`)
      return
    }
    
    // Tạo báo cáo mới
    const ten_bao_cao = `Báo cáo tự động ngày ${ngay_bao_cao}`
    const reportData = {
      ten_bao_cao,
      ngay_bao_cao,
      loai_bao_cao: 'tu_dong'
    }
    
    const report = await ReportModel.create(reportData)
    console.log(`✅ Đã tạo báo cáo: ${report.id}`)
    
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
    `, [ngay_bao_cao])
    
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
    const ngayBaoCaoStr = String(ngay_bao_cao)
    const fileName = `BaoCao_TuDong_${ngayBaoCaoStr.replace(/-/g, '_')}_${Date.now()}.xlsx`
    const filePath = path.join(reportsDir, fileName)
    
    // Ghi file
    XLSX.writeFile(workbook, filePath)
    
    // Cập nhật đường dẫn file trong database
    const relativePath = `reports/${fileName}`
    await ReportModel.updateFilePath(report.id, relativePath)
    
    console.log(`✅ Đã xuất báo cáo Excel: ${fileName}`)
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo tự động:', error)
  }
}

// Lên lịch chạy vào 23h59 mỗi ngày
// Cron expression: 59 23 * * * (giây phút giờ ngày tháng thứ)
cron.schedule('59 23 * * *', () => {
  console.log('⏰ Đã đến 23h59, bắt đầu tạo báo cáo tự động...')
  generateDailyReport()
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
})

console.log('📅 Đã lên lịch tạo báo cáo tự động vào 23h59 mỗi ngày')

export default generateDailyReport

