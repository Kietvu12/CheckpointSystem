import React, { useState, useEffect, useCallback, useRef } from 'react'
import { transactionAPI, userAPI } from '../../service/api'

const QuanLyGiaoDich = () => {
  const [transactions, setTransactions] = useState([])
  const [allTransactionsForCancelCheck, setAllTransactionsForCancelCheck] = useState([]) // Tất cả transactions để check "Đã hủy"
  const [allTransactionsForFilter, setAllTransactionsForFilter] = useState([]) // Tất cả transactions để filter
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingAllTransactions, setLoadingAllTransactions] = useState(false)
  const [error, setError] = useState('')
  const [mainTab, setMainTab] = useState('create') // 'create' or 'list'
  const [submitting, setSubmitting] = useState(false)
  
  // State cho modal sửa giao dịch
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [editForm, setEditForm] = useState({
    id_nguoi_gui: '',
    id_nguoi_nhan: '',
    id_loai_giao_dich: '',
    so_diem_giao_dich: '',
    noi_dung_giao_dich: ''
  })
  
  // Form tạo giao dịch - mảng các giao dịch
  const [transactionRows, setTransactionRows] = useState([
    {
      id: 1,
      id_nguoi_gui: '',
      id_nguoi_nhan: '',
      id_loai_giao_dich: '',
      so_diem_giao_dich: '',
      noi_dung_giao_dich: '',
      nguoi_gui_text: '',
      nguoi_nhan_text: ''
    }
  ])
  
  // State cho autocomplete
  const [autocompleteState, setAutocompleteState] = useState({
    rowId: null,
    field: null, // 'nguoi_gui' or 'nguoi_nhan'
    isOpen: false
  })
  
  // State cho autocomplete trong modal edit
  const [editAutocompleteState, setEditAutocompleteState] = useState({
    field: null,
    isOpen: false
  })
  
  const [editFormText, setEditFormText] = useState({
    nguoi_gui_text: '',
    nguoi_nhan_text: ''
  })
  
  // Textarea cho parse tin nhắn
  const [giaoLichText, setGiaoLichText] = useState('')
  const [sanDiemText, setSanDiemText] = useState('')
  
  // Refs cho debounce timers
  const giaoLichTimerRef = useRef(null)
  const sanDiemTimerRef = useRef(null)
  
  // Refs cho autocomplete dropdown
  const autocompleteRefs = useRef({})
  const editAutocompleteRefs = useRef({})
  
  // Lưu lại các text đã parse để tránh parse lại (dùng Set để lưu nhiều text)
  const parsedGiaoLichTextsRef = useRef(new Set())
  const parsedSanDiemTextsRef = useRef(new Set())
  
  // Flag để bỏ qua onChange khi vừa paste xong
  const isPastingGiaoLichRef = useRef(false)
  const isPastingSanDiemRef = useRef(false)
  
  // Filters
  const [filterLoaiGiaoDich, setFilterLoaiGiaoDich] = useState('all') // 'all', '1', '2', '3'
  const [filterTrangThai, setFilterTrangThai] = useState('all') // 'all', 'chua_chot', 'da_chot'
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // Tìm kiếm theo nội dung
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 60,
    total: 0,
    totalPages: 0
  })
  

  // Loại giao dịch (chỉ hiển thị 2 loại)
  const loaiGiaoDichOptions = [
    { id: 2, ten: 'Giao lịch' },
    { id: 1, ten: 'San điểm' }
  ]

  const loadTransactions = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError('')
      const response = await transactionAPI.getAll(page, pagination.limit)
      if (response.success) {
        setTransactions(response.data || [])
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.pagination
          }))
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách giao dịch')
      console.error('Load transactions error:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true)
      // Lấy tất cả users bằng cách lặp qua các trang
      let allUsers = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const response = await userAPI.getAll(page, 100) // Lấy 100 users mỗi trang
        if (response.success && response.data) {
          allUsers = [...allUsers, ...response.data]
          
          // Kiểm tra xem còn trang nào không
          if (response.pagination) {
            hasMore = page < response.pagination.totalPages
            page++
          } else {
            hasMore = response.data.length === 100 // Nếu không có pagination, dựa vào số lượng
            page++
          }
        } else {
          hasMore = false
        }
      }
      
      setUsers(allUsers)
      console.log('Loaded users:', allUsers.length)
    } catch (err) {
      console.error('Load users error:', err)
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  // Load all transactions for cancel check (chỉ load một lần khi mount)
  useEffect(() => {
    loadAllTransactionsForCancelCheck()
    loadAllTransactionsForFilter()
  }, [])

  // Load transactions on mount and when page changes
  useEffect(() => {
    loadTransactions(pagination.page)
  }, [pagination.page, loadTransactions])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Load all transactions để check "Đã hủy"
  const loadAllTransactionsForCancelCheck = async () => {
    try {
      let allTransactions = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const response = await transactionAPI.getAll(page, 100) // Lấy 100 transactions mỗi trang
        if (response.success && response.data) {
          allTransactions = [...allTransactions, ...response.data]
          
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
      
      setAllTransactionsForCancelCheck(allTransactions)
    } catch (err) {
      console.error('Load all transactions for cancel check error:', err)
    }
  }

  // Load all transactions để filter
  const loadAllTransactionsForFilter = async () => {
    try {
      setLoadingAllTransactions(true)
      let allTransactions = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const response = await transactionAPI.getAll(page, 100) // Lấy 100 transactions mỗi trang
        if (response.success && response.data) {
          allTransactions = [...allTransactions, ...response.data]
          
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
      
      setAllTransactionsForFilter(allTransactions)
    } catch (err) {
      console.error('Load all transactions for filter error:', err)
    } finally {
      setLoadingAllTransactions(false)
    }
  }

  // Xử lý thay đổi trong một hàng
  const handleRowChange = (rowId, field, value) => {
    setTransactionRows(rows => 
      rows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    )
  }
  
  // Lọc users dựa trên search text
  const filterUsers = (searchText) => {
    if (!searchText || !searchText.trim()) return users
    const search = searchText.toLowerCase().trim()
    return users.filter(user => 
      user.ten_zalo?.toLowerCase().includes(search)
    )
  }
  
  // Handle input change cho autocomplete
  const handleAutocompleteInputChange = (rowId, field, value) => {
    const textField = field === 'id_nguoi_gui' ? 'nguoi_gui_text' : 'nguoi_nhan_text'
    setTransactionRows(rows =>
      rows.map(row =>
        row.id === rowId ? { ...row, [textField]: value, [field]: '' } : row
      )
    )
    setAutocompleteState({
      rowId,
      field,
      isOpen: value.trim().length > 0
    })
  }
  
  // Handle select user từ dropdown
  const handleSelectUser = (rowId, field, user) => {
    const textField = field === 'id_nguoi_gui' ? 'nguoi_gui_text' : 'nguoi_nhan_text'
    setTransactionRows(rows =>
      rows.map(row =>
        row.id === rowId ? { ...row, [textField]: user.ten_zalo, [field]: user.id.toString() } : row
      )
    )
    setAutocompleteState({ rowId: null, field: null, isOpen: false })
  }
  
  // Handle input change cho edit modal autocomplete
  const handleEditAutocompleteInputChange = (field, value) => {
    const textField = field === 'id_nguoi_gui' ? 'nguoi_gui_text' : 'nguoi_nhan_text'
    setEditFormText(prev => ({ ...prev, [textField]: value }))
    setEditForm(prev => ({ ...prev, [field]: '' }))
    setEditAutocompleteState({
      field,
      isOpen: value.trim().length > 0
    })
  }
  
  // Handle select user trong edit modal
  const handleEditSelectUser = (field, user) => {
    const textField = field === 'id_nguoi_gui' ? 'nguoi_gui_text' : 'nguoi_nhan_text'
    setEditFormText(prev => ({ ...prev, [textField]: user.ten_zalo }))
    setEditForm(prev => ({ ...prev, [field]: user.id.toString() }))
    setEditAutocompleteState({ field: null, isOpen: false })
  }

  // Thêm hàng mới
  const handleAddRow = () => {
    const newId = Math.max(...transactionRows.map(r => r.id), 0) + 1
    setTransactionRows([...transactionRows, {
      id: newId,
      id_nguoi_gui: '',
      id_nguoi_nhan: '',
      id_loai_giao_dich: '',
      so_diem_giao_dich: '',
      noi_dung_giao_dich: '',
      nguoi_gui_text: '',
      nguoi_nhan_text: ''
    }])
  }
  
  // Handle click outside để đóng autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check for main form autocomplete
      if (autocompleteState.isOpen) {
        const refKey = `${autocompleteState.rowId}_${autocompleteState.field}`
        const ref = autocompleteRefs.current[refKey]
        if (ref && !ref.contains(event.target)) {
          setAutocompleteState({ rowId: null, field: null, isOpen: false })
        }
      }
      
      // Check for edit modal autocomplete
      if (editAutocompleteState.isOpen) {
        const ref = editAutocompleteRefs.current[editAutocompleteState.field]
        if (ref && !ref.contains(event.target)) {
          setEditAutocompleteState({ field: null, isOpen: false })
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [autocompleteState, editAutocompleteState])

  // Xóa hàng
  const handleRemoveRow = (rowId) => {
    if (transactionRows.length > 1) {
      setTransactionRows(rows => rows.filter(row => row.id !== rowId))
    }
  }

  // Helper function để kiểm tra xem text có chứa text đã parse không
  const isTextAlreadyParsed = (text, parsedTextsSet) => {
    if (!text || !text.trim()) return false
    
    // Chuẩn hóa text để so sánh
    const normalizedText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim()
    
    // Kiểm tra exact match
    if (parsedTextsSet.has(normalizedText)) {
      return true
    }
    
    // Kiểm tra xem text có chứa bất kỳ text đã parse nào không (substring check)
    for (const parsedText of parsedTextsSet) {
      // Nếu text đã parse là substring của text hiện tại (sau khi normalize)
      if (normalizedText.includes(parsedText) && parsedText.length > 20) {
        return true
      }
      // Hoặc ngược lại, nếu text hiện tại là substring của text đã parse
      if (parsedText.includes(normalizedText) && normalizedText.length > 20) {
        return true
      }
    }
    
    return false
  }

  // Parse và điền dữ liệu từ textarea Giao lịch (chỉ khi paste hoặc blur)
  const parseGiaoLichText = (text, pastedTextOnly = null) => {
    if (!text || !text.trim()) return
    
    // Nếu có pastedTextOnly, chỉ parse phần text được paste
    const textToParse = pastedTextOnly || text
    
    // Kiểm tra xem text này đã được parse chưa
    if (isTextAlreadyParsed(textToParse, parsedGiaoLichTextsRef.current)) {
      console.log('Text đã được parse rồi, bỏ qua:', textToParse.substring(0, 50))
      return // Đã parse rồi, không parse lại
    }
    
    const parsed = parseChatMessages(textToParse)
    if (parsed.length > 0) {
      // Chuẩn hóa text để lưu
      const normalizedText = textToParse.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim()
      
      // Đánh dấu đã parse text này
      parsedGiaoLichTextsRef.current.add(normalizedText)
      console.log('Đã parse và lưu text:', normalizedText.substring(0, 50))
      
      // Kiểm tra xem hàng đầu tiên có trống không
      const firstRow = transactionRows[0]
      const isFirstRowEmpty = !firstRow.id_nguoi_gui && !firstRow.id_nguoi_nhan && !firstRow.id_loai_giao_dich && !firstRow.so_diem_giao_dich
      
      if (isFirstRowEmpty && parsed.length > 0) {
        // Nếu hàng đầu trống, điền giao dịch đầu tiên vào hàng đầu
        const firstTx = parsed[0]
        const remainingTxs = parsed.slice(1) // Các giao dịch còn lại
        
        setTransactionRows(rows => {
          // Điền giao dịch đầu tiên vào hàng đầu
          const firstTxNguoiGui = users.find(u => u.id === firstTx.id_nguoi_gui)
          const firstTxNguoiNhan = users.find(u => u.id === firstTx.id_nguoi_nhan)
          const updatedRows = rows.map((row, index) => 
            index === 0 ? {
              ...row,
              id_nguoi_gui: firstTx.id_nguoi_gui.toString(),
              id_nguoi_nhan: firstTx.id_nguoi_nhan.toString(),
              id_loai_giao_dich: '2', // ID của "Giao lịch"
              so_diem_giao_dich: firstTx.so_diem_giao_dich.toString(),
              noi_dung_giao_dich: firstTx.noi_dung_giao_dich || '',
              nguoi_gui_text: firstTxNguoiGui?.ten_zalo || '',
              nguoi_nhan_text: firstTxNguoiNhan?.ten_zalo || ''
            } : row
          )
          
          // Nếu còn giao dịch khác, tạo hàng mới cho chúng
          if (remainingTxs.length > 0) {
            const maxId = rows.length > 0 ? Math.max(...rows.map(r => r.id), 0) : 0
            const newRows = remainingTxs.map((tx, index) => {
              const nguoiGui = users.find(u => u.id === tx.id_nguoi_gui)
              const nguoiNhan = users.find(u => u.id === tx.id_nguoi_nhan)
              return {
                id: maxId + index + 1,
                id_nguoi_gui: tx.id_nguoi_gui.toString(),
                id_nguoi_nhan: tx.id_nguoi_nhan.toString(),
                id_loai_giao_dich: '2', // ID của "Giao lịch"
                so_diem_giao_dich: tx.so_diem_giao_dich.toString(),
                noi_dung_giao_dich: tx.noi_dung_giao_dich || '',
                nguoi_gui_text: nguoiGui?.ten_zalo || '',
                nguoi_nhan_text: nguoiNhan?.ten_zalo || ''
              }
            })
            return [...updatedRows, ...newRows]
          }
          
          return updatedRows
        })
      } else {
        // Nếu hàng đầu không trống, tạo hàng mới cho tất cả giao dịch
        setTransactionRows(rows => {
          const maxId = rows.length > 0 ? Math.max(...rows.map(r => r.id), 0) : 0
          const newRows = parsed.map((tx, index) => {
            const nguoiGui = users.find(u => u.id === tx.id_nguoi_gui)
            const nguoiNhan = users.find(u => u.id === tx.id_nguoi_nhan)
            return {
              id: maxId + index + 1,
              id_nguoi_gui: tx.id_nguoi_gui.toString(),
              id_nguoi_nhan: tx.id_nguoi_nhan.toString(),
              id_loai_giao_dich: '2', // ID của "Giao lịch"
              so_diem_giao_dich: tx.so_diem_giao_dich.toString(),
              noi_dung_giao_dich: tx.noi_dung_giao_dich || '',
              nguoi_gui_text: nguoiGui?.ten_zalo || '',
              nguoi_nhan_text: nguoiNhan?.ten_zalo || ''
            }
          })
          
          // Thêm vào cuối danh sách
          return [...rows, ...newRows]
        })
      }
    }
  }

  // Parse và điền dữ liệu từ textarea San điểm (chỉ khi paste hoặc blur)
  const parseSanDiemText = (text, pastedTextOnly = null) => {
    if (!text || !text.trim()) return
    
    // Nếu có pastedTextOnly, chỉ parse phần text được paste
    const textToParse = pastedTextOnly || text
    
    // Kiểm tra xem text này đã được parse chưa
    if (isTextAlreadyParsed(textToParse, parsedSanDiemTextsRef.current)) {
      console.log('Text đã được parse rồi, bỏ qua:', textToParse.substring(0, 50))
      return // Đã parse rồi, không parse lại
    }
    
    const parsed = parseSanDiemMessages(textToParse)
    if (parsed.length > 0) {
      // Chuẩn hóa text để lưu
      const normalizedText = textToParse.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim()
      
      // Đánh dấu đã parse text này
      parsedSanDiemTextsRef.current.add(normalizedText)
      console.log('Đã parse và lưu text:', normalizedText.substring(0, 50))
      
      // Kiểm tra xem hàng đầu tiên có trống không
      const firstRow = transactionRows[0]
      const isFirstRowEmpty = !firstRow.id_nguoi_gui && !firstRow.id_nguoi_nhan && !firstRow.id_loai_giao_dich && !firstRow.so_diem_giao_dich
      
      if (isFirstRowEmpty && parsed.length > 0) {
        // Nếu hàng đầu trống, điền giao dịch đầu tiên vào hàng đầu
        const firstTx = parsed[0]
        const remainingTxs = parsed.slice(1) // Các giao dịch còn lại
        
        setTransactionRows(rows => {
          // Điền giao dịch đầu tiên vào hàng đầu
          const firstTxNguoiGui = users.find(u => u.id === firstTx.id_nguoi_gui)
          const firstTxNguoiNhan = users.find(u => u.id === firstTx.id_nguoi_nhan)
          const updatedRows = rows.map((row, index) => 
            index === 0 ? {
              ...row,
              id_nguoi_gui: firstTx.id_nguoi_gui.toString(),
              id_nguoi_nhan: firstTx.id_nguoi_nhan.toString(),
              id_loai_giao_dich: '1', // ID của "San điểm"
              so_diem_giao_dich: firstTx.so_diem_giao_dich.toString(),
              noi_dung_giao_dich: firstTx.noi_dung_giao_dich || '',
              nguoi_gui_text: firstTxNguoiGui?.ten_zalo || '',
              nguoi_nhan_text: firstTxNguoiNhan?.ten_zalo || ''
            } : row
          )
          
          // Nếu còn giao dịch khác, tạo hàng mới cho chúng
          if (remainingTxs.length > 0) {
            const maxId = rows.length > 0 ? Math.max(...rows.map(r => r.id), 0) : 0
            const newRows = remainingTxs.map((tx, index) => {
              const nguoiGui = users.find(u => u.id === tx.id_nguoi_gui)
              const nguoiNhan = users.find(u => u.id === tx.id_nguoi_nhan)
              return {
                id: maxId + index + 1,
                id_nguoi_gui: tx.id_nguoi_gui.toString(),
                id_nguoi_nhan: tx.id_nguoi_nhan.toString(),
                id_loai_giao_dich: '1', // ID của "San điểm"
                so_diem_giao_dich: tx.so_diem_giao_dich.toString(),
                noi_dung_giao_dich: tx.noi_dung_giao_dich || '',
                nguoi_gui_text: nguoiGui?.ten_zalo || '',
                nguoi_nhan_text: nguoiNhan?.ten_zalo || ''
              }
            })
            return [...updatedRows, ...newRows]
          }
          
          return updatedRows
        })
      } else {
        // Nếu hàng đầu không trống, tạo hàng mới cho tất cả giao dịch
        setTransactionRows(rows => {
          const maxId = rows.length > 0 ? Math.max(...rows.map(r => r.id), 0) : 0
          const newRows = parsed.map((tx, index) => {
            const nguoiGui = users.find(u => u.id === tx.id_nguoi_gui)
            const nguoiNhan = users.find(u => u.id === tx.id_nguoi_nhan)
            return {
              id: maxId + index + 1,
              id_nguoi_gui: tx.id_nguoi_gui.toString(),
              id_nguoi_nhan: tx.id_nguoi_nhan.toString(),
              id_loai_giao_dich: '1', // ID của "San điểm"
              so_diem_giao_dich: tx.so_diem_giao_dich.toString(),
              noi_dung_giao_dich: tx.noi_dung_giao_dich || '',
              nguoi_gui_text: nguoiGui?.ten_zalo || '',
              nguoi_nhan_text: nguoiNhan?.ten_zalo || ''
            }
          })
          
          // Thêm vào cuối danh sách
          return [...rows, ...newRows]
        })
      }
    }
  }

  // Cập nhật text và parse sau khi người dùng ngừng gõ (debounce)
  const handleGiaoLichTextChange = (text) => {
    setGiaoLichText(text)
    
    // Nếu đang paste, bỏ qua onChange để tránh parse lại
    if (isPastingGiaoLichRef.current) {
      return
    }
    
    // Clear timer cũ
    if (giaoLichTimerRef.current) {
      clearTimeout(giaoLichTimerRef.current)
    }
    
    // Chỉ parse nếu text có nội dung hợp lệ
    const trimmedText = text.trim()
    if (!trimmedText || trimmedText.length < 20) return
    
    // Kiểm tra xem có chứa pattern của tin nhắn chat không
    const hasTimestamp = /\[\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\]/.test(text)
    const hasMention = /@/.test(text)
    
    if (!hasTimestamp && !hasMention) return
    
    // Kiểm tra xem text này đã được parse chưa (dùng helper function)
    if (isTextAlreadyParsed(text, parsedGiaoLichTextsRef.current)) {
      return
    }
    
    // Parse sau 800ms khi người dùng ngừng gõ
    giaoLichTimerRef.current = setTimeout(() => {
      parseGiaoLichText(text)
    }, 800)
  }

  // Cập nhật text và parse sau khi người dùng ngừng gõ (debounce)
  const handleSanDiemTextChange = (text) => {
    setSanDiemText(text)
    
    // Nếu đang paste, bỏ qua onChange để tránh parse lại
    if (isPastingSanDiemRef.current) {
      return
    }
    
    // Clear timer cũ
    if (sanDiemTimerRef.current) {
      clearTimeout(sanDiemTimerRef.current)
    }
    
    // Chỉ parse nếu text có nội dung hợp lệ
    const trimmedText = text.trim()
    if (!trimmedText || trimmedText.length < 10) return
    
    // Kiểm tra xem có chứa từ "san" hoặc "@" không
    const hasSan = /\bsan\b/i.test(text)
    const hasMention = /@/.test(text)
    
    if (!hasSan && !hasMention) return
    
    // Kiểm tra xem text này đã được parse chưa (dùng helper function)
    if (isTextAlreadyParsed(text, parsedSanDiemTextsRef.current)) {
      return
    }
    
    // Parse sau 800ms khi người dùng ngừng gõ
    sanDiemTimerRef.current = setTimeout(() => {
      parseSanDiemText(text)
    }, 800)
  }

  // Parse ngay khi paste vào textarea Giao lịch
  const handleGiaoLichPaste = (e) => {
    // Clear timer nếu có
    if (giaoLichTimerRef.current) {
      clearTimeout(giaoLichTimerRef.current)
    }
    
    // Đánh dấu đang paste để bỏ qua onChange
    isPastingGiaoLichRef.current = true
    
    // Lấy clipboard data
    const pastedText = (e.clipboardData || window.clipboardData).getData('text')
    if (pastedText && pastedText.trim()) {
      // Chỉ parse phần text được paste, không parse lại toàn bộ textarea
      // Điều này tránh việc parse lại text đã parse trước đó
      setTimeout(() => {
        parseGiaoLichText(pastedText, pastedText)
        // Sau khi parse xong, reset flag sau một khoảng thời gian để onChange có thể hoạt động lại
        setTimeout(() => {
          isPastingGiaoLichRef.current = false
        }, 500)
      }, 50)
    } else {
      // Nếu không có text để parse, reset flag ngay
      setTimeout(() => {
        isPastingGiaoLichRef.current = false
      }, 100)
    }
  }

  // Parse ngay khi paste vào textarea San điểm
  const handleSanDiemPaste = (e) => {
    // Clear timer nếu có
    if (sanDiemTimerRef.current) {
      clearTimeout(sanDiemTimerRef.current)
    }
    
    // Đánh dấu đang paste để bỏ qua onChange
    isPastingSanDiemRef.current = true
    
    // Lấy clipboard data
    const pastedText = (e.clipboardData || window.clipboardData).getData('text')
    if (pastedText && pastedText.trim()) {
      // Chỉ parse phần text được paste, không parse lại toàn bộ textarea
      // Điều này tránh việc parse lại text đã parse trước đó
      setTimeout(() => {
        parseSanDiemText(pastedText, pastedText)
        // Sau khi parse xong, reset flag sau một khoảng thời gian để onChange có thể hoạt động lại
        setTimeout(() => {
          isPastingSanDiemRef.current = false
        }, 500)
      }, 50)
    } else {
      // Nếu không có text để parse, reset flag ngay
      setTimeout(() => {
        isPastingSanDiemRef.current = false
      }, 100)
    }
  }

  // Parse khi blur (rời khỏi textarea) Giao lịch
  const handleGiaoLichBlur = () => {
    // Clear timer nếu có
    if (giaoLichTimerRef.current) {
      clearTimeout(giaoLichTimerRef.current)
    }
    parseGiaoLichText(giaoLichText)
  }

  // Parse khi blur (rời khỏi textarea) San điểm
  const handleSanDiemBlur = () => {
    // Clear timer nếu có
    if (sanDiemTimerRef.current) {
      clearTimeout(sanDiemTimerRef.current)
    }
    parseSanDiemText(sanDiemText)
  }
  
  // Cleanup timers khi component unmount
  useEffect(() => {
    return () => {
      if (giaoLichTimerRef.current) {
        clearTimeout(giaoLichTimerRef.current)
      }
      if (sanDiemTimerRef.current) {
        clearTimeout(sanDiemTimerRef.current)
      }
    }
  }, [])

  const handleSingleTransactionSubmit = async (e) => {
    e.preventDefault()
    if (!selectedLoaiGiaoDich) {
      setError('Vui lòng chọn loại giao dịch')
      return
    }
    
    try {
      setSubmitting(true)
      setError('')
      const transactionData = {
        id_nguoi_gui: parseInt(singleTransactionForm.id_nguoi_gui),
        id_nguoi_nhan: parseInt(singleTransactionForm.id_nguoi_nhan),
        id_loai_giao_dich: parseInt(selectedLoaiGiaoDich),
        so_diem_giao_dich: parseFloat(singleTransactionForm.so_diem_giao_dich) || 0,
        noi_dung_giao_dich: singleTransactionForm.noi_dung_giao_dich || null
      }
      
      const response = await transactionAPI.create(transactionData)
      if (response.success) {
        await loadTransactions(pagination.page) // Reload trang hiện tại
        await loadAllTransactionsForCancelCheck() // Reload tất cả để cập nhật trạng thái "Đã hủy"
        await loadAllTransactionsForFilter() // Reload tất cả để cập nhật filter
        setSingleTransactionForm({
          id_nguoi_gui: '',
          id_nguoi_nhan: '',
          so_diem_giao_dich: '',
          noi_dung_giao_dich: ''
        })
        setSelectedLoaiGiaoDich('')
        setShowModal(false)
        alert('Tạo giao dịch thành công!')
      }
    } catch (err) {
      setError(err.message || 'Không thể tạo giao dịch')
      console.error('Create transaction error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit tất cả các giao dịch
  const handleSubmitAll = async (e) => {
    e.preventDefault()
    
    // Validate tất cả các hàng
    const validRows = transactionRows.filter(row => 
      row.id_nguoi_gui && 
      row.id_nguoi_nhan && 
      row.id_loai_giao_dich && 
      row.so_diem_giao_dich
    )
    
    if (validRows.length === 0) {
      setError('Vui lòng điền ít nhất một giao dịch hợp lệ')
      return
    }
    
    try {
      setSubmitting(true)
      setError('')
      
      const transactions = validRows.map(row => ({
        id_nguoi_gui: parseInt(row.id_nguoi_gui),
        id_nguoi_nhan: parseInt(row.id_nguoi_nhan),
        id_loai_giao_dich: parseInt(row.id_loai_giao_dich),
        so_diem_giao_dich: parseFloat(row.so_diem_giao_dich) || 0,
        noi_dung_giao_dich: row.noi_dung_giao_dich || null
      }))
      
      const response = await transactionAPI.createMany(transactions)
      if (response.success) {
        // Reload trang đầu tiên sau khi thêm nhiều transactions
        setPagination(prev => ({ ...prev, page: 1 }))
        await loadTransactions(1)
        await loadAllTransactionsForCancelCheck()
        await loadAllTransactionsForFilter()
        
        // Reset form
        setTransactionRows([{
          id: 1,
          id_nguoi_gui: '',
          id_nguoi_nhan: '',
          id_loai_giao_dich: '',
          so_diem_giao_dich: '',
          noi_dung_giao_dich: '',
          nguoi_gui_text: '',
          nguoi_nhan_text: ''
        }])
        setGiaoLichText('')
        setSanDiemText('')
        
        alert(`Tạo thành công ${transactions.length} giao dịch!`)
      }
    } catch (err) {
      setError(err.message || 'Không thể tạo giao dịch')
      console.error('Create transactions error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Tìm user theo tên Zalo (fuzzy match)
  const findUserByName = (name) => {
    if (!name || !users.length) return null
    
    // Tìm exact match trước
    let user = users.find(u => u.ten_zalo === name)
    if (user) return user
    
    // Tìm partial match (tên chứa trong ten_zalo hoặc ngược lại)
    const normalizedName = name.toLowerCase().trim()
    user = users.find(u => {
      const normalizedZalo = u.ten_zalo?.toLowerCase().trim() || ''
      return normalizedZalo.includes(normalizedName) || normalizedName.includes(normalizedZalo)
    })
    
    return user || null
  }

  // Parse tin nhắn để tạo giao dịch "Giao lịch" (CHỈ CẦN 2 TIN NHẮN)
  const parseChatMessages = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const transactions = []
    
    // Regex patterns
    const messagePattern = /^\[(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\]\s+(.+?):\s+(.+)$/
    const pointPattern = /(-?\d+[.,]\d+|-?\d+)$/
    
    let i = 0
    while (i < lines.length) {
      const line1 = lines[i]?.trim()
      if (!line1) {
        i++
        continue
      }
      
      // Parse tin nhắn 1: [@ngày giờ] Người A: Nội dung + số điểm
      const match1 = line1.match(messagePattern)
      if (!match1) {
        i++
        continue
      }
      
      const [, time1, name1, content1] = match1
      
      // Tìm số điểm trong content1
      // Ưu tiên 1: Số điểm có dấu "/" phía trước (như "Ck220k/0,25" hoặc "/0,5" hoặc "/1đ")
      // Đây là pattern phổ biến nhất: giá tiền/số điểm
      let pointMatch = null
      const slashPointRegex = /\/(\d+[.,]?\d*)\s*[đd]?(?:\s|\.|,|$)/i
      const slashPointExec = slashPointRegex.exec(content1)
      if (slashPointExec) {
        // Tạo match object giống format của match()
        // pointMatch[0] là toàn bộ match bao gồm dấu /, pointMatch[1] là số điểm (không có đ/d)
        // pointMatch.index là index của dấu / (đầu match)
        pointMatch = {
          0: slashPointExec[0], // "/0,25." hoặc "/0,25" hoặc "/1đ."
          1: slashPointExec[1], // "0,25" hoặc "0" hoặc "1" (đã bỏ đ/d)
          index: slashPointExec.index, // index của dấu /
          input: content1
        }
      }
      
      // Ưu tiên 2: Số điểm ở đầu câu (sau tên người, trước dấu phẩy hoặc khoảng trắng)
      // Ví dụ: "0,75 ,,    Sảnh t2..." hoặc "0,5/ lịch18h10"
      if (!pointMatch) {
        const startMatch = content1.match(/^(-?\d+[.,]\d+|-?\d+)\s*[,/]/)
        if (startMatch) {
          pointMatch = startMatch
        }
      }
      
      // Ưu tiên 3: Số điểm có dấu "/" phía sau (như "0,5/")
      if (!pointMatch) {
        const afterSlashMatch = content1.match(/(-?\d+[.,]\d+|-?\d+)\s*\//)
        if (afterSlashMatch) {
          pointMatch = afterSlashMatch
        }
      }
      
      // Ưu tiên 4: Số điểm ở cuối câu (nhưng bỏ qua số có "k" hoặc chữ cái - đó là giá tiền hoặc mã)
      if (!pointMatch) {
        // Tìm tất cả số điểm trong câu
        const allPoints = content1.matchAll(/(-?\d+[.,]\d+|-?\d+)/g)
        let lastPoint = null
        for (const match of allPoints) {
          // Bỏ qua số có "k" phía sau (như "250k" - đó là giá tiền)
          const afterMatch = content1.substring(match.index + match[0].length).trim()
          // Bỏ qua số có chữ cái phía trước (như "Vf5" - đó là mã, không phải điểm)
          const beforeMatch = content1.substring(Math.max(0, match.index - 1), match.index)
          
          if (!afterMatch.match(/^k/i) && !/[a-zA-ZÀ-ỹ]$/.test(beforeMatch)) {
            lastPoint = match
          }
        }
        if (lastPoint) {
          // Kiểm tra xem số điểm này có ở cuối câu không
          const afterLastPoint = content1.substring(lastPoint.index + lastPoint[0].length).trim()
          if (!afterLastPoint || afterLastPoint.length < 3) {
            pointMatch = lastPoint
          }
        }
      }
      
      if (!pointMatch) {
        i++
        continue
      }
      
      const soDiem = parseFloat(pointMatch[1].replace(',', '.')) || 0
      
      // Lấy nội dung: bỏ số điểm và các dấu phẩy/dấu "/" phía sau
      let noiDung = content1.substring(0, pointMatch.index).trim()
      let afterPoint = content1.substring(pointMatch.index + pointMatch[0].length).trim()
      
      // Bỏ các dấu phẩy kép ",," hoặc dấu phẩy đơn và khoảng trắng ở đầu phần sau
      afterPoint = afterPoint.replace(/^,+\s*/, '').trim()
      
      // Bỏ số có "k" ở cuối (như "250k" - đó là giá tiền, không phải điểm)
      afterPoint = afterPoint.replace(/\s*\d+[.,]?\d*\s*k\s*$/i, '').trim()
      
      // Bỏ dấu phẩy kép ",," ở giữa hoặc cuối (thay bằng khoảng trắng)
      afterPoint = afterPoint.replace(/\s*,{2,}\s*/g, ' ').trim()
      
      // Ghép nội dung
      if (afterPoint) {
        noiDung = (noiDung + ' ' + afterPoint).trim()
      }
      
      // Nếu nội dung rỗng, lấy toàn bộ content1 (trừ số điểm)
      if (!noiDung) {
        noiDung = content1.replace(pointMatch[0], '').trim()
        // Bỏ dấu phẩy kép ",," hoặc dấu phẩy đơn ở đầu
        noiDung = noiDung.replace(/^,+\s*/, '').trim()
        // Bỏ số có "k" ở cuối
        noiDung = noiDung.replace(/\s*\d+[.,]?\d*\s*k\s*$/i, '').trim()
        // Bỏ dấu phẩy kép ",," ở giữa hoặc cuối
        noiDung = noiDung.replace(/\s*,{2,}\s*/g, ' ').trim()
      }
      
      // Tìm user từ name1 (người gửi/người giao)
      const nguoiGiao = findUserByName(name1)
      if (!nguoiGiao) {
        i++
        continue
      }
      
      // Tìm tin nhắn 2: [@ngày giờ] Người B: @Người A [+ số điểm deal lại]
      let nguoiNhan = null
      let soDiemFinal = soDiem
      let j = i + 1
      
      while (j < lines.length && j < i + 5) { // Tìm trong 5 dòng tiếp theo
        const line2 = lines[j]?.trim()
        if (!line2) {
          j++
          continue
        }
        
        const match2 = line2.match(messagePattern)
        if (!match2) {
          j++
          continue
        }
        
        const [, time2, name2, content2] = match2
        
        // Kiểm tra xem có mention đến name1 không
        const mentions = content2.match(new RegExp(`@${name1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))
        if (mentions) {
          // Tìm user từ name2 (người nhận)
          const user2 = findUserByName(name2)
          if (user2 && user2.id !== nguoiGiao.id) {
            nguoiNhan = user2
            
            // Kiểm tra xem có số điểm deal lại trong tin nhắn 2 không
            // Tìm số điểm (có thể có "k" phía sau như "0k")
            let pointMatch2 = content2.match(/(-?\d+[.,]\d+|-?\d+)\s*k\s*$/i) // Số điểm có "k" ở cuối
            if (!pointMatch2) {
              pointMatch2 = content2.match(pointPattern) // Số điểm ở cuối không có "k"
            }
            if (pointMatch2) {
              // Có số điểm deal lại, sử dụng số điểm này (bỏ "k" nếu có)
              const pointValue = pointMatch2[1].replace(/k/i, '').replace(',', '.')
              soDiemFinal = parseFloat(pointValue) || soDiem
            }
            
            // Tạo giao dịch ngay với 2 tin nhắn (trạng thái mặc định: chưa chốt)
            // Chỉ lưu nội dung tin nhắn đầu tiên (không có timestamp và tên người gửi)
            // content1 đã được extract từ regex, chỉ chứa nội dung sau dấu ":"
            const noiDungToSave = content1.trim()
            console.log('Lưu nội dung giao dịch (Giao lịch):', noiDungToSave)
            transactions.push({
              id_nguoi_gui: nguoiGiao.id,
              id_nguoi_nhan: nguoiNhan.id,
              so_diem_giao_dich: soDiemFinal,
              noi_dung_giao_dich: noiDungToSave
            })
            
            // Nhảy đến sau tin nhắn 2
            i = j + 1
            break
          }
        }
        
        j++
      }
      
      // Nếu không tìm thấy tin nhắn 2, tiếp tục với dòng tiếp theo
      if (!nguoiNhan) {
        i++
      }
    }
    
    return transactions
  }

  // Parse tin nhắn để tạo giao dịch "San điểm"
  const parseSanDiemMessages = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const transactions = []
    
    // Regex patterns
    const messagePattern = /^\[(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\]\s+(.+?):\s+(.+)$/
    const pointPattern = /(-?\d+[.,]?\d*)\s*[đd]?$/i // Số điểm có thể có "đ" hoặc "d" ở cuối (ví dụ: 5đ, 4d, 0.5đ)
    const mentionPattern = /@([^@\n]+?)(?:\s|$|@|đ|d|\d)/i // Mention có thể có khoảng trắng trong tên, dừng khi gặp @, số, đ, d
    const sanPattern = /\bsan\b/i // Tìm "san" ở bất kỳ đâu (word boundary)
    const confirmPattern = /(ok|oke|oki|okay|okê|okì|nhận|nhan)/i
    
    // Người gửi mặc định cho trường hợp 1 tin nhắn
    const DEFAULT_SENDER = 'Kế Toán Full House'
    const defaultSenderUser = findUserByName(DEFAULT_SENDER)
    
    let i = 0
    while (i < lines.length) {
      const line = lines[i]?.trim()
      if (!line) {
        i++
        continue
      }
      
      // Kiểm tra xem có timestamp không để phân biệt 2 trường hợp
      const hasTimestamp = messagePattern.test(line)
      
      if (hasTimestamp) {
        // TRƯỜNG HỢP 1: 2 tin nhắn có timestamp
        const match1 = line.match(messagePattern)
        if (!match1) {
          i++
          continue
        }
        
        const [, time1, name1, content1] = match1
        
        // Kiểm tra xem có "San" hoặc "san" không (ở bất kỳ đâu)
        if (!sanPattern.test(content1)) {
          i++
          continue
        }
        
        // Tìm tất cả mentions trong tin nhắn 1
        // Tìm tất cả các vị trí có @
        const mentionPositions = []
        for (let pos = 0; pos < content1.length; pos++) {
          if (content1[pos] === '@') {
            mentionPositions.push(pos)
          }
        }
        
        if (mentionPositions.length === 0) {
          i++
          continue
        }
        
        // Với mỗi @, lấy tên cho đến khi gặp số, @ khác, hoặc kết thúc
        const allMentions = []
        for (const pos of mentionPositions) {
          let mentionEnd = pos + 1
          let wordStart = mentionEnd
          // Lấy tên sau @
          while (mentionEnd < content1.length) {
            const char = content1[mentionEnd]
            // Dừng khi gặp @ khác
            if (char === '@') {
              break
            }
            // Dừng khi gặp số (nhưng chỉ sau khoảng trắng hoặc ở đầu)
            if (/[\d]/.test(char)) {
              // Nếu số ở ngay sau @ hoặc sau khoảng trắng, dừng
              if (mentionEnd === pos + 1 || content1[mentionEnd - 1] === ' ') {
                break
              }
            }
            // Cho phép khoảng trắng, chữ, dấu câu trong tên
            if (/[\s\wÀ-ỹ.,\-]/.test(char)) {
              mentionEnd++
            } else {
              break
            }
          }
          
          const mentionText = content1.substring(pos + 1, mentionEnd).trim()
          // Làm sạch: bỏ các ký tự không hợp lệ ở cuối
          const cleanedMention = mentionText.replace(/[.,\-]+$/, '').trim()
          if (cleanedMention && cleanedMention.length > 0) {
            allMentions.push(cleanedMention)
          }
        }
        
        if (allMentions.length === 0) {
          i++
          continue
        }
        
        // Lấy mention cuối cùng (thường là người nhận)
        const mentionedName = allMentions[allMentions.length - 1]
        
        // Tìm số điểm trong tin nhắn 1 (có thể có "đ" hoặc "d" ở cuối)
        let soDiem = 0
        // Tìm tất cả số điểm trong content
        const allPointMatches = content1.match(/(-?\d+[.,]?\d*)\s*[đd]?/gi)
        if (allPointMatches && allPointMatches.length > 0) {
          // Lấy số điểm cuối cùng (thường là số điểm giao dịch)
          const lastPoint = allPointMatches[allPointMatches.length - 1]
          soDiem = parseFloat(lastPoint.replace(/[đd\s]/gi, '').replace(',', '.')) || 0
        }
        
        if (soDiem === 0) {
          i++
          continue
        }
        
        // Tìm user từ name1 (người gửi)
        const nguoiGui = findUserByName(name1)
        if (!nguoiGui) {
          i++
          continue
        }
        
        // Tìm user từ mention (người nhận)
        const nguoiNhan = findUserByName(mentionedName)
        if (!nguoiNhan) {
          i++
          continue
        }
        
        // Tìm tin nhắn 2: xác nhận từ người nhận
        let foundConfirm = false
        let j = i + 1
        
        while (j < lines.length && j < i + 5) { // Tìm trong 5 dòng tiếp theo
          const line2 = lines[j]?.trim()
          if (!line2) {
            j++
            continue
          }
          
          const match2 = line2.match(messagePattern)
          if (!match2) {
            j++
            continue
          }
          
          const [, time2, name2, content2] = match2
          
          // Kiểm tra xem name2 có match với người nhận không
          const user2 = findUserByName(name2)
          if (user2 && user2.id === nguoiNhan.id) {
            // Kiểm tra xem có mention đến người gửi và có từ xác nhận không
            const mentions2 = content2.match(new RegExp(`@${name1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))
            if (mentions2 && confirmPattern.test(content2)) {
              foundConfirm = true
              
              // Tạo giao dịch
              // Chỉ lưu nội dung tin nhắn đầu tiên (không có timestamp và tên người gửi)
              // content1 đã được extract từ regex, chỉ chứa nội dung sau dấu ":"
              const noiDungToSave = content1.trim()
              console.log('Lưu nội dung giao dịch (San điểm - 2 tin nhắn):', noiDungToSave)
              transactions.push({
                id_nguoi_gui: nguoiGui.id,
                id_nguoi_nhan: nguoiNhan.id,
                so_diem_giao_dich: soDiem,
                noi_dung_giao_dich: noiDungToSave
              })
              
              // Nhảy đến sau tin nhắn 2
              i = j + 1
              break
            }
          }
          
          j++
        }
        
        // Nếu không tìm thấy tin nhắn 2, vẫn tạo giao dịch (có thể không có xác nhận)
        if (!foundConfirm) {
          // Chỉ lưu nội dung tin nhắn đầu tiên (không có timestamp và tên người gửi)
          // content1 đã được extract từ regex, chỉ chứa nội dung sau dấu ":"
          const noiDungToSave = content1.trim()
          console.log('Lưu nội dung giao dịch (San điểm - 1 tin nhắn có timestamp):', noiDungToSave)
          transactions.push({
            id_nguoi_gui: nguoiGui.id,
            id_nguoi_nhan: nguoiNhan.id,
            so_diem_giao_dich: soDiem,
            noi_dung_giao_dich: noiDungToSave
          })
          i++
        }
      } else {
        // TRƯỜNG HỢP 2: 1 tin nhắn không có timestamp
        // Kiểm tra xem có "san" hoặc "San" ở bất kỳ đâu không
        if (!sanPattern.test(line)) {
          i++
          continue
        }
        
        // Tìm tất cả các vị trí có @
        const mentionPositions = []
        for (let pos = 0; pos < line.length; pos++) {
          if (line[pos] === '@') {
            mentionPositions.push(pos)
          }
        }
        
        if (mentionPositions.length === 0) {
          i++
          continue
        }
        
        // Lấy mention cuối cùng (thường là người nhận)
        const lastMentionPos = mentionPositions[mentionPositions.length - 1]
        let mentionEnd = lastMentionPos + 1
        let mentionStart = mentionEnd
        
        // Lấy tên sau @ cho đến khi gặp số, @ khác, hoặc kết thúc
        while (mentionEnd < line.length) {
          const char = line[mentionEnd]
          // Dừng khi gặp @ khác
          if (char === '@') {
            break
          }
          // Dừng khi gặp số (nhưng chỉ sau khoảng trắng hoặc ở đầu)
          if (/[\d]/.test(char)) {
            // Nếu số ở ngay sau @ hoặc sau khoảng trắng, dừng
            if (mentionEnd === lastMentionPos + 1 || line[mentionEnd - 1] === ' ') {
              break
            }
          }
          // Cho phép khoảng trắng, chữ, dấu câu trong tên
          if (/[\s\wÀ-ỹ.,\-]/.test(char)) {
            mentionEnd++
          } else {
            break
          }
        }
        
        const mentionedName = line.substring(lastMentionPos + 1, mentionEnd).trim()
        
        if (!mentionedName) {
          i++
          continue
        }
        
        // Tìm số điểm (có thể có "đ" hoặc "d" ở cuối, có thể ở bất kỳ đâu sau mention)
        let soDiem = 0
        // Tìm tất cả số điểm trong line
        const allPointMatches = line.match(/(-?\d+[.,]?\d*)\s*[đd]?/gi)
        if (allPointMatches && allPointMatches.length > 0) {
          // Lấy số điểm cuối cùng (thường là số điểm giao dịch)
          const lastPoint = allPointMatches[allPointMatches.length - 1]
          soDiem = parseFloat(lastPoint.replace(/[đd\s]/gi, '').replace(',', '.')) || 0
        }
        
        if (soDiem === 0) {
          i++
          continue
        }
        
        // Người gửi mặc định: Kế Toán Full House
        if (!defaultSenderUser) {
          console.warn('Không tìm thấy người gửi mặc định:', DEFAULT_SENDER)
          i++
          continue
        }
        
        // Tìm người nhận từ mention
        const nguoiNhan = findUserByName(mentionedName)
        if (!nguoiNhan) {
          console.warn('Không tìm thấy người nhận:', mentionedName)
          i++
          continue
        }
        
        // Tạo giao dịch
        // Lưu đủ tin nhắn gốc vào nội dung giao dịch
        transactions.push({
          id_nguoi_gui: defaultSenderUser.id,
          id_nguoi_nhan: nguoiNhan.id,
          so_diem_giao_dich: soDiem,
          noi_dung_giao_dich: line
        })
        
        i++
      }
    }
    
    return transactions
  }


  // Mở modal sửa giao dịch
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    const nguoiGui = users.find(u => u.id === transaction.id_nguoi_gui)
    const nguoiNhan = users.find(u => u.id === transaction.id_nguoi_nhan)
    setEditForm({
      id_nguoi_gui: transaction.id_nguoi_gui.toString(),
      id_nguoi_nhan: transaction.id_nguoi_nhan.toString(),
      id_loai_giao_dich: transaction.id_loai_giao_dich.toString(),
      so_diem_giao_dich: transaction.so_diem_giao_dich.toString(),
      noi_dung_giao_dich: transaction.noi_dung_giao_dich || ''
    })
    setEditFormText({
      nguoi_gui_text: nguoiGui?.ten_zalo || '',
      nguoi_nhan_text: nguoiNhan?.ten_zalo || ''
    })
    setShowEditModal(true)
    setError('')
  }

  // Đóng modal sửa
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingTransaction(null)
    setEditForm({
      id_nguoi_gui: '',
      id_nguoi_nhan: '',
      id_loai_giao_dich: '',
      so_diem_giao_dich: '',
      noi_dung_giao_dich: ''
    })
    setEditFormText({
      nguoi_gui_text: '',
      nguoi_nhan_text: ''
    })
    setError('')
  }

  // Xử lý thay đổi form sửa
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // Cập nhật giao dịch
  const handleUpdateTransaction = async (e) => {
    e.preventDefault()
    
    if (!editingTransaction) return
    
    try {
      setSubmitting(true)
      setError('')
      
      const transactionData = {
        id_nguoi_gui: parseInt(editForm.id_nguoi_gui),
        id_nguoi_nhan: parseInt(editForm.id_nguoi_nhan),
        id_loai_giao_dich: parseInt(editForm.id_loai_giao_dich),
        so_diem_giao_dich: parseFloat(editForm.so_diem_giao_dich) || 0,
        noi_dung_giao_dich: editForm.noi_dung_giao_dich || null
      }
      
      const response = await transactionAPI.update(editingTransaction.id, transactionData)
      if (response.success) {
        await loadTransactions(pagination.page)
        await loadAllTransactionsForCancelCheck()
        await loadAllTransactionsForFilter()
        handleCloseEditModal()
        alert('Cập nhật giao dịch thành công!')
      }
    } catch (err) {
      setError(err.message || 'Không thể cập nhật giao dịch')
      console.error('Update transaction error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Chốt giao dịch (chuyển từ chưa chốt sang đã chốt)
  const handleChotTransaction = async (transaction) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chốt giao dịch #${transaction.id}?\n\nSau khi chốt, điểm sẽ được cộng/trừ và không thể sửa/xóa giao dịch này.`)) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await transactionAPI.chotGiaoDich(transaction.id)
      if (response.success) {
        await loadTransactions(pagination.page)
        await loadAllTransactionsForCancelCheck()
        await loadAllTransactionsForFilter()
        alert('Chốt giao dịch thành công! Điểm đã được cập nhật.')
      }
    } catch (err) {
      setError(err.message || 'Không thể chốt giao dịch')
      console.error('Chot transaction error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Chốt tất cả giao dịch "Giao lịch" chưa chốt
  const handleChotTatCaGiaoDich = async () => {
    // Đếm số giao dịch chưa chốt
    const chuaChotCount = allTransactionsForFilter.filter(
      tx => tx.ten_loai_giao_dich === 'Giao lịch' && tx.trang_thai === 'chua_chot'
    ).length

    if (chuaChotCount === 0) {
      alert('Không có giao dịch "Giao lịch" nào chưa chốt!')
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn chốt TẤT CẢ ${chuaChotCount} giao dịch "Giao lịch" chưa chốt?\n\nSau khi chốt, điểm sẽ được cộng/trừ cho tất cả các giao dịch này.`)) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await transactionAPI.chotTatCaGiaoDich()
      if (response.success) {
        await loadTransactions(pagination.page)
        await loadAllTransactionsForCancelCheck()
        await loadAllTransactionsForFilter()
        
        const message = response.data.errors && response.data.errors.length > 0
          ? `Đã chốt thành công ${response.data.count}/${response.data.total} giao dịch.\n\nCó ${response.data.errors.length} giao dịch bị lỗi:\n${response.data.errors.slice(0, 5).join('\n')}${response.data.errors.length > 5 ? '\n...' : ''}`
          : `Đã chốt thành công ${response.data.count} giao dịch!`
        
        alert(message)
      }
    } catch (err) {
      setError(err.message || 'Không thể chốt tất cả giao dịch')
      console.error('Chot tat ca giao dich error:', err)
      alert('Lỗi khi chốt tất cả giao dịch: ' + (err.message || 'Vui lòng thử lại'))
    } finally {
      setSubmitting(false)
    }
  }

  // Hủy lịch (tạo giao dịch "Hủy lịch")
  const handleCancelTransaction = async (transaction) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy giao dịch #${transaction.id}?`)) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      // Tạo giao dịch "Hủy lịch" với id_loai_giao_dich = 3
      // id_giao_dich_doi_chung = id của giao dịch "Giao lịch" bị hủy
      // Đảo ngược người gửi và người nhận để hoàn lại điểm
      const cancelTransactionData = {
        id_nguoi_gui: transaction.id_nguoi_nhan, // Đảo ngược
        id_nguoi_nhan: transaction.id_nguoi_gui, // Đảo ngược
        id_loai_giao_dich: 3, // ID của "Hủy lịch"
        so_diem_giao_dich: transaction.so_diem_giao_dich, // Số điểm giống giao dịch ban đầu
        id_giao_dich_doi_chung: transaction.id, // ID của giao dịch "Giao lịch" bị hủy
        noi_dung_giao_dich: `Hủy lịch: ${transaction.noi_dung_giao_dich || ''}`.trim()
      }
      
      const response = await transactionAPI.create(cancelTransactionData)
      if (response.success) {
        await loadTransactions(pagination.page) // Reload trang hiện tại
        await loadAllTransactionsForCancelCheck() // Reload tất cả để cập nhật trạng thái "Đã hủy"
        await loadAllTransactionsForFilter() // Reload tất cả để cập nhật filter
        alert('Hủy lịch thành công!')
      }
    } catch (err) {
      setError(err.message || 'Không thể hủy lịch')
      console.error('Cancel transaction error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Xóa giao dịch
  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giao dịch #${transaction.id}? Điểm sẽ được hoàn lại cho cả 2 người.`)) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await transactionAPI.delete(transaction.id)
      if (response.success) {
        await loadTransactions(pagination.page) // Reload trang hiện tại
        await loadAllTransactionsForCancelCheck() // Reload tất cả để cập nhật trạng thái "Đã hủy"
        await loadAllTransactionsForFilter() // Reload tất cả để cập nhật filter
        alert('Xóa giao dịch thành công và đã hoàn lại điểm!')
      }
    } catch (err) {
      setError(err.message || 'Không thể xóa giao dịch')
      console.error('Delete transaction error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Kiểm tra xem có filter nào đang active không
  const hasActiveFilters = filterLoaiGiaoDich !== 'all' || 
    filterTrangThai !== 'all' ||
    filterDateFrom || 
    filterDateTo || 
    searchTerm

  // Filter transactions
  const filteredTransactions = hasActiveFilters ? allTransactionsForFilter.filter(tx => {
    // Filter theo loại giao dịch
    if (filterLoaiGiaoDich !== 'all') {
      if (tx.id_loai_giao_dich !== parseInt(filterLoaiGiaoDich)) {
        return false
      }
    }
    
    // Filter theo trạng thái
    if (filterTrangThai !== 'all') {
      if (tx.trang_thai !== filterTrangThai) {
        return false
      }
    }
    
    // Filter theo ngày
    if (filterDateFrom) {
      const txDate = new Date(tx.created_at)
      const fromDate = new Date(filterDateFrom)
      fromDate.setHours(0, 0, 0, 0)
      if (txDate < fromDate) {
        return false
      }
    }
    
    if (filterDateTo) {
      const txDate = new Date(tx.created_at)
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59, 999)
      if (txDate > toDate) {
        return false
      }
    }
    
    // Tìm kiếm theo nội dung
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const noiDung = (tx.noi_dung_giao_dich || '').toLowerCase()
      const tenNguoiGui = (tx.ten_nguoi_gui || '').toLowerCase()
      const tenNguoiNhan = (tx.ten_nguoi_nhan || '').toLowerCase()
      const tenLoai = (tx.ten_loai_giao_dich || '').toLowerCase()
      
      if (!noiDung.includes(searchLower) && 
          !tenNguoiGui.includes(searchLower) && 
          !tenNguoiNhan.includes(searchLower) &&
          !tenLoai.includes(searchLower) &&
          !tx.id.toString().includes(searchTerm)) {
        return false
      }
    }
    
    return true
  }) : []

  // Xác định transactions để hiển thị
  const transactionsToDisplay = hasActiveFilters ? filteredTransactions : transactions
  
  // Pagination cho filtered transactions
  const startIndex = (pagination.page - 1) * pagination.limit
  const endIndex = startIndex + pagination.limit
  const displayTransactions = hasActiveFilters 
    ? filteredTransactions.slice(startIndex, endIndex)
    : transactions
  
  // Cập nhật pagination dựa trên filtered results
  const displayPagination = hasActiveFilters ? {
    ...pagination,
    total: filteredTransactions.length,
    totalPages: Math.ceil(filteredTransactions.length / pagination.limit) || 1
  } : {
    ...pagination,
    total: pagination.total,
    totalPages: pagination.totalPages
  }

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    if (hasActiveFilters) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [filterLoaiGiaoDich, filterTrangThai, filterDateFrom, filterDateTo, searchTerm])

  // Hàm reset tất cả filters
  const handleResetFilters = () => {
    setFilterLoaiGiaoDich('all')
    setFilterTrangThai('all')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.ten_zalo : `ID: ${userId}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
          Quản lý giao dịch
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-sans">
          Theo dõi và quản lý tất cả các giao dịch trong hệ thống
        </p>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setMainTab('create')}
              className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-all ${
                mainTab === 'create'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Tạo giao dịch mới
            </button>
            <button
              onClick={() => setMainTab('list')}
              className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-all ${
                mainTab === 'list'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Danh sách giao dịch
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {mainTab === 'create' ? (
            /* Tab: Tạo giao dịch mới */
            <form onSubmit={handleSubmitAll} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Transaction Rows */}
              <div className="space-y-4">
                {transactionRows.map((row, index) => (
                  <div key={row.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Giao dịch #{index + 1}
                      </h3>
                      {transactionRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    {/* Hàng đầu tiên: Các ô input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Người gửi */}
                      <div className="relative">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Người gửi <span className="text-red-500">*</span>
                        </label>
                        {loadingUsers ? (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                            Đang tải...
                          </div>
                        ) : (
                          <div 
                            ref={(el) => {
                              if (el) autocompleteRefs.current[`${row.id}_id_nguoi_gui`] = el
                            }}
                            className="relative"
                          >
                            <input
                              type="text"
                              value={row.nguoi_gui_text}
                              onChange={(e) => handleAutocompleteInputChange(row.id, 'id_nguoi_gui', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value.trim()) {
                                  setAutocompleteState({ rowId: row.id, field: 'id_nguoi_gui', isOpen: true })
                                }
                              }}
                              required={!row.id_nguoi_gui}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                              placeholder="Nhập tên người gửi..."
                              autoComplete="off"
                            />
                            <input type="hidden" value={row.id_nguoi_gui} required />
                            
                            {/* Dropdown suggestions */}
                            {autocompleteState.isOpen && 
                             autocompleteState.rowId === row.id && 
                             autocompleteState.field === 'id_nguoi_gui' && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filterUsers(row.nguoi_gui_text).length > 0 ? (
                                  filterUsers(row.nguoi_gui_text).map((user) => (
                                    <div
                                      key={user.id}
                                      onClick={() => handleSelectUser(row.id, 'id_nguoi_gui', user)}
                                      className="px-3 py-2 text-sm hover:bg-primary hover:text-white cursor-pointer font-sans transition-colors"
                                    >
                                      {user.ten_zalo}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-gray-500 font-sans">
                                    Không tìm thấy người dùng
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Người nhận */}
                      <div className="relative">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Người nhận <span className="text-red-500">*</span>
                        </label>
                        {loadingUsers ? (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                            Đang tải...
                          </div>
                        ) : (
                          <div 
                            ref={(el) => {
                              if (el) autocompleteRefs.current[`${row.id}_id_nguoi_nhan`] = el
                            }}
                            className="relative"
                          >
                            <input
                              type="text"
                              value={row.nguoi_nhan_text}
                              onChange={(e) => handleAutocompleteInputChange(row.id, 'id_nguoi_nhan', e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value.trim()) {
                                  setAutocompleteState({ rowId: row.id, field: 'id_nguoi_nhan', isOpen: true })
                                }
                              }}
                              required={!row.id_nguoi_nhan}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                              placeholder="Nhập tên người nhận..."
                              autoComplete="off"
                            />
                            <input type="hidden" value={row.id_nguoi_nhan} required />
                            
                            {/* Dropdown suggestions */}
                            {autocompleteState.isOpen && 
                             autocompleteState.rowId === row.id && 
                             autocompleteState.field === 'id_nguoi_nhan' && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filterUsers(row.nguoi_nhan_text).length > 0 ? (
                                  filterUsers(row.nguoi_nhan_text).map((user) => (
                                    <div
                                      key={user.id}
                                      onClick={() => handleSelectUser(row.id, 'id_nguoi_nhan', user)}
                                      className="px-3 py-2 text-sm hover:bg-primary hover:text-white cursor-pointer font-sans transition-colors"
                                    >
                                      {user.ten_zalo}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-gray-500 font-sans">
                                    Không tìm thấy người dùng
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Loại giao dịch */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Loại giao dịch <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={row.id_loai_giao_dich}
                          onChange={(e) => handleRowChange(row.id, 'id_loai_giao_dich', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                        >
                          <option value="">-- Chọn --</option>
                          <option value="1">San điểm</option>
                          <option value="2">Giao lịch</option>
                        </select>
                      </div>

                      {/* Số điểm */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Số điểm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={row.so_diem_giao_dich}
                          onChange={(e) => handleRowChange(row.id, 'so_diem_giao_dich', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Nội dung giao dịch */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Nội dung
                        </label>
                        <input
                          type="text"
                          value={row.noi_dung_giao_dich}
                          onChange={(e) => handleRowChange(row.id, 'noi_dung_giao_dich', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                          placeholder="Nội dung giao dịch"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút thêm hàng */}
              <div>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary font-semibold text-sm transition-colors"
                >
                  + Thêm giao dịch mới
                </button>
              </div>

              {/* Hàng thứ 2: 2 ô textarea */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Textarea Giao lịch */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nhập tin nhắn Giao lịch
                  </label>
                  <textarea
                    value={giaoLichText}
                    onChange={(e) => handleGiaoLichTextChange(e.target.value)}
                    onPaste={handleGiaoLichPaste}
                    onBlur={handleGiaoLichBlur}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans resize-none font-mono text-sm"
                    placeholder="Dán đoạn tin nhắn chat vào đây. Hệ thống sẽ tự động phát hiện và tạo giao dịch từ 2 tin nhắn liên tiếp."
                  />
                </div>

                {/* Textarea San điểm */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nhập tin nhắn San điểm
                  </label>
                  <textarea
                    value={sanDiemText}
                    onChange={(e) => handleSanDiemTextChange(e.target.value)}
                    onPaste={handleSanDiemPaste}
                    onBlur={handleSanDiemBlur}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans resize-none font-mono text-sm"
                    placeholder="Dán đoạn tin nhắn chat vào đây. Hệ thống sẽ tự động phát hiện và tạo giao dịch từ 1-2 tin nhắn."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
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
                    'Tạo tất cả giao dịch'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Tab: Danh sách giao dịch */
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium">
                  {error}
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* Nút Chốt tất cả */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleChotTatCaGiaoDich}
                      disabled={submitting}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Chốt tất cả giao dịch chưa chốt
                    </button>
                  </div>
                  
                  {/* Search */}
                  <div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo nội dung, tên người gửi/nhận, loại giao dịch, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                    />
                  </div>
                  
                  {/* Filter Row - Loại giao dịch, Trạng thái, Từ ngày, Đến ngày, Reset */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Filter Loại Giao Dịch */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                        Loại giao dịch
                      </label>
                      <select
                        value={filterLoaiGiaoDich}
                        onChange={(e) => setFilterLoaiGiaoDich(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                      >
                        <option value="all">Tất cả</option>
                        <option value="1">San điểm</option>
                        <option value="2">Giao lịch</option>
                        <option value="3">Hủy lịch</option>
                      </select>
                    </div>
                    
                    {/* Filter Trạng Thái */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={filterTrangThai}
                        onChange={(e) => setFilterTrangThai(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                      >
                        <option value="all">Tất cả</option>
                        <option value="chua_chot">Chưa chốt</option>
                        <option value="da_chot">Đã chốt</option>
                      </select>
                    </div>
                    
                    {/* Filter Từ Ngày */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                      />
                    </div>
                    
                    {/* Filter Đến Ngày */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                      />
                    </div>
                    
                    {/* Reset Button */}
                    <div className="flex items-end">
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions - Cards on Mobile/Tablet, Table on Desktop */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading || loadingAllTransactions ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
          </div>
        ) : displayTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 font-medium">
              {hasActiveFilters ? 'Không có giao dịch nào phù hợp với bộ lọc' : 'Không có giao dịch nào'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Card View - Mobile/Tablet */}
            <div className="lg:hidden divide-y divide-gray-200">
              {displayTransactions.map((transaction) => {
                const isGiaoLich = transaction.ten_loai_giao_dich === 'Giao lịch'
                const isCancelled = allTransactionsForCancelCheck.some(
                  tx => tx.ten_loai_giao_dich === 'Hủy lịch' && tx.id_giao_dich_doi_chung === transaction.id
                )
                const canCancel = isGiaoLich && !isCancelled
                const isChuaChot = transaction.trang_thai === 'chua_chot'
                const canEdit = isChuaChot && transaction.ten_loai_giao_dich !== 'Hủy lịch'
                
                return (
                  <div key={transaction.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900">#{transaction.id}</span>
                        {isCancelled && (
                          <span className="px-3 py-1.5 text-sm font-bold rounded-full bg-red-100 text-red-800">
                            Đã hủy
                          </span>
                        )}
                        <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${
                          isChuaChot 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isChuaChot ? 'Chưa chốt' : 'Đã chốt'}
                        </span>
                      </div>
                      <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${
                        transaction.ten_loai_giao_dich === 'Giao lịch' 
                          ? 'bg-blue-100 text-blue-800'
                          : transaction.ten_loai_giao_dich === 'San điểm'
                          ? 'bg-green-100 text-green-800'
                          : transaction.ten_loai_giao_dich === 'Hủy lịch'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.ten_loai_giao_dich}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Người gửi:</span>
                        <span className="text-base font-sans font-medium text-gray-800">
                          {getUserName(transaction.id_nguoi_gui)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Người nhận:</span>
                        <span className="text-base font-sans font-medium text-gray-800">
                          {getUserName(transaction.id_nguoi_nhan)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Số điểm:</span>
                        <span className={`text-xl font-bold ${
                          parseFloat(transaction.so_diem_giao_dich) < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {parseFloat(transaction.so_diem_giao_dich).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Ngày giờ:</span>
                        <span className="text-base font-sans text-gray-600">
                          {formatDate(transaction.created_at)}
                        </span>
                      </div>
                      {transaction.noi_dung_giao_dich && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-semibold text-gray-600">Nội dung:</span>
                          <span className="text-base font-sans text-gray-800 text-right flex-1 ml-2">
                            {transaction.noi_dung_giao_dich}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                      {/* Nút Chốt - chỉ hiển thị khi chưa chốt, là Giao lịch và chưa bị hủy */}
                      {isChuaChot && isGiaoLich && !isCancelled && (
                        <button
                          onClick={() => handleChotTransaction(transaction)}
                          disabled={submitting}
                          className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Chốt
                        </button>
                      )}
                      
                      {/* Nút Sửa/Xóa - luôn hiển thị (trừ Hủy lịch) */}
                      {transaction.ten_loai_giao_dich !== 'Hủy lịch' && (
                        <>
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            disabled={submitting}
                            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            disabled={submitting}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                      
                      {/* Nút Hủy lịch - chỉ hiển thị khi chưa chốt */}
                      {canCancel && isChuaChot && (
                        <button
                          onClick={() => handleCancelTransaction(transaction)}
                          disabled={submitting}
                          className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Table View - Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Mã giao dịch
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Người gửi
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Người nhận
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Loại giao dịch
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Số điểm
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Nội dung
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Ngày giờ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayTransactions.map((transaction) => {
                    const isGiaoLich = transaction.ten_loai_giao_dich === 'Giao lịch'
                    const isCancelled = allTransactionsForCancelCheck.some(
                      tx => tx.ten_loai_giao_dich === 'Hủy lịch' && tx.id_giao_dich_doi_chung === transaction.id
                    )
                    const canCancel = isGiaoLich && !isCancelled
                    const isChuaChot = transaction.trang_thai === 'chua_chot'
                    const canEdit = isChuaChot && transaction.ten_loai_giao_dich !== 'Hủy lịch'
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">#{transaction.id}</span>
                            {isCancelled && (
                              <span className="px-3 py-1.5 text-sm font-bold rounded-full bg-red-100 text-red-800">
                                Đã hủy
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-lg font-sans font-medium text-gray-800">
                            {getUserName(transaction.id_nguoi_gui)}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-lg font-sans font-medium text-gray-800">
                            {getUserName(transaction.id_nguoi_nhan)}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${
                            transaction.ten_loai_giao_dich === 'Giao lịch' 
                              ? 'bg-blue-100 text-blue-800'
                              : transaction.ten_loai_giao_dich === 'San điểm'
                              ? 'bg-green-100 text-green-800'
                              : transaction.ten_loai_giao_dich === 'Hủy lịch'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.ten_loai_giao_dich}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${
                            isChuaChot 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isChuaChot ? 'Chưa chốt' : 'Đã chốt'}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`text-xl font-bold ${
                            parseFloat(transaction.so_diem_giao_dich) < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {parseFloat(transaction.so_diem_giao_dich).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-base font-sans text-gray-700 max-w-xs">
                          {transaction.noi_dung_giao_dich || '-'}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-base font-sans text-gray-600">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Nút Chốt - chỉ hiển thị khi chưa chốt, là Giao lịch và chưa bị hủy */}
                            {isChuaChot && isGiaoLich && !isCancelled && (
                              <button
                                onClick={() => handleChotTransaction(transaction)}
                                disabled={submitting}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Chốt
                              </button>
                            )}
                            
                            {/* Nút Sửa/Xóa - luôn hiển thị (trừ Hủy lịch) */}
                            {transaction.ten_loai_giao_dich !== 'Hủy lịch' && (
                              <>
                                <button
                                  onClick={() => handleEditTransaction(transaction)}
                                  disabled={submitting}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(transaction)}
                                  disabled={submitting}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Xóa
                                </button>
                              </>
                            )}
                            
                            {/* Nút Hủy lịch - chỉ hiển thị khi chưa chốt */}
                            {canCancel && isChuaChot && (
                              <button
                                onClick={() => handleCancelTransaction(transaction)}
                                disabled={submitting}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-base font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Hủy lịch
                              </button>
                            )}
                            
                            {/* Hiển thị dấu - cho Hủy lịch */}
                            {transaction.ten_loai_giao_dich === 'Hủy lịch' && (
                              <span className="text-gray-400 text-base font-sans">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Pagination */}
        {!loading && !loadingAllTransactions && displayPagination.totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm font-sans text-gray-700 text-center sm:text-left">
              {hasActiveFilters ? (
                <>
                  Hiển thị {((displayPagination.page - 1) * displayPagination.limit) + 1} - {Math.min(displayPagination.page * displayPagination.limit, displayPagination.total)} trong tổng số {displayPagination.total} kết quả tìm kiếm
                </>
              ) : (
                <>
                  Hiển thị {((displayPagination.page - 1) * displayPagination.limit) + 1} - {Math.min(displayPagination.page * displayPagination.limit, displayPagination.total)} trong tổng số {displayPagination.total} giao dịch
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
            </div>
          )}
        </div>
      </div>

      {/* Modal Sửa Giao Dịch */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Sửa giao dịch #{editingTransaction.id}
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Người gửi */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Người gửi <span className="text-red-500">*</span>
                    </label>
                    {loadingUsers ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                        Đang tải...
                      </div>
                    ) : (
                      <div 
                        ref={(el) => {
                          if (el) editAutocompleteRefs.current['id_nguoi_gui'] = el
                        }}
                        className="relative"
                      >
                        <input
                          type="text"
                          value={editFormText.nguoi_gui_text}
                          onChange={(e) => handleEditAutocompleteInputChange('id_nguoi_gui', e.target.value)}
                          onFocus={(e) => {
                            if (e.target.value.trim()) {
                              setEditAutocompleteState({ field: 'id_nguoi_gui', isOpen: true })
                            }
                          }}
                          required={!editForm.id_nguoi_gui}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                          placeholder="Nhập tên người gửi..."
                          autoComplete="off"
                        />
                        <input type="hidden" value={editForm.id_nguoi_gui} required />
                        
                        {/* Dropdown suggestions */}
                        {editAutocompleteState.isOpen && 
                         editAutocompleteState.field === 'id_nguoi_gui' && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filterUsers(editFormText.nguoi_gui_text).length > 0 ? (
                              filterUsers(editFormText.nguoi_gui_text).map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => handleEditSelectUser('id_nguoi_gui', user)}
                                  className="px-3 py-2 text-sm hover:bg-primary hover:text-white cursor-pointer font-sans transition-colors"
                                >
                                  {user.ten_zalo}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 font-sans">
                                Không tìm thấy người dùng
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Người nhận */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Người nhận <span className="text-red-500">*</span>
                    </label>
                    {loadingUsers ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                        Đang tải...
                      </div>
                    ) : (
                      <div 
                        ref={(el) => {
                          if (el) editAutocompleteRefs.current['id_nguoi_nhan'] = el
                        }}
                        className="relative"
                      >
                        <input
                          type="text"
                          value={editFormText.nguoi_nhan_text}
                          onChange={(e) => handleEditAutocompleteInputChange('id_nguoi_nhan', e.target.value)}
                          onFocus={(e) => {
                            if (e.target.value.trim()) {
                              setEditAutocompleteState({ field: 'id_nguoi_nhan', isOpen: true })
                            }
                          }}
                          required={!editForm.id_nguoi_nhan}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                          placeholder="Nhập tên người nhận..."
                          autoComplete="off"
                        />
                        <input type="hidden" value={editForm.id_nguoi_nhan} required />
                        
                        {/* Dropdown suggestions */}
                        {editAutocompleteState.isOpen && 
                         editAutocompleteState.field === 'id_nguoi_nhan' && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filterUsers(editFormText.nguoi_nhan_text).length > 0 ? (
                              filterUsers(editFormText.nguoi_nhan_text).map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => handleEditSelectUser('id_nguoi_nhan', user)}
                                  className="px-3 py-2 text-sm hover:bg-primary hover:text-white cursor-pointer font-sans transition-colors"
                                >
                                  {user.ten_zalo}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 font-sans">
                                Không tìm thấy người dùng
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Loại giao dịch */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loại giao dịch <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.id_loai_giao_dich}
                      onChange={(e) => handleEditFormChange('id_loai_giao_dich', e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                    >
                      <option value="">-- Chọn --</option>
                      <option value="1">San điểm</option>
                      <option value="2">Giao lịch</option>
                    </select>
                  </div>

                  {/* Số điểm */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số điểm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.so_diem_giao_dich}
                      onChange={(e) => handleEditFormChange('so_diem_giao_dich', e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Nội dung giao dịch */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nội dung giao dịch
                  </label>
                  <textarea
                    value={editForm.noi_dung_giao_dich}
                    onChange={(e) => handleEditFormChange('noi_dung_giao_dich', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans resize-none"
                    placeholder="Nội dung giao dịch"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                      'Cập nhật'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuanLyGiaoDich
