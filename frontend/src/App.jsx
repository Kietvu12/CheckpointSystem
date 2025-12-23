import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './page/Login'
import Layout from './components/Layout'
import QuanLyNguoiDung from './page/Admin/QuanLyNguoiDung'
import DanhSachNguoiDung from './page/Admin/DanhSachNguoiDung'
import ThemMoiNguoiDung from './page/Admin/ThemMoiNguoiDung'
import DanhSachGiaoDich from './page/Admin/DanhSachGiaoDich'
import TaoMoiGiaoDich from './page/Admin/TaoMoiGiaoDich'
import DanhSachBaoCao from './page/Admin/DanhSachBaoCao'
import { authAPI } from './service/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = authAPI.getCurrentUser()
        if (user) {
          setIsAuthenticated(true)
          setIsAdmin(user.la_admin || false)
        } else {
          setIsAuthenticated(false)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setIsAdmin(userData?.la_admin || false)
  }

  const handleLogout = () => {
    authAPI.logout()
    setIsAuthenticated(false)
    setIsAdmin(false)
  }

  // Show loading while checking auth
  if (loading) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 font-sans-medium">Đang tải...</p>
      </div>
      </div>
    )
  }

  return (
    <BrowserRouter basename="/quanlydiem">
      <Routes>
        {/* Public Route - Login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/danh-sach-giao-dich" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />

        {/* Public Route - Quản lý người dùng (có thể xem khi chưa đăng nhập) - Redirect về danh sách */}
        <Route
          path="/quan-ly-nguoi-dung"
          element={
            <Navigate to="/danh-sach-nguoi-dung" replace />
          }
        />
        
        {/* Public Route - Danh sách người dùng (có thể xem khi chưa đăng nhập) */}
        <Route
          path="/danh-sach-nguoi-dung"
          element={
            <Layout isAdmin={isAuthenticated && isAdmin} showSidebar={isAuthenticated && isAdmin} onLogout={handleLogout}>
              <DanhSachNguoiDung isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={handleLogout} />
            </Layout>
          }
        />
        
        {/* Protected Route - Thêm mới người dùng (chỉ admin) */}
        <Route
          path="/them-moi-nguoi-dung"
          element={
            isAuthenticated && isAdmin ? (
              <Layout isAdmin={isAdmin} showSidebar={isAdmin} onLogout={handleLogout}>
                <ThemMoiNguoiDung isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Protected Routes - Admin */}
        {/* Route cũ - redirect về danh sách */}
        <Route
          path="/quan-ly-giao-dich"
          element={
            <Navigate to="/danh-sach-giao-dich" replace />
          }
        />
        
        {/* Danh sách giao dịch */}
        <Route
          path="/danh-sach-giao-dich"
          element={
            isAuthenticated && isAdmin ? (
              <Layout isAdmin={isAdmin}>
                <DanhSachGiaoDich />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Tạo mới giao dịch */}
        <Route
          path="/tao-moi-giao-dich"
          element={
            isAuthenticated && isAdmin ? (
              <Layout isAdmin={isAdmin}>
                <TaoMoiGiaoDich />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/danh-sach-bao-cao"
          element={
            isAuthenticated && isAdmin ? (
              <Layout isAdmin={isAdmin}>
                <DanhSachBaoCao />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-sans-medium">Đang tải...</p>
                </div>
              </div>
            ) : (
              <Navigate to="/danh-sach-nguoi-dung" replace />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
