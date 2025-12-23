import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../../service/api'

const ThemMoiNguoiDung = ({ isAuthenticated = false, isAdmin = false }) => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('single') // 'single' or 'multiple'
  const [submitting, setSubmitting] = useState(false)
  const [singleUserForm, setSingleUserForm] = useState({
    ten_zalo: '',
    sdt: '',
    so_diem: '0',
    la_admin: false,
    mat_khau: '',
    thong_tin_xe: ''
  })
  const [multipleUsersText, setMultipleUsersText] = useState('')

  const handleSingleUserChange = (e) => {
    const { name, value, type, checked } = e.target
    setSingleUserForm({
      ...singleUserForm,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSingleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      const DEFAULT_PASSWORD = '123456'
      const userData = {
        ten_zalo: singleUserForm.ten_zalo,
        sdt: singleUserForm.sdt || null,
        so_diem: parseFloat(singleUserForm.so_diem) || 0,
        la_admin: singleUserForm.la_admin,
        mat_khau: singleUserForm.mat_khau || DEFAULT_PASSWORD,
        thong_tin_xe: singleUserForm.thong_tin_xe || null
      }
      const response = await userAPI.create(userData)
      if (response.success) {
        setSingleUserForm({
          ten_zalo: '',
          sdt: '',
          so_diem: '0',
          la_admin: false,
          mat_khau: '',
          thong_tin_xe: ''
        })
        alert('Thêm người dùng thành công!')
        // Chuyển về trang danh sách sau khi thêm thành công
        navigate('/danh-sach-nguoi-dung')
      }
    } catch (err) {
      setError(err.message || 'Không thể thêm người dùng')
      console.error('Create user error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const parseMultipleUsers = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const users = []
    const DEFAULT_SDT = '0123456789'
    const DEFAULT_PASSWORD = '123456'
    
    // Regex patterns
    const pointPattern = /^-?\d+([.,]\d+)?\s*$/ // Số điểm ở cuối (có thể âm, dùng . hoặc ,)
    const idPattern = /^\d+\s+/ // Số nguyên ở đầu dòng, theo sau bởi khoảng trắng
    
    // Map để theo dõi tên trùng lặp
    const nameCount = new Map()
    
    for (const line of lines) {
      // Giữ nguyên khoảng trắng ở đầu và cuối để xử lý sau
      let workingLine = line
      
      // Loại bỏ khoảng trắng ở đầu và cuối dòng (nhưng giữ khoảng trắng ở giữa)
      const trimmedLine = workingLine.trim()
      if (!trimmedLine) continue
      
      let soDiem = 0
      let ten_zalo = ''
      
      // Kiểm tra xem có số thứ tự ở đầu không
      const idMatch = trimmedLine.match(idPattern)
      const hasIdAtStart = !!idMatch
      const idLength = hasIdAtStart ? idMatch[0].length : 0
      
      // Kiểm tra phần cuối có phải là số điểm không
      const pointMatch = trimmedLine.match(/\s+(-?\d+([.,]\d+)?)\s*$/)
      const hasPointAtEnd = !!pointMatch && pointPattern.test(pointMatch[1])
      
      if (hasIdAtStart && hasPointAtEnd) {
        // ĐỊNH DẠNG UserList.txt: Có số thứ tự ở đầu VÀ có số điểm ở cuối
        // Ví dụ: "78 Cường 0979882226 -0.75" -> Tên: "Cường 0979882226", Điểm: -0.75
        soDiem = parseFloat(pointMatch[1].replace(',', '.')) || 0
        // Lấy phần giữa (từ sau ID đến trước số điểm), giữ nguyên khoảng trắng
        const nameStart = idLength
        const nameEnd = pointMatch.index
        ten_zalo = trimmedLine.substring(nameStart, nameEnd).trim()
      } else if (hasPointAtEnd) {
        // Có số điểm ở cuối nhưng không có ID ở đầu
        soDiem = parseFloat(pointMatch[1].replace(',', '.')) || 0
        ten_zalo = trimmedLine.substring(0, pointMatch.index).trim()
      } else if (hasIdAtStart) {
        // Có ID ở đầu nhưng không có số điểm ở cuối
        ten_zalo = trimmedLine.substring(idLength).trim()
        soDiem = 0
      } else {
        // Không có ID và không có số điểm - giữ nguyên toàn bộ (trừ khoảng trắng đầu/cuối)
        ten_zalo = trimmedLine
        soDiem = 0
      }
      
      // Validate: phải có tên
      if (!ten_zalo) {
        console.warn('Skipping line without name:', trimmedLine)
        continue
      }
      
      // Xử lý tên trùng lặp: thêm số thứ tự vào cuối tên
      const originalName = ten_zalo
      if (nameCount.has(originalName)) {
        const count = nameCount.get(originalName) + 1
        nameCount.set(originalName, count)
        ten_zalo = `${originalName} (${count})`
      } else {
        nameCount.set(originalName, 1)
      }
      
      // Tạo user object
      users.push({
        ten_zalo,
        sdt: DEFAULT_SDT,
        so_diem: soDiem,
        mat_khau: DEFAULT_PASSWORD,
        la_admin: false
      })
    }
    
    return users
  }

  const handleMultipleUsersSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      const users = parseMultipleUsers(multipleUsersText)
      
      if (users.length === 0) {
        setError('Không có người dùng hợp lệ. Vui lòng kiểm tra định dạng.')
        return
      }
      
      const response = await userAPI.createMany(users)
      if (response.success) {
        setMultipleUsersText('')
        alert(`Thêm thành công ${users.length} người dùng!`)
        // Chuyển về trang danh sách sau khi thêm thành công
        navigate('/danh-sach-nguoi-dung')
      }
    } catch (err) {
      setError(err.message || 'Không thể thêm nhiều người dùng')
      console.error('Create multiple users error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Thêm mới người dùng
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-sans">
            Thêm người dùng mới vào hệ thống
          </p>
        </div>
        <button 
          onClick={() => navigate('/danh-sach-nguoi-dung')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          ← Quay lại danh sách
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-all ${
                activeTab === 'single'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Thêm một người dùng
            </button>
            <button
              onClick={() => setActiveTab('multiple')}
              className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-all ${
                activeTab === 'multiple'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Thêm nhiều người dùng
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {activeTab === 'single' ? (
            // Tab 1: Thêm một người dùng
            <form onSubmit={handleSingleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên Zalo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ten_zalo"
                  value={singleUserForm.ten_zalo}
                  onChange={handleSingleUserChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                  placeholder="Nhập tên Zalo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="sdt"
                  value={singleUserForm.sdt}
                  onChange={handleSingleUserChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                  placeholder="Nhập số điện thoại (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điểm ban đầu
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="so_diem"
                  value={singleUserForm.so_diem}
                  onChange={handleSingleUserChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu <span className="text-gray-400 text-xs">(mặc định: 123456)</span>
                </label>
                <input
                  type="password"
                  name="mat_khau"
                  value={singleUserForm.mat_khau}
                  onChange={handleSingleUserChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                  placeholder="Nhập mật khẩu (để trống sẽ dùng mật khẩu mặc định)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thông tin xe
                </label>
                <textarea
                  name="thong_tin_xe"
                  value={singleUserForm.thong_tin_xe}
                  onChange={handleSingleUserChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans resize-none"
                  placeholder="Nhập thông tin xe (tùy chọn)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="la_admin"
                  id="la_admin"
                  checked={singleUserForm.la_admin}
                  onChange={handleSingleUserChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="la_admin" className="ml-2 text-sm font-medium text-gray-700">
                  Là quản trị viên
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/danh-sach-nguoi-dung')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'Thêm người dùng'
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Tab 2: Thêm nhiều người dùng
            <form onSubmit={handleMultipleUsersSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Danh sách người dùng <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 font-sans mb-3">
                  Dán danh sách người dùng vào đây. Mỗi dòng là một người dùng theo định dạng: <strong>Tên Zalo Số điểm</strong>
                </p>
                <textarea
                  name="multipleUsersText"
                  value={multipleUsersText}
                  onChange={(e) => setMultipleUsersText(e.target.value)}
                  required
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans resize-none font-mono text-sm"
                  placeholder="Ví dụ:&#10;Nguyễn Quốc Đại 0&#10;Vận Tải Minh Tâm -3.25&#10;Huy võ Limosine -0,5&#10;Khang Vũ Airport -0.25"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  📋 Hướng dẫn định dạng:
                </p>
                <ul className="text-xs text-blue-700 font-sans space-y-1 list-disc list-inside">
                  <li>Mỗi dòng là một người dùng</li>
                  <li>Định dạng: <strong>[ID] Tên Zalo Số điểm</strong> (ID tùy chọn)</li>
                  <li>Số điểm ở cuối dòng, có thể dùng dấu chấm (.) hoặc phẩy (,), có thể là số âm</li>
                  <li>Tên Zalo giữ nguyên tất cả (bao gồm cả số điện thoại nếu có)</li>
                  <li>Số điện thoại mặc định: 0123456789</li>
                  <li>Mật khẩu mặc định: 123456</li>
                  <li>Ví dụ: <code>1 Nguyễn Quốc Đại 0</code></li>
                  <li>Ví dụ: <code>78 Cường 0979882226 -0.75</code></li>
                  <li>Ví dụ: <code>Huy võ Limosine -0,5</code></li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/danh-sach-nguoi-dung')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'Thêm nhiều người dùng'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ThemMoiNguoiDung

