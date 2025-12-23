import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI, transactionAPI } from '../../service/api'

const QuanLyNguoiDung = ({ isAuthenticated = false, isAdmin = false, onLogout }) => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([]) // Users cho pagination hiện tại
  const [allUsersForSearch, setAllUsersForSearch] = useState([]) // Tất cả users để search
  const [loading, setLoading] = useState(true)
  const [loadingAllUsers, setLoadingAllUsers] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [userToDelete, setUserToDelete] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null)
  const [userTransactions, setUserTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [transactionHistoryPagination, setTransactionHistoryPagination] = useState({
    page: 1,
    limit: 60,
    total: 0,
    totalPages: 0
  })
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
  const [editUserForm, setEditUserForm] = useState({
    ten_zalo: '',
    sdt: '',
    so_diem: '0',
    la_admin: false,
    mat_khau: '',
    thong_tin_xe: ''
  })
  const [multipleUsersText, setMultipleUsersText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState(null) // null, 'asc', 'desc'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 60,
    total: 0,
    totalPages: 0
  })

  // Load all users for search (chỉ load một lần khi mount)
  useEffect(() => {
    loadAllUsersForSearch()
  }, [])

  // Load users on mount and when page changes
  useEffect(() => {
    loadUsers(pagination.page)
  }, [pagination.page])

  // Load all users for search
  const loadAllUsersForSearch = async () => {
    try {
      setLoadingAllUsers(true)
      let allUsers = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const response = await userAPI.getAll(page, 100) // Lấy 100 users mỗi trang
        if (response.success && response.data) {
          allUsers = [...allUsers, ...response.data]
          
          if (response.pagination) {
            hasMore = page < response.pagination.totalPages
            page++
          } else {
            hasMore = response.data.length === 100
            page++
          }
        } else {
          hasMore = false
        }
      }
      
      setAllUsersForSearch(allUsers)
    } catch (err) {
      console.error('Load all users for search error:', err)
    } finally {
      setLoadingAllUsers(false)
    }
  }

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true)
      setError('')
      const response = await userAPI.getAll(page, pagination.limit)
      if (response.success) {
        setUsers(response.data || [])
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.pagination
          }))
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng')
      console.error('Load users error:', err)
    } finally {
      setLoading(false)
    }
  }

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
        await loadUsers(pagination.page) // Reload trang hiện tại
        setSingleUserForm({
          ten_zalo: '',
          sdt: '',
          so_diem: '0',
          la_admin: false,
          mat_khau: '',
          thong_tin_xe: ''
        })
        setShowModal(false)
        alert('Thêm người dùng thành công!')
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
    const pointPattern = /^-?\d+([.,]\d+)?$/ // Số điểm (có thể âm, dùng . hoặc ,)
    const idPattern = /^\d+$/ // Số nguyên (ID ở đầu dòng)
    const phonePattern = /^0\d{8,9}$/ // Số điện thoại (9-10 số, bắt đầu bằng 0)
    
    // Map để theo dõi tên trùng lặp
    const nameCount = new Map()
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      
      // Tách các phần tử bằng khoảng trắng
      const parts = trimmedLine.split(/\s+/).filter(p => p)
      if (parts.length < 1) continue
      
      // Kiểm tra xem có số thứ tự ở đầu không (định dạng UserList.txt)
      const hasIdAtStart = parts.length > 0 && idPattern.test(parts[0])
      const startIndex = hasIdAtStart ? 1 : 0
      
      // Nếu sau khi bỏ ID mà không còn gì, bỏ qua dòng này
      if (startIndex >= parts.length) continue
      
      // Kiểm tra phần cuối có phải là số điểm không
      const lastPart = parts[parts.length - 1]
      const isLastPartPoint = pointPattern.test(lastPart)
      
      let soDiem = 0
      let ten_zalo = ''
      
      if (hasIdAtStart && isLastPartPoint) {
        // ĐỊNH DẠNG UserList.txt: Có số thứ tự ở đầu VÀ có số điểm ở cuối
        // Ví dụ: "78 Cường 0979882226 -0.75" -> Tên: "Cường 0979882226", Điểm: -0.75
        soDiem = parseFloat(lastPart.replace(',', '.')) || 0
        // Lấy TẤT CẢ các phần từ startIndex đến trước phần cuối (bao gồm cả số điện thoại)
        const middleParts = parts.slice(startIndex, parts.length - 1)
        ten_zalo = middleParts.join(' ').trim()
      } else {
        // ĐỊNH DẠNG UserList2.txt: Không có số thứ tự ở đầu HOẶC không có số điểm ở cuối
        // Một dòng = một tên Zalo, giữ nguyên tất cả (bao gồm số điện thoại nếu có)
        // Ví dụ: "Trịnh Tuấn Anh 0968845555" hoặc "Đình Hiếu"
        const allParts = parts.slice(startIndex)
        ten_zalo = allParts.join(' ').trim()
        soDiem = 0 // Mặc định số điểm là 0
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
        // Reload trang đầu tiên sau khi thêm nhiều users
        setPagination(prev => ({ ...prev, page: 1 }))
        await loadUsers(1)
        setMultipleUsersText('')
        setShowModal(false)
        alert(`Thêm thành công ${users.length} người dùng!`)
      }
    } catch (err) {
      setError(err.message || 'Không thể thêm nhiều người dùng')
      console.error('Create multiple users error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setEditUserForm({
      ten_zalo: user.ten_zalo || '',
      sdt: user.sdt || '',
      so_diem: user.so_diem?.toString() || '0',
      la_admin: user.la_admin || false,
      mat_khau: '', // Không hiển thị mật khẩu cũ
      thong_tin_xe: user.thong_tin_xe || ''
    })
    setShowEditModal(true)
  }

  const handleEditUserChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditUserForm({
      ...editUserForm,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    
    try {
      setSubmitting(true)
      setError('')
      const userData = {
        ten_zalo: editUserForm.ten_zalo,
        sdt: editUserForm.sdt || null,
        so_diem: parseFloat(editUserForm.so_diem) || 0,
        la_admin: editUserForm.la_admin,
        thong_tin_xe: editUserForm.thong_tin_xe || null
      }
      
      // Chỉ cập nhật mật khẩu nếu có nhập
      if (editUserForm.mat_khau) {
        userData.mat_khau = editUserForm.mat_khau
      }
      
      const response = await userAPI.update(editingUser.id, userData)
      if (response.success) {
        await loadUsers(pagination.page) // Reload trang hiện tại
        setShowEditModal(false)
        setEditingUser(null)
        setEditUserForm({
          ten_zalo: '',
          sdt: '',
          so_diem: '0',
          la_admin: false,
          mat_khau: ''
        })
        alert('Cập nhật người dùng thành công!')
      }
    } catch (err) {
      setError(err.message || 'Không thể cập nhật người dùng')
      console.error('Update user error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (user) => {
    setUserToDelete(user)
    setDeletePassword('')
    setShowDeleteConfirmModal(true)
    setError('')
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    // Kiểm tra mật khẩu
    if (deletePassword !== '123456') {
      setError('Mật khẩu không đúng. Vui lòng nhập lại.')
      return
    }
    
    try {
      setSubmitting(true)
      setError('')
      const response = await userAPI.delete(userToDelete.id)
      if (response.success) {
        await loadUsers(pagination.page) // Reload trang hiện tại
        await loadAllUsersForSearch() // Reload tất cả users để cập nhật search
        setShowDeleteConfirmModal(false)
        setUserToDelete(null)
        setDeletePassword('')
        alert('Xóa người dùng thành công!')
      }
    } catch (err) {
      setError(err.message || 'Không thể xóa người dùng')
      console.error('Delete user error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false)
    setUserToDelete(null)
    setDeletePassword('')
    setError('')
  }

  // Hàm sắp xếp users theo điểm số
  const sortUsersByPoints = (usersList, order) => {
    if (!order) return usersList
    
    const sorted = [...usersList].sort((a, b) => {
      const pointA = parseFloat(a.so_diem) || 0
      const pointB = parseFloat(b.so_diem) || 0
      
      if (order === 'asc') {
        return pointA - pointB
      } else {
        return pointB - pointA
      }
    })
    
    return sorted
  }

  // Filter users từ toàn bộ danh sách để search (chỉ khi có search hoặc filter)
  const hasSearchOrFilter = searchTerm || roleFilter !== 'all'
  
  let filteredAllUsers = hasSearchOrFilter ? allUsersForSearch.filter(user => {
    const matchesSearch = !searchTerm || 
      user.ten_zalo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sdt?.includes(searchTerm)
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.la_admin) ||
      (roleFilter === 'user' && !user.la_admin)
    
    return matchesSearch && matchesRole
  }) : []
  
  // Áp dụng sắp xếp cho filtered users
  if (hasSearchOrFilter && sortOrder) {
    filteredAllUsers = sortUsersByPoints(filteredAllUsers, sortOrder)
  }

  // Xác định danh sách users để hiển thị
  // Nếu có search/filter: dùng filteredAllUsers
  // Nếu không có search/filter: dùng allUsersForSearch (toàn bộ danh sách) để có thể sắp xếp toàn bộ
  let usersToDisplay = hasSearchOrFilter 
    ? filteredAllUsers 
    : (allUsersForSearch.length > 0 ? allUsersForSearch : users)
  
  // Áp dụng sắp xếp nếu có
  if (sortOrder) {
    usersToDisplay = sortUsersByPoints(usersToDisplay, sortOrder)
  }
  
  // Filter role nếu không có search (vì search đã filter role rồi)
  if (!hasSearchOrFilter && roleFilter !== 'all') {
    usersToDisplay = usersToDisplay.filter(user => {
      const matchesRole = (roleFilter === 'admin' && user.la_admin) ||
        (roleFilter === 'user' && !user.la_admin)
      return matchesRole
    })
  }
  
  // Pagination cho users
  const startIndex = (pagination.page - 1) * pagination.limit
  const endIndex = startIndex + pagination.limit
  const filteredUsers = usersToDisplay.slice(startIndex, endIndex)
  
  // Cập nhật pagination dựa trên usersToDisplay (đã filter và sort)
  const totalUsersForPagination = usersToDisplay.length
  
  const displayPagination = {
    ...pagination,
    total: totalUsersForPagination,
    totalPages: Math.ceil(totalUsersForPagination / pagination.limit) || 1
  }

  // Reset về trang 1 khi search term, role filter hoặc sort order thay đổi
  useEffect(() => {
    if (hasSearchOrFilter || sortOrder) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [searchTerm, roleFilter, sortOrder])

  // Hàm xử lý click sắp xếp
  const handleSortByPoints = () => {
    if (sortOrder === null) {
      setSortOrder('asc') // Lần đầu click: tăng dần
    } else if (sortOrder === 'asc') {
      setSortOrder('desc') // Lần 2 click: giảm dần
    } else {
      setSortOrder(null) // Lần 3 click: bỏ sắp xếp
    }
  }

  // Hàm xử lý click vào user để xem lịch sử giao dịch
  const handleViewTransactionHistory = async (user) => {
    try {
      setSelectedUserForHistory(user)
      setLoadingTransactions(true)
      setError('')
      setTransactionHistoryPagination(prev => ({ ...prev, page: 1 })) // Reset về trang 1
      
      const response = await transactionAPI.getByUserId(user.id, 1, transactionHistoryPagination.limit)
      if (response.success) {
        // Lọc bỏ các giao dịch "Giao lịch" chưa được chốt
        const filteredTransactions = (response.data || []).filter(tx => {
          // Nếu là giao dịch "Giao lịch" và chưa chốt thì không hiển thị
          if (tx.ten_loai_giao_dich === 'Giao lịch' && tx.trang_thai === 'chua_chot') {
            return false
          }
          return true
        })
        setUserTransactions(filteredTransactions)
        if (response.pagination) {
          // Cập nhật total dựa trên số lượng đã filter
          setTransactionHistoryPagination(prev => ({
            ...prev,
            ...response.pagination,
            total: filteredTransactions.length
          }))
        }
        setShowTransactionHistoryModal(true)
      }
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử giao dịch')
      console.error('Load transaction history error:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Load transactions khi page thay đổi
  const loadUserTransactions = async (page) => {
    if (!selectedUserForHistory) return
    
    try {
      setLoadingTransactions(true)
      setError('')
      
      const response = await transactionAPI.getByUserId(selectedUserForHistory.id, page, transactionHistoryPagination.limit)
      if (response.success) {
        // Lọc bỏ các giao dịch "Giao lịch" chưa được chốt
        const filteredTransactions = (response.data || []).filter(tx => {
          // Nếu là giao dịch "Giao lịch" và chưa chốt thì không hiển thị
          if (tx.ten_loai_giao_dich === 'Giao lịch' && tx.trang_thai === 'chua_chot') {
            return false
          }
          return true
        })
        setUserTransactions(filteredTransactions)
        if (response.pagination) {
          // Cập nhật total dựa trên số lượng đã filter
          setTransactionHistoryPagination(prev => ({
            ...prev,
            ...response.pagination,
            total: filteredTransactions.length
          }))
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử giao dịch')
      console.error('Load transaction history error:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Hàm xác định tên và màu sắc của giao dịch dựa trên loại và vai trò
  const getTransactionLabel = (tenLoaiGiaoDich, isSender) => {
    if (tenLoaiGiaoDich === 'Giao lịch') {
      if (isSender) {
        return { label: 'Giao lịch', className: 'bg-green-100 text-green-800' }
      } else {
        return { label: 'Nhận lịch', className: 'bg-red-100 text-red-800' }
      }
    } else if (tenLoaiGiaoDich === 'San điểm') {
      if (isSender) {
        return { label: 'San điểm', className: 'bg-yellow-100 text-yellow-800' }
      } else {
        return { label: 'Nhận san', className: 'bg-blue-100 text-blue-800' }
      }
    } else {
      // Các loại giao dịch khác giữ nguyên
      return { 
        label: tenLoaiGiaoDich, 
        className: 'bg-gray-100 text-gray-800' 
      }
    }
  }

  // Hàm xác định dấu và màu sắc cho số điểm dựa trên loại giao dịch và vai trò
  const getTransactionPointDisplay = (tenLoaiGiaoDich, isSender) => {
    if (tenLoaiGiaoDich === 'Giao lịch') {
      // Người giao lịch nhận điểm (+), người nhận lịch mất điểm (-)
      return {
        sign: isSender ? '+' : '-',
        color: isSender ? 'text-green-600' : 'text-red-600'
      }
    } else if (tenLoaiGiaoDich === 'San điểm') {
      // Người san điểm mất điểm (-), người nhận san nhận điểm (+)
      return {
        sign: isSender ? '-' : '+',
        color: isSender ? 'text-red-600' : 'text-green-600'
      }
    } else {
      // Các loại giao dịch khác: dựa vào giá trị số điểm
      return {
        sign: '',
        color: 'text-gray-900'
      }
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const words = name.split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            {isAuthenticated && isAdmin ? 'Quản lý người dùng' : 'ROOM VIP FULL HOUSE'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-sans">
            {isAuthenticated && isAdmin 
              ? 'Quản lý và theo dõi người dùng trong hệ thống'
              : 'Danh sách thành viên và điểm số'
            }
          </p>
        </div>
        {isAuthenticated && isAdmin ? (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            + Thêm người dùng mới
          </button>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Đăng nhập
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
            />
          </div>
          
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 font-medium">Không có người dùng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Người dùng
                  </th>
                  {/* <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Số điện thoại
                  </th> */}
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      onClick={handleSortByPoints}
                      className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                    >
                      <span>Số điểm</span>
                      <span className="flex flex-col">
                        {sortOrder === 'asc' ? (
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        ) : sortOrder === 'desc' ? (
                          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </th>
                  {isAuthenticated && (
                    <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thông tin xe
                    </th>
                  )}
                  {/* <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vai trò
                  </th> */}
                  <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tiền
                  </th>
                  {isAuthenticated && isAdmin && (
                    <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewTransactionHistory(user)}
                  >
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs sm:text-sm font-semibold mr-2 sm:mr-3">
                          {getInitials(user.ten_zalo)}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{user.ten_zalo}</div>
                          <div className="text-[10px] sm:text-xs font-sans text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    {/* <td className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm md:text-base font-sans text-gray-700">{user.sdt || '-'}</span>
                    </td> */}
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className={`text-xs sm:text-sm md:text-base font-semibold ${parseFloat(user.so_diem) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {parseFloat(user.so_diem).toFixed(2)}
                      </span>
                    </td>
                    {isAuthenticated && (
                      <td className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-sans text-gray-700 max-w-xs">
                        <div className="truncate" title={user.thong_tin_xe || ''}>
                          {user.thong_tin_xe || '-'}
                        </div>
                      </td>
                    )}
                    {/* <td className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                      <span className={`px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs font-semibold rounded-full ${
                        user.la_admin 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.la_admin ? 'Admin' : 'Người dùng'}
                      </span>
                    </td> */}
                    <td className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-[10px] sm:text-xs md:text-sm font-sans text-gray-500">
                      {parseFloat(user.so_diem * 140000).toFixed(2)} VNĐ
                    </td>
                    {isAuthenticated && isAdmin && (
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-[10px] sm:text-xs md:text-sm font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(user)
                          }}
                          className="text-primary hover:text-primary-dark mr-2 sm:mr-3 md:mr-4"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(user)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && displayPagination.totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm font-sans text-gray-700 text-center sm:text-left">
              {hasSearchOrFilter ? (
                <>
                  Hiển thị {((displayPagination.page - 1) * displayPagination.limit) + 1} - {Math.min(displayPagination.page * displayPagination.limit, displayPagination.total)} trong tổng số {displayPagination.total} kết quả tìm kiếm
                </>
              ) : (
                <>
                  Hiển thị {((displayPagination.page - 1) * displayPagination.limit) + 1} - {Math.min(displayPagination.page * displayPagination.limit, displayPagination.total)} trong tổng số {displayPagination.total} người dùng
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={displayPagination.page === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 font-medium">
                Trang {displayPagination.page} / {displayPagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={displayPagination.page >= displayPagination.totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Thêm người dùng mới
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setActiveTab('single')
                  setSingleUserForm({
                    ten_zalo: '',
                    sdt: '',
                    so_diem: '0',
                    la_admin: false,
                    mat_khau: ''
                  })
                  setMultipleUsersText('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
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
                      onClick={() => {
                        setShowModal(false)
                        setSingleUserForm({
                          ten_zalo: '',
                          sdt: '',
                          so_diem: '0',
                          la_admin: false,
                          mat_khau: '',
                          thong_tin_xe: ''
                        })
                      }}
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
                      onClick={() => {
                        setShowModal(false)
                        setMultipleUsersText('')
                      }}
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
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Sửa người dùng
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                  setEditUserForm({
                    ten_zalo: '',
                    sdt: '',
                    so_diem: '0',
                    la_admin: false,
                    mat_khau: ''
                  })
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên Zalo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ten_zalo"
                    value={editUserForm.ten_zalo}
                    onChange={handleEditUserChange}
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
                    value={editUserForm.sdt}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                    placeholder="Nhập số điện thoại (tùy chọn)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điểm
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="so_diem"
                    value={editUserForm.so_diem}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu mới (để trống nếu không đổi)
                  </label>
                  <input
                    type="password"
                    name="mat_khau"
                    value={editUserForm.mat_khau}
                    onChange={handleEditUserChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                    placeholder="Nhập mật khẩu mới (tùy chọn)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thông tin xe
                  </label>
                  <textarea
                    name="thong_tin_xe"
                    value={editUserForm.thong_tin_xe}
                    onChange={handleEditUserChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans resize-none"
                    placeholder="Nhập thông tin xe (tùy chọn)"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="la_admin"
                    id="edit_la_admin"
                    checked={editUserForm.la_admin}
                    onChange={handleEditUserChange}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="edit_la_admin" className="ml-2 text-sm font-medium text-gray-700">
                    Là quản trị viên
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingUser(null)
                      setEditUserForm({
                        ten_zalo: '',
                        sdt: '',
                        so_diem: '0',
                        la_admin: false,
                        mat_khau: ''
                      })
                    }}
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
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistoryModal && selectedUserForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                  Lịch sử giao dịch
                </h2>
                <p className="text-xs sm:text-sm font-sans text-gray-600 mt-1 truncate">
                  {selectedUserForHistory.ten_zalo} (ID: {selectedUserForHistory.id})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTransactionHistoryModal(false)
                  setSelectedUserForHistory(null)
                  setUserTransactions([])
                  setTransactionHistoryPagination({
                    page: 1,
                    limit: 60,
                    total: 0,
                    totalPages: 0
                  })
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              {loadingTransactions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">Đang tải...</p>
                </div>
              ) : userTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm sm:text-base text-gray-600 font-medium">Không có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-600 uppercase">Tổng số giao dịch</p>
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mt-0.5 sm:mt-1">{transactionHistoryPagination.total}</p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-600 uppercase">Điểm hiện tại</p>
                        <p className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mt-0.5 sm:mt-1 ${parseFloat(selectedUserForHistory.so_diem) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {parseFloat(selectedUserForHistory.so_diem).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-600 uppercase">Giá trị (VNĐ)</p>
                        <p className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mt-0.5 sm:mt-1">
                          {parseFloat(selectedUserForHistory.so_diem * 140000).toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Loại
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Đối tác
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Số điểm
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Nội dung
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Ngày giờ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userTransactions.map((tx) => {
                          const isSender = tx.id_nguoi_gui === selectedUserForHistory.id
                          const otherUser = isSender ? tx.ten_nguoi_nhan : tx.ten_nguoi_gui
                          const transactionInfo = getTransactionLabel(tx.ten_loai_giao_dich, isSender)
                          const pointDisplay = getTransactionPointDisplay(tx.ten_loai_giao_dich, isSender)
                          
                          return (
                            <tr key={tx.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-sans text-gray-900">
                                #{tx.id}
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${transactionInfo.className}`}>
                                  {transactionInfo.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-sans text-gray-700">
                                {otherUser || `ID: ${isSender ? tx.id_nguoi_nhan : tx.id_nguoi_gui}`}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`font-semibold ${pointDisplay.color}`}>
                                  {pointDisplay.sign}{Math.abs(parseFloat(tx.so_diem_giao_dich)).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-sans text-gray-700 max-w-xs truncate">
                                {tx.noi_dung_giao_dich || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm font-sans text-gray-500">
                                {formatDateTime(tx.created_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {userTransactions.map((tx) => {
                      const isSender = tx.id_nguoi_gui === selectedUserForHistory.id
                      const otherUser = isSender ? tx.ten_nguoi_nhan : tx.ten_nguoi_gui
                      const transactionInfo = getTransactionLabel(tx.ten_loai_giao_dich, isSender)
                      const pointDisplay = getTransactionPointDisplay(tx.ten_loai_giao_dich, isSender)
                      
                      return (
                        <div key={tx.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap ${transactionInfo.className}`}>
                                {transactionInfo.label}
                              </span>
                              <span className="text-[10px] font-sans text-gray-500">#{tx.id}</span>
                            </div>
                            <span className={`text-sm font-semibold whitespace-nowrap ml-2 ${pointDisplay.color}`}>
                              {pointDisplay.sign}{Math.abs(parseFloat(tx.so_diem_giao_dich)).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-start">
                              <span className="text-[10px] font-semibold text-gray-600 w-16 flex-shrink-0">Đối tác:</span>
                              <span className="text-xs font-sans text-gray-700 flex-1 truncate">
                                {otherUser || `ID: ${isSender ? tx.id_nguoi_nhan : tx.id_nguoi_gui}`}
                              </span>
                            </div>
                            
                            {tx.noi_dung_giao_dich && (
                              <div className="flex items-start">
                                <span className="text-[10px] font-semibold text-gray-600 w-16 flex-shrink-0">Nội dung:</span>
                                <span className="text-xs font-sans text-gray-700 flex-1 break-words">
                                  {tx.noi_dung_giao_dich}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-start">
                              <span className="text-[10px] font-semibold text-gray-600 w-16 flex-shrink-0">Thời gian:</span>
                              <span className="text-xs font-sans text-gray-500 flex-1">
                                {formatDateTime(tx.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {!loadingTransactions && transactionHistoryPagination.totalPages > 1 && (
                    <div className="px-2 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                      <div className="text-[10px] sm:text-xs md:text-sm font-sans text-gray-700 text-center sm:text-left">
                        Hiển thị {((transactionHistoryPagination.page - 1) * transactionHistoryPagination.limit) + 1} - {Math.min(transactionHistoryPagination.page * transactionHistoryPagination.limit, transactionHistoryPagination.total)} trong tổng số {transactionHistoryPagination.total} giao dịch
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const newPage = transactionHistoryPagination.page - 1
                            setTransactionHistoryPagination(prev => ({ ...prev, page: newPage }))
                            loadUserTransactions(newPage)
                          }}
                          disabled={transactionHistoryPagination.page === 1}
                          className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">
                          {transactionHistoryPagination.page} / {transactionHistoryPagination.totalPages}
                        </span>
                        <button
                          onClick={() => {
                            const newPage = transactionHistoryPagination.page + 1
                            setTransactionHistoryPagination(prev => ({ ...prev, page: newPage }))
                            loadUserTransactions(newPage)
                          }}
                          disabled={transactionHistoryPagination.page >= transactionHistoryPagination.totalPages}
                          className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirmModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Xác nhận xóa người dùng
              </h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm font-sans text-gray-700 mb-2">
                  Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete.ten_zalo}</strong> (ID: {userToDelete.id})?
                </p>
                <p className="text-xs font-medium text-red-600 mb-4">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nhập mật khẩu để xác nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Nhập mật khẩu: 123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteConfirm()
                    }
                  }}
                />
                <p className="text-xs text-gray-500 font-sans mt-1">
                  Mật khẩu mặc định: <strong>123456</strong>
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={submitting || !deletePassword}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa người dùng'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuanLyNguoiDung

