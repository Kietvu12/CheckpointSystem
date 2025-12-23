import UserModel from '../models/UserModel.js'

class UserController {
  // Lấy tất cả người dùng với pagination
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 60
      
      if (page < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page phải lớn hơn 0'
        })
      }
      
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit phải từ 1 đến 100'
        })
      }
      
      const result = await UserModel.getAll(page, limit)
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get all users error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách người dùng',
        error: error.message
      })
    }
  }

  // Lấy người dùng theo ID
  static async getById(req, res) {
    try {
      const { id } = req.params
      const user = await UserModel.getById(id)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        })
      }

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      console.error('Get user by ID error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng',
        error: error.message
      })
    }
  }

  // Tạo người dùng mới
  static async create(req, res) {
    try {
      const { ten_zalo, sdt, so_diem, la_admin, mat_khau, thong_tin_xe } = req.body

      if (!ten_zalo || !mat_khau) {
        return res.status(400).json({
          success: false,
          message: 'Tên Zalo và mật khẩu là bắt buộc'
        })
      }

      // Kiểm tra tên Zalo đã tồn tại chưa
      const existingUser = await UserModel.getByTenZalo(ten_zalo)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Tên Zalo đã tồn tại'
        })
      }

      const user = await UserModel.create({
        ten_zalo,
        sdt: sdt || null,
        so_diem: so_diem || 0,
        la_admin: la_admin || false,
        mat_khau, // Lưu raw password
        thong_tin_xe: thong_tin_xe || null
      })

      res.status(201).json({
        success: true,
        message: 'Tạo người dùng thành công',
        data: user
      })
    } catch (error) {
      console.error('Create user error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo người dùng',
        error: error.message
      })
    }
  }

  // Tạo nhiều người dùng cùng lúc
  static async createMany(req, res) {
    try {
      const { users } = req.body

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mảng người dùng hợp lệ'
        })
      }

      // Validate từng user
      for (const user of users) {
        if (!user.ten_zalo || !user.mat_khau) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi người dùng phải có tên Zalo và mật khẩu'
          })
        }
      }

      // Kiểm tra tên Zalo trùng lặp
      const tenZaloList = users.map(u => u.ten_zalo)
      const uniqueTenZalo = [...new Set(tenZaloList)]
      if (tenZaloList.length !== uniqueTenZalo.length) {
        return res.status(400).json({
          success: false,
          message: 'Có tên Zalo trùng lặp trong danh sách'
        })
      }

      // Kiểm tra tên Zalo đã tồn tại trong DB
      for (const user of users) {
        const existingUser = await UserModel.getByTenZalo(user.ten_zalo)
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: `Tên Zalo "${user.ten_zalo}" đã tồn tại`
          })
        }
      }

      const result = await UserModel.createMany(
        users.map(user => ({
          ten_zalo: user.ten_zalo,
          sdt: user.sdt || null,
          so_diem: user.so_diem || 0,
          la_admin: user.la_admin || false,
          mat_khau: user.mat_khau, // Lưu raw password
          thong_tin_xe: user.thong_tin_xe || null
        }))
      )

      res.status(201).json({
        success: true,
        message: `Tạo thành công ${result.count} người dùng`,
        data: {
          count: result.count,
          firstInsertId: result.firstInsertId
        }
      })
    } catch (error) {
      console.error('Create many users error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo nhiều người dùng',
        error: error.message
      })
    }
  }

  // Cập nhật người dùng
  static async update(req, res) {
    try {
      const { id } = req.params
      const { ten_zalo, sdt, so_diem, la_admin, mat_khau, thong_tin_xe } = req.body

      const existingUser = await UserModel.getById(id)
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        })
      }

      // Nếu đổi tên Zalo, kiểm tra trùng
      if (ten_zalo && ten_zalo !== existingUser.ten_zalo) {
        const userWithSameName = await UserModel.getByTenZalo(ten_zalo)
        if (userWithSameName) {
          return res.status(400).json({
            success: false,
            message: 'Tên Zalo đã tồn tại'
          })
        }
      }

      const updatedUser = await UserModel.update(id, {
        ten_zalo,
        sdt,
        so_diem,
        la_admin,
        mat_khau, // Lưu raw password nếu có
        thong_tin_xe
      })

      res.json({
        success: true,
        message: 'Cập nhật người dùng thành công',
        data: updatedUser
      })
    } catch (error) {
      console.error('Update user error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật người dùng',
        error: error.message
      })
    }
  }

  // Xóa người dùng
  static async delete(req, res) {
    try {
      const { id } = req.params

      const existingUser = await UserModel.getById(id)
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        })
      }

      // Kiểm tra xem người dùng có giao dịch liên quan không
      const TransactionModel = (await import('../models/TransactionModel.js')).default
      const userTransactions = await TransactionModel.getByUserId(id, 1, 1)
      
      if (userTransactions.data && userTransactions.data.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa người dùng này vì họ có ${userTransactions.pagination?.total || 'nhiều'} giao dịch liên quan. Vui lòng xóa tất cả giao dịch trước khi xóa người dùng.`
        })
      }

      const deleted = await UserModel.delete(id)

      if (deleted) {
        res.json({
          success: true,
          message: 'Xóa người dùng thành công'
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Không thể xóa người dùng'
        })
      }
    } catch (error) {
      console.error('Delete user error:', error)
      
      // Kiểm tra nếu lỗi là do foreign key constraint (RESTRICT)
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message.includes('foreign key constraint')) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa người dùng này vì họ có giao dịch liên quan. Vui lòng xóa tất cả giao dịch trước khi xóa người dùng.'
        })
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa người dùng',
        error: error.message
      })
    }
  }
}

export default UserController

