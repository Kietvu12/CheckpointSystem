import pool from '../config/db.js'

class ReportModel {
  // Lấy tất cả báo cáo với pagination
  static async getAll(page = 1, limit = 20, filters = {}) {
    // Đảm bảo page và limit là số nguyên và hợp lệ
    const pageInt = Math.max(1, parseInt(page, 10) || 1)
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
    const offset = (pageInt - 1) * limitInt
    let whereClause = 'WHERE 1=1'
    const params = []
    
    // Filter theo ngày
    if (filters.ngay_bao_cao) {
      whereClause += ' AND DATE(ngay_bao_cao) = ?'
      params.push(filters.ngay_bao_cao)
    }
    
    // Filter theo tên (search)
    if (filters.search) {
      whereClause += ' AND ten_bao_cao LIKE ?'
      params.push(`%${filters.search}%`)
    }
    
    // Lấy tổng số báo cáo
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM bao_cao ${whereClause}`,
      params
    )
    const total = countResult[0].total
    
    // Lấy danh sách báo cáo với pagination
    // MySQL không hỗ trợ placeholders cho LIMIT và OFFSET, phải chèn trực tiếp
    // Đã validate ở trên nên an toàn
    const [rows] = await pool.execute(
      `SELECT * FROM bao_cao ${whereClause} ORDER BY created_at DESC LIMIT ${limitInt} OFFSET ${offset}`,
      params
    )
    
    return {
      data: rows,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        totalPages: Math.ceil(total / limitInt)
      }
    }
  }

  // Lấy báo cáo theo ID
  static async getById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM bao_cao WHERE id = ?',
      [id]
    )
    return rows[0]
  }

  // Tạo báo cáo mới
  static async create(reportData) {
    const { ten_bao_cao, ngay_bao_cao, duong_dan_file, loai_bao_cao } = reportData
    const [result] = await pool.execute(
      'INSERT INTO bao_cao (ten_bao_cao, ngay_bao_cao, duong_dan_file, loai_bao_cao) VALUES (?, ?, ?, ?)',
      [ten_bao_cao, ngay_bao_cao, duong_dan_file || null, loai_bao_cao || 'thu_cong']
    )
    return this.getById(result.insertId)
  }

  // Cập nhật đường dẫn file
  static async updateFilePath(id, duong_dan_file) {
    await pool.execute(
      'UPDATE bao_cao SET duong_dan_file = ? WHERE id = ?',
      [duong_dan_file, id]
    )
    return this.getById(id)
  }

  // Kiểm tra xem đã có báo cáo cho ngày này chưa
  static async getByDate(ngay_bao_cao) {
    const [rows] = await pool.execute(
      'SELECT * FROM bao_cao WHERE DATE(ngay_bao_cao) = ? ORDER BY created_at DESC LIMIT 1',
      [ngay_bao_cao]
    )
    return rows[0] || null
  }
}

export default ReportModel

