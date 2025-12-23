import pool from '../config/db.js'

class LogModel {
  // Tạo log mới (có thể dùng connection từ transaction hoặc pool)
  static async create(logData, connection = null) {
    const { id_giao_dich, so_diem_con_lai_nguoi_nhan, so_diem_con_lai_nguoi_gui } = logData
    const db = connection || pool
    const [result] = await db.execute(
      'INSERT INTO logs (id_giao_dich, so_diem_con_lai_nguoi_nhan, so_diem_con_lai_nguoi_gui) VALUES (?, ?, ?)',
      [id_giao_dich, so_diem_con_lai_nguoi_nhan, so_diem_con_lai_nguoi_gui]
    )
    return result.insertId
  }

  // Lấy log theo ID giao dịch
  static async getByGiaoDichId(id_giao_dich) {
    const [rows] = await pool.execute(
      'SELECT * FROM logs WHERE id_giao_dich = ?',
      [id_giao_dich]
    )
    return rows[0]
  }

  // Lấy log mới nhất theo ID giao dịch
  static async getLatestByTransactionId(id_giao_dich) {
    const [rows] = await pool.execute(
      'SELECT * FROM logs WHERE id_giao_dich = ? ORDER BY id DESC LIMIT 1',
      [id_giao_dich]
    )
    return rows[0]
  }

  // Cập nhật log
  static async update(id, logData, connection = null) {
    const { so_diem_con_lai_nguoi_nhan, so_diem_con_lai_nguoi_gui } = logData
    const db = connection || pool
    await db.execute(
      'UPDATE logs SET so_diem_con_lai_nguoi_nhan = ?, so_diem_con_lai_nguoi_gui = ? WHERE id = ?',
      [so_diem_con_lai_nguoi_nhan, so_diem_con_lai_nguoi_gui, id]
    )
    return id
  }
}

export default LogModel

