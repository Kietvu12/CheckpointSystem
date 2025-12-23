import pool from '../config/db.js'

class UserModel {
  // Lấy tất cả người dùng với pagination
  static async getAll(page = 1, limit = 60) {
    // Đảm bảo page và limit là số nguyên và hợp lệ
    const pageInt = Math.max(1, parseInt(page, 10) || 1)
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 60))
    const offset = (pageInt - 1) * limitInt
    
    // MySQL không hỗ trợ placeholders cho LIMIT và OFFSET, phải chèn trực tiếp
    // Đã validate ở trên nên an toàn
    const [rows] = await pool.execute(
      `SELECT id, ten_zalo, sdt, so_diem, la_admin, thong_tin_xe, created_at, updated_at FROM nguoi_dung ORDER BY id DESC LIMIT ${limitInt} OFFSET ${offset}`
    )
    
    // Đếm tổng số records
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM nguoi_dung'
    )
    const total = countResult[0].total
    
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

  // Lấy người dùng theo ID
  static async getById(id) {
    const [rows] = await pool.execute(
      'SELECT id, ten_zalo, sdt, so_diem, la_admin, thong_tin_xe, created_at, updated_at FROM nguoi_dung WHERE id = ?',
      [id]
    )
    return rows[0]
  }

  // Lấy người dùng theo tên Zalo (so sánh phân biệt dấu)
  static async getByTenZalo(ten_zalo) {
    const [rows] = await pool.execute(
      'SELECT * FROM nguoi_dung WHERE BINARY ten_zalo = ?',
      [ten_zalo]
    )
    return rows[0]
  }

  // Tạo người dùng mới
  static async create(userData) {
    const { ten_zalo, sdt, so_diem, la_admin, mat_khau, thong_tin_xe } = userData
    const [result] = await pool.execute(
      'INSERT INTO nguoi_dung (ten_zalo, sdt, so_diem, la_admin, mat_khau, thong_tin_xe) VALUES (?, ?, ?, ?, ?, ?)',
      [ten_zalo, sdt || null, so_diem || 0, la_admin || false, mat_khau, thong_tin_xe || null]
    )
    return this.getById(result.insertId)
  }

  // Tạo nhiều người dùng cùng lúc (batch insert để xử lý số lượng lớn)
  static async createMany(usersData) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const BATCH_SIZE = 100 // Chia nhỏ thành các batch 100 records
      const totalBatches = Math.ceil(usersData.length / BATCH_SIZE)
      let firstInsertId = null

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, usersData.length)
        const batch = usersData.slice(start, end)

        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
        const values = batch.flatMap(user => [
          user.ten_zalo,
          user.sdt || null,
          user.so_diem || 0,
          user.la_admin || false,
          user.mat_khau,
          user.thong_tin_xe || null
        ])

        const [result] = await connection.execute(
          `INSERT INTO nguoi_dung (ten_zalo, sdt, so_diem, la_admin, mat_khau, thong_tin_xe) VALUES ${placeholders}`,
          values
        )

        if (firstInsertId === null) {
          firstInsertId = result.insertId
        }
      }

      await connection.commit()

      // Trả về số lượng đã tạo thay vì danh sách đầy đủ (tiết kiệm bộ nhớ)
      return {
        count: usersData.length,
        firstInsertId
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  // Cập nhật người dùng
  static async update(id, userData) {
    const { ten_zalo, sdt, so_diem, la_admin, mat_khau, thong_tin_xe } = userData
    const updates = []
    const values = []

    if (ten_zalo !== undefined) {
      updates.push('ten_zalo = ?')
      values.push(ten_zalo)
    }
    if (sdt !== undefined) {
      updates.push('sdt = ?')
      values.push(sdt || null)
    }
    if (so_diem !== undefined) {
      updates.push('so_diem = ?')
      values.push(so_diem)
    }
    if (la_admin !== undefined) {
      updates.push('la_admin = ?')
      values.push(la_admin)
    }
    if (mat_khau !== undefined) {
      updates.push('mat_khau = ?')
      values.push(mat_khau)
    }
    if (thong_tin_xe !== undefined) {
      updates.push('thong_tin_xe = ?')
      values.push(thong_tin_xe || null)
    }

    if (updates.length === 0) {
      return this.getById(id)
    }

    values.push(id)
    await pool.execute(
      `UPDATE nguoi_dung SET ${updates.join(', ')} WHERE id = ?`,
      values
    )
    return this.getById(id)
  }

  // Xóa người dùng
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM nguoi_dung WHERE id = ?', [id])
    return result.affectedRows > 0
  }

  // Cập nhật số điểm (có thể dùng connection từ transaction hoặc pool)
  static async updateDiem(id, so_diem, connection = null) {
    const db = connection || pool
    await db.execute(
      'UPDATE nguoi_dung SET so_diem = ? WHERE id = ?',
      [so_diem, id]
    )
    return this.getById(id)
  }

  // Cập nhật số điểm một cách atomic (cộng/trừ điểm thay vì SET giá trị tuyệt đối)
  // Giúp tránh race condition khi có nhiều giao dịch đồng thời
  static async updateDiemAtomic(id, soDiemThayDoi, connection = null) {
    const db = connection || pool
    await db.execute(
      'UPDATE nguoi_dung SET so_diem = so_diem + ? WHERE id = ?',
      [soDiemThayDoi, id]
    )
    // Lấy điểm mới nhất sau khi cập nhật
    const [rows] = await db.execute(
      'SELECT so_diem FROM nguoi_dung WHERE id = ?',
      [id]
    )
    return parseFloat(rows[0]?.so_diem || 0)
  }
}

export default UserModel

