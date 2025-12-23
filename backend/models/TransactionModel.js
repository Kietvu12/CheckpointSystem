import pool from '../config/db.js'

class TransactionModel {
  // Lấy tất cả giao dịch với pagination
  static async getAll(page = 1, limit = 60) {
    // Đảm bảo page và limit là số nguyên và hợp lệ
    const pageInt = Math.max(1, parseInt(page, 10) || 1)
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 60))
    const offset = (pageInt - 1) * limitInt
    
    // Lấy tổng số giao dịch
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM giao_dich
    `)
    const total = countResult[0].total
    
    // Lấy danh sách giao dịch với pagination
    const [rows] = await pool.execute(`
      SELECT 
        gd.id,
        gd.id_nguoi_gui,
        gd.id_nguoi_nhan,
        gd.id_loai_giao_dich,
        gd.so_diem_giao_dich,
        gd.diem_sau_giao_dich_nguoi_gui,
        gd.diem_sau_giao_dich_nguoi_nhan,
        gd.id_giao_dich_doi_chung,
        gd.noi_dung_giao_dich,
        gd.trang_thai,
        gd.created_at,
        gd.updated_at,
        lg.ten_loai_giao_dich,
        ng.ten_zalo as ten_nguoi_gui,
        nn.ten_zalo as ten_nguoi_nhan
      FROM giao_dich gd
      LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
      LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
      LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
      ORDER BY gd.created_at DESC
      LIMIT ${limitInt} OFFSET ${offset}
    `)
    
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

  // Lấy giao dịch theo ID (có thể dùng connection từ transaction hoặc pool)
  static async getById(id, connection = null) {
    const db = connection || pool
    const [rows] = await db.execute(`
      SELECT 
        gd.id,
        gd.id_nguoi_gui,
        gd.id_nguoi_nhan,
        gd.id_loai_giao_dich,
        gd.so_diem_giao_dich,
        gd.diem_sau_giao_dich_nguoi_gui,
        gd.diem_sau_giao_dich_nguoi_nhan,
        gd.id_giao_dich_doi_chung,
        gd.noi_dung_giao_dich,
        gd.trang_thai,
        gd.created_at,
        gd.updated_at,
        lg.ten_loai_giao_dich,
        ng.ten_zalo as ten_nguoi_gui,
        nn.ten_zalo as ten_nguoi_nhan
      FROM giao_dich gd
      LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
      LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
      LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
      WHERE gd.id = ?
    `, [id])
    return rows[0]
  }

  // Lấy giao dịch của người dùng (cả gửi và nhận) với pagination
  static async getByUserId(userId, page = 1, limit = 60) {
    // Đảm bảo page và limit là số nguyên và hợp lệ
    const pageInt = Math.max(1, parseInt(page, 10) || 1)
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 60))
    const offset = (pageInt - 1) * limitInt
    
    // Lấy tổng số giao dịch của user
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM giao_dich
      WHERE id_nguoi_gui = ? OR id_nguoi_nhan = ?
    `, [userId, userId])
    const total = countResult[0].total
    
    // Lấy danh sách giao dịch với pagination
    const [rows] = await pool.execute(`
      SELECT 
        gd.id,
        gd.id_nguoi_gui,
        gd.id_nguoi_nhan,
        gd.id_loai_giao_dich,
        gd.so_diem_giao_dich,
        gd.diem_sau_giao_dich_nguoi_gui,
        gd.diem_sau_giao_dich_nguoi_nhan,
        gd.id_giao_dich_doi_chung,
        gd.noi_dung_giao_dich,
        gd.trang_thai,
        gd.created_at,
        gd.updated_at,
        lg.ten_loai_giao_dich,
        ng.ten_zalo as ten_nguoi_gui,
        nn.ten_zalo as ten_nguoi_nhan
      FROM giao_dich gd
      LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
      LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
      LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
      WHERE gd.id_nguoi_gui = ? OR gd.id_nguoi_nhan = ?
      ORDER BY gd.created_at DESC
      LIMIT ${limitInt} OFFSET ${offset}
    `, [userId, userId])
    
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

  // Tạo giao dịch mới
  static async create(transactionData) {
    const { id_nguoi_gui, id_nguoi_nhan, id_loai_giao_dich, so_diem_giao_dich, diem_sau_giao_dich_nguoi_gui, diem_sau_giao_dich_nguoi_nhan, id_giao_dich_doi_chung, noi_dung_giao_dich } = transactionData
    const [result] = await pool.execute(
      'INSERT INTO giao_dich (id_nguoi_gui, id_nguoi_nhan, id_loai_giao_dich, so_diem_giao_dich, diem_sau_giao_dich_nguoi_gui, diem_sau_giao_dich_nguoi_nhan, id_giao_dich_doi_chung, noi_dung_giao_dich) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_nguoi_gui, id_nguoi_nhan, id_loai_giao_dich, so_diem_giao_dich, diem_sau_giao_dich_nguoi_gui || null, diem_sau_giao_dich_nguoi_nhan || null, id_giao_dich_doi_chung || null, noi_dung_giao_dich || null]
    )
    return this.getById(result.insertId)
  }

  // Tạo nhiều giao dịch cùng lúc
  static async createMany(transactionsData) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const placeholders = transactionsData.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
      const values = transactionsData.flatMap(tx => [
        tx.id_nguoi_gui,
        tx.id_nguoi_nhan,
        tx.id_loai_giao_dich,
        tx.so_diem_giao_dich,
        tx.diem_sau_giao_dich_nguoi_gui || null,
        tx.diem_sau_giao_dich_nguoi_nhan || null,
        tx.id_giao_dich_doi_chung || null,
        tx.noi_dung_giao_dich || null
      ])

      const [result] = await connection.execute(
        `INSERT INTO giao_dich (id_nguoi_gui, id_nguoi_nhan, id_loai_giao_dich, so_diem_giao_dich, diem_sau_giao_dich_nguoi_gui, diem_sau_giao_dich_nguoi_nhan, id_giao_dich_doi_chung, noi_dung_giao_dich) VALUES ${placeholders}`,
        values
      )

      await connection.commit()

      // Lấy danh sách giao dịch vừa tạo
      const ids = []
      for (let i = 0; i < transactionsData.length; i++) {
        ids.push(result.insertId + i)
      }
      const [rows] = await connection.execute(`
        SELECT 
          gd.id,
          gd.id_nguoi_gui,
          gd.id_nguoi_nhan,
          gd.id_loai_giao_dich,
          gd.so_diem_giao_dich,
          gd.diem_sau_giao_dich_nguoi_gui,
          gd.diem_sau_giao_dich_nguoi_nhan,
          gd.id_giao_dich_doi_chung,
          gd.noi_dung_giao_dich,
          gd.trang_thai,
          gd.created_at,
          gd.updated_at,
          lg.ten_loai_giao_dich,
          ng.ten_zalo as ten_nguoi_gui,
          nn.ten_zalo as ten_nguoi_nhan
        FROM giao_dich gd
        LEFT JOIN loai_giao_dich lg ON gd.id_loai_giao_dich = lg.id
        LEFT JOIN nguoi_dung ng ON gd.id_nguoi_gui = ng.id
        LEFT JOIN nguoi_dung nn ON gd.id_nguoi_nhan = nn.id
        WHERE gd.id IN (${ids.map(() => '?').join(',')})
        ORDER BY gd.created_at DESC
      `, ids)

      return rows
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  // Lấy loại giao dịch theo tên
  static async getLoaiGiaoDichByName(ten_loai) {
    const [rows] = await pool.execute(
      'SELECT * FROM loai_giao_dich WHERE ten_loai_giao_dich = ?',
      [ten_loai]
    )
    return rows[0]
  }

  // Lấy loại giao dịch theo ID (có thể dùng connection từ transaction hoặc pool)
  static async getLoaiGiaoDichById(id, connection = null) {
    const db = connection || pool
    const [rows] = await db.execute(
      'SELECT * FROM loai_giao_dich WHERE id = ?',
      [id]
    )
    return rows[0]
  }

  // Cập nhật giao dịch (có thể dùng connection từ transaction hoặc pool)
  static async update(id, transactionData, connection = null) {
    const { id_nguoi_gui, id_nguoi_nhan, id_loai_giao_dich, so_diem_giao_dich, noi_dung_giao_dich } = transactionData
    const db = connection || pool
    
    const updateFields = []
    const updateValues = []
    
    if (id_nguoi_gui !== undefined) {
      updateFields.push('id_nguoi_gui = ?')
      updateValues.push(id_nguoi_gui)
    }
    if (id_nguoi_nhan !== undefined) {
      updateFields.push('id_nguoi_nhan = ?')
      updateValues.push(id_nguoi_nhan)
    }
    if (id_loai_giao_dich !== undefined) {
      updateFields.push('id_loai_giao_dich = ?')
      updateValues.push(id_loai_giao_dich)
    }
    if (so_diem_giao_dich !== undefined) {
      updateFields.push('so_diem_giao_dich = ?')
      updateValues.push(so_diem_giao_dich)
    }
    if (noi_dung_giao_dich !== undefined) {
      updateFields.push('noi_dung_giao_dich = ?')
      updateValues.push(noi_dung_giao_dich)
    }
    
    if (updateFields.length === 0) {
      return this.getById(id, connection)
    }
    
    updateFields.push('updated_at = NOW()')
    updateValues.push(id)
    
    await db.execute(
      `UPDATE giao_dich SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    return this.getById(id, connection)
  }

  // Xóa giao dịch
  static async delete(id, connection = null) {
    const db = connection || pool
    await db.execute(
      'DELETE FROM giao_dich WHERE id = ?',
      [id]
    )
  }
}

export default TransactionModel

