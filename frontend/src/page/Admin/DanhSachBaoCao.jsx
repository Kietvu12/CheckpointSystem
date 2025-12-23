import React, { useState, useEffect, useCallback } from 'react'
import { reportAPI } from '../../service/api'

const DanhSachBaoCao = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const loadReports = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError('')
      const filters = {
        search: searchTerm || null,
        ngay_bao_cao: dateFilter || null
      }
      const response = await reportAPI.getAll(page, pagination.limit, filters)
      if (response.success) {
        setReports(response.data || [])
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.pagination
          }))
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách báo cáo')
      console.error('Load reports error:', err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, dateFilter, pagination.limit])

  useEffect(() => {
    loadReports(pagination.page)
  }, [pagination.page, loadReports])

  // Reset về trang 1 khi search hoặc filter thay đổi
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchTerm, dateFilter])

  const handleCreateReport = async () => {
    try {
      setSubmitting(true)
      setError('')
      
      // Lấy ngày hiện tại
      const today = new Date().toISOString().split('T')[0]
      
      const response = await reportAPI.create(today)
      if (response.success) {
        await loadReports(1)
        setPagination(prev => ({ ...prev, page: 1 }))
        alert('Tạo báo cáo thành công!')
      }
    } catch (err) {
      setError(err.message || 'Không thể tạo báo cáo')
      console.error('Create report error:', err)
      alert(err.message || 'Không thể tạo báo cáo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetail = async (report) => {
    try {
      setLoadingDetail(true)
      setError('')
      const response = await reportAPI.getById(report.id)
      if (response.success) {
        setSelectedReport(response.data)
        setShowDetailModal(true)
      }
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết báo cáo')
      console.error('Get report detail error:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleExportExcel = async (reportId) => {
    try {
      setSubmitting(true)
      setError('')
      await reportAPI.exportToExcel(reportId)
      alert('Xuất báo cáo Excel thành công!')
    } catch (err) {
      setError(err.message || 'Không thể xuất báo cáo Excel')
      console.error('Export Excel error:', err)
      alert(err.message || 'Không thể xuất báo cáo Excel')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Danh sách báo cáo
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-sans">
            Xem và quản lý các báo cáo trong hệ thống
          </p>
        </div>
        <button 
          onClick={handleCreateReport}
          disabled={submitting}
          className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang tạo...' : '+ Tạo báo cáo mới'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên báo cáo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
            />
          </div>
          <div className="sm:w-48">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-sans"
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 font-medium">Không có báo cáo nào</p>
          </div>
        ) : (
          <>
            {/* Card View - Mobile/Tablet */}
            <div className="lg:hidden divide-y divide-gray-200">
              {reports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-1">
                        {report.ten_bao_cao}
                      </h3>
                      <p className="text-xs text-gray-500 font-sans">
                        Ngày: {formatDate(report.ngay_bao_cao)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      report.loai_bao_cao === 'tu_dong' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {report.loai_bao_cao === 'tu_dong' ? 'Tự động' : 'Thủ công'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(report)}
                      className="flex-1 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => handleExportExcel(report.id)}
                      disabled={submitting}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xuất Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table View - Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tên báo cáo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ngày báo cáo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-semibold text-gray-900">
                          {report.ten_bao_cao}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-sans text-gray-700">
                        {formatDate(report.ngay_bao_cao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          report.loai_bao_cao === 'tu_dong' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {report.loai_bao_cao === 'tu_dong' ? 'Tự động' : 'Thủ công'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-sans text-gray-500">
                        {formatDateTime(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(report)}
                          className="text-primary hover:text-primary-dark mr-4"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => handleExportExcel(report.id)}
                          disabled={submitting}
                          className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Xuất Excel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm font-sans text-gray-700 text-center sm:text-left">
              Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} báo cáo
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 font-medium">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedReport.report.ten_bao_cao}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedReport(null)
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
              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Danh sách thành viên */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Danh sách thành viên ({selectedReport.users?.length || 0})
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Tên Zalo
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Số điện thoại
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Điểm hiện tại
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedReport.users?.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-sans text-gray-900">
                                  {user.id}
                                </td>
                                <td className="px-4 py-3 text-sm font-sans text-gray-700">
                                  {user.ten_zalo}
                                </td>
                                <td className="px-4 py-3 text-sm font-sans text-gray-700">
                                  {user.sdt || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                  {parseFloat(user.so_diem).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách giao dịch */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Danh sách giao dịch ({selectedReport.transactions?.length || 0})
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Người gửi
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Người nhận
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Loại
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Số điểm
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Ngày giờ
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedReport.transactions?.map((tx) => (
                              <tr key={tx.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-sans text-gray-900">
                                  #{tx.id}
                                </td>
                                <td className="px-4 py-3 text-sm font-sans text-gray-700">
                                  {tx.ten_nguoi_gui}
                                </td>
                                <td className="px-4 py-3 text-sm font-sans text-gray-700">
                                  {tx.ten_nguoi_nhan}
                                </td>
                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    tx.ten_loai_giao_dich === 'Giao lịch' 
                                      ? 'bg-blue-100 text-blue-800'
                                      : tx.ten_loai_giao_dich === 'San điểm'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {tx.ten_loai_giao_dich}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                  {parseFloat(tx.so_diem_giao_dich).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm font-sans text-gray-500">
                                  {formatDateTime(tx.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleExportExcel(selectedReport.report.id)}
                disabled={submitting}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang xuất...' : 'Xuất báo cáo Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DanhSachBaoCao
