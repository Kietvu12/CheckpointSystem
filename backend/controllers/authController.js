import UserModel from '../models/UserModel.js'

class AuthController {
  // Đăng nhập (không hash password, so sánh raw)
  static async login(req, res) {
    try {
      const { ten_zalo, mat_khau } = req.body

      if (!ten_zalo || !mat_khau) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên Zalo và mật khẩu'
        })
      }

      const user = await UserModel.getByTenZalo(ten_zalo)

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tên Zalo hoặc mật khẩu không đúng'
        })
      }

      // So sánh mật khẩu raw (không hash)
      if (user.mat_khau !== mat_khau) {
        return res.status(401).json({
          success: false,
          message: 'Tên Zalo hoặc mật khẩu không đúng'
        })
      }

      // Trả về thông tin user (không trả về mật khẩu)
      const { mat_khau: _, ...userInfo } = user

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: userInfo
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập',
        error: error.message
      })
    }
  }
}

export default AuthController

