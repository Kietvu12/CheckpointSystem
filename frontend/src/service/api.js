// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const REQUEST_TIMEOUT = 30000 // 30 seconds

// Lấy token từ localStorage
const getToken = () => {
  try {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      return userData.token || null
    }
    return null
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

// Lưu token vào localStorage
const setToken = (token) => {
  try {
    const user = localStorage.getItem('user')
    const userData = user ? JSON.parse(user) : {}
    userData.token = token
    localStorage.setItem('user', JSON.stringify(userData))
  } catch (error) {
    console.error('Error setting token:', error)
  }
}

// Helper function để xử lý response
const handleResponse = async (response) => {
  // Kiểm tra nếu response không ok
  if (!response.ok) {
    let errorMessage = 'Có lỗi xảy ra'
    
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
  const data = await response.json()
        errorMessage = data.message || data.error || `Lỗi ${response.status}: ${response.statusText}`
      } else {
        errorMessage = `Lỗi ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      errorMessage = `Lỗi ${response.status}: ${response.statusText}`
    }

    // Xử lý các mã lỗi đặc biệt
    if (response.status === 401) {
      // Unauthorized - xóa token và redirect về login
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }

  // Kiểm tra nếu response rỗng
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return { success: true }
  }

  try {
    const data = await response.json()
  return data
  } catch (error) {
    // Nếu không parse được JSON, trả về response text
    const text = await response.text()
    return { success: true, data: text }
  }
}

// Helper function để tạo request với timeout
const fetchWithTimeout = (url, options, timeout = REQUEST_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}

// Helper function để tạo request options
const createRequestOptions = (method, body = null, token = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  // Sử dụng token từ parameter hoặc từ localStorage
  const authToken = token || getToken()
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`
  }

  return options
}

// Wrapper function cho tất cả API calls
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}${url}`,
      createRequestOptions(options.method || 'GET', options.body, options.token),
      options.timeout
    )
    return await handleResponse(response)
  } catch (error) {
    // Xử lý các lỗi khác nhau
    if (error.message === 'Request timeout') {
      throw new Error('Request timeout. Vui lòng thử lại sau.')
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.')
    }
    throw error
  }
}

// ==================== AUTH API ====================
export const authAPI = {
  // Đăng nhập
  login: async (ten_zalo, mat_khau) => {
    try {
      const data = await apiCall('/auth/login', {
      method: 'POST',
        body: { ten_zalo, mat_khau }
      })
      
      // Lưu thông tin user vào localStorage
      if (data.success && data.data) {
        const userData = {
          ...data.data,
          token: data.data.token || null // Nếu backend trả về token
        }
        localStorage.setItem('user', JSON.stringify(userData))
      }
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('user')
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    const user = authAPI.getCurrentUser()
    return !!user
  }
}

// ==================== USERS API ====================
export const userAPI = {
  // Lấy tất cả người dùng với pagination
  getAll: async (page = 1, limit = 60) => {
    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('limit', limit.toString())
    
    return await apiCall(`/users?${queryParams.toString()}`)
  },

  // Lấy người dùng theo ID
  getById: async (id) => {
    if (!id) {
      throw new Error('ID người dùng là bắt buộc')
    }
    return await apiCall(`/users/${id}`)
  },

  // Tạo người dùng mới
  create: async (userData) => {
    if (!userData.ten_zalo || !userData.mat_khau) {
      throw new Error('Tên Zalo và mật khẩu là bắt buộc')
    }
    return await apiCall('/users', {
      method: 'POST',
      body: userData
    })
  },

  // Tạo nhiều người dùng cùng lúc
  createMany: async (users) => {
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('Danh sách người dùng không hợp lệ')
    }
    return await apiCall('/users/bulk', {
      method: 'POST',
      body: { users }
    })
  },

  // Cập nhật người dùng
  update: async (id, userData) => {
    if (!id) {
      throw new Error('ID người dùng là bắt buộc')
    }
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: userData
    })
  },

  // Xóa người dùng
  delete: async (id) => {
    if (!id) {
      throw new Error('ID người dùng là bắt buộc')
    }
    return await apiCall(`/users/${id}`, {
      method: 'DELETE'
    })
  },
}

// ==================== TRANSACTIONS API ====================
export const transactionAPI = {
  // Lấy tất cả giao dịch với pagination
  getAll: async (page = 1, limit = 60) => {
    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('limit', limit.toString())
    
    return await apiCall(`/transactions?${queryParams.toString()}`)
  },

  // Lấy giao dịch theo ID
  getById: async (id) => {
    if (!id) {
      throw new Error('ID giao dịch là bắt buộc')
    }
    return await apiCall(`/transactions/${id}`)
  },

  // Lấy giao dịch của người dùng với pagination
  getByUserId: async (userId, page = 1, limit = 60) => {
    if (!userId) {
      throw new Error('ID người dùng là bắt buộc')
    }
    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('limit', limit.toString())
    
    return await apiCall(`/transactions/user/${userId}?${queryParams.toString()}`)
  },

  // Tạo giao dịch mới
  create: async (transactionData) => {
    if (!transactionData.id_nguoi_gui || !transactionData.id_nguoi_nhan || 
        !transactionData.id_loai_giao_dich || transactionData.so_diem_giao_dich === undefined) {
      throw new Error('Thiếu thông tin bắt buộc để tạo giao dịch')
    }
    return await apiCall('/transactions', {
      method: 'POST',
      body: transactionData
    })
  },

  // Tạo nhiều giao dịch cùng lúc
  createMany: async (transactions) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('Danh sách giao dịch không hợp lệ')
    }
    return await apiCall('/transactions/bulk', {
      method: 'POST',
      body: { transactions }
    })
  },

  // Cập nhật giao dịch
  update: async (id, transactionData) => {
    if (!id) {
      throw new Error('ID giao dịch là bắt buộc')
    }
    return await apiCall(`/transactions/${id}`, {
      method: 'PUT',
      body: transactionData
    })
  },

  // Xóa giao dịch
  delete: async (id) => {
    if (!id) {
      throw new Error('ID giao dịch là bắt buộc')
    }
    return await apiCall(`/transactions/${id}`, {
      method: 'DELETE'
    })
  },

  // Chốt giao dịch (chuyển từ chưa chốt sang đã chốt)
  chotGiaoDich: async (id) => {
    if (!id) {
      throw new Error('ID giao dịch là bắt buộc')
    }
    return await apiCall(`/transactions/${id}/chot`, {
      method: 'PATCH'
    })
  },

  // Chốt tất cả giao dịch "Giao lịch" chưa chốt
  chotTatCaGiaoDich: async () => {
    return await apiCall('/transactions/chot-tat-ca', {
      method: 'PATCH'
    })
  }
}

// ==================== REPORTS API ====================
export const reportAPI = {
  // Lấy danh sách báo cáo với pagination và filter
  getAll: async (page = 1, limit = 20, filters = {}) => {
    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('limit', limit.toString())
    
    if (filters.ngay_bao_cao) queryParams.append('ngay_bao_cao', filters.ngay_bao_cao)
    if (filters.search) queryParams.append('search', filters.search)
    
    return await apiCall(`/reports/list?${queryParams.toString()}`)
  },

  // Lấy chi tiết báo cáo
  getById: async (id) => {
    if (!id) {
      throw new Error('ID báo cáo là bắt buộc')
    }
    return await apiCall(`/reports/${id}`)
  },

  // Tạo báo cáo mới
  create: async (ngay_bao_cao) => {
    if (!ngay_bao_cao) {
      throw new Error('Ngày báo cáo là bắt buộc')
    }
    return await apiCall('/reports', {
      method: 'POST',
      body: { ngay_bao_cao }
    })
  },

  // Xuất báo cáo ra Excel
  exportToExcel: async (id) => {
    if (!id) {
      throw new Error('ID báo cáo là bắt buộc')
    }
    
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/reports/${id}/export`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Lỗi khi xuất báo cáo')
    }
    
    // Tải file về
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Lấy tên file từ header
    const contentDisposition = response.headers.get('Content-Disposition')
    let fileName = `BaoCao_${id}.xlsx`
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''))
      }
    }
    
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    return { success: true }
  },

  // Lấy báo cáo tổng hợp (API cũ - giữ lại để tương thích)
  getReport: async (params = {}) => {
    const { start_date, end_date, id_nguoi_dung } = params
    const queryParams = new URLSearchParams()
    
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)
    if (id_nguoi_dung) queryParams.append('id_nguoi_dung', id_nguoi_dung)

    const queryString = queryParams.toString()
    const url = `/reports${queryString ? `?${queryString}` : ''}`
    
    return await apiCall(url)
  },

  // Lấy báo cáo theo người dùng
  getReportByUser: async (userId, params = {}) => {
    if (!userId) {
      throw new Error('ID người dùng là bắt buộc')
    }
    
    const { start_date, end_date } = params
    const queryParams = new URLSearchParams()
    
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)

    const queryString = queryParams.toString()
    const url = `/reports/user/${userId}${queryString ? `?${queryString}` : ''}`
    
    return await apiCall(url)
  },
}

// Export default object chứa tất cả APIs
export default {
  auth: authAPI,
  user: userAPI,
  transaction: transactionAPI,
  report: reportAPI,
}

// Export các helper functions nếu cần
export { getToken, setToken, API_BASE_URL }

