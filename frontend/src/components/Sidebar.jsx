import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authAPI } from '../service/api'

const Sidebar = ({ isAdmin = true, isCollapsed = false, onToggle, isMobileOpen = false, onMobileClose, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Get current user info
  useEffect(() => {
    const user = authAPI.getCurrentUser()
    setCurrentUser(user)
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    authAPI.logout()
    navigate('/danh-sach-nguoi-dung')
    setShowUserMenu(false)
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const words = name.split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Admin menu structure with sections
  const menuSections = [
    {
      id: 'user-management',
      label: 'Quản lý người dùng',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      items: [
        {
          id: 'user-list',
          label: 'Danh sách người dùng',
          path: '/danh-sach-nguoi-dung'
        },
        {
          id: 'add-user',
          label: 'Thêm mới người dùng',
          path: '/them-moi-nguoi-dung'
        }
      ]
    },
    {
      id: 'transaction-management',
      label: 'Quản lý giao dịch',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      items: [
        {
          id: 'transaction-list',
          label: 'Danh sách giao dịch',
          path: '/danh-sach-giao-dich'
        },
        {
          id: 'create-transaction',
          label: 'Tạo mới giao dịch',
          path: '/tao-moi-giao-dich'
        }
      ]
    },
    {
      id: 'reports',
      label: 'Quản lý báo cáo',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      items: [
        {
          id: 'report-list',
          label: 'Danh sách báo cáo',
          path: '/danh-sach-bao-cao'
        }
      ]
    }
  ]

  const handleMenuClick = (path) => {
    navigate(path)
  }

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isCollapsed)
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`bg-white shadow-lg h-screen fixed left-0 top-0 transition-all duration-300 z-50 ${
        // Mobile: slide in/out
        isMobileOpen ? 'w-80' : '-translate-x-full lg:translate-x-0'
      } ${
        // Desktop: collapse/expand
        isCollapsed ? 'lg:w-20' : 'lg:w-80'
      }`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-3 sm:px-4 border-b border-gray-200">
          {(!isCollapsed || isMobileOpen) && (
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Quản lý điểm
            </h2>
          )}
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary"
              aria-label="Close sidebar"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Desktop Toggle Button */}
            <button
              onClick={handleToggle}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary"
              aria-label="Toggle sidebar"
            >
              <svg 
                className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

      {/* Menu Items */}
      <nav className="mt-4 sm:mt-6 px-2 sm:px-3">
        <ul className="space-y-1 sm:space-y-2">
          {menuSections.map((section) => {
            // Check if section has sub-items (user management) or is a single item
            if (section.items) {
              // Section with sub-items
              const isSectionActive = section.items.some(item => isActive(item.path))
              return (
                <li key={section.id} className="space-y-1">
                  {/* Section Header */}
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="px-3 sm:px-4 py-2 text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider">
                      {section.label}
                    </div>
                  )}
                  {/* Sub-items */}
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.path)
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => {
                              handleMenuClick(item.path)
                              // Close mobile sidebar when clicking a menu item
                              if (onMobileClose) {
                                onMobileClose()
                              }
                            }}
                            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-base sm:text-lg font-bold ${
                              active
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                            }`}
                            title={(isCollapsed && !isMobileOpen) ? item.label : ''}
                          >
                            {(!isCollapsed || isMobileOpen) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            )}
                            {(!isCollapsed || isMobileOpen) && (
                              <span className="flex-1 text-left">
                                {item.label}
                              </span>
                            )}
                            {active && (!isCollapsed || isMobileOpen) && (
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            } else {
              // Single menu item
              const active = isActive(section.path)
              return (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      handleMenuClick(section.path)
                      // Close mobile sidebar when clicking a menu item
                      if (onMobileClose) {
                        onMobileClose()
                      }
                    }}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-base sm:text-lg font-bold ${
                      active
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                    title={(isCollapsed && !isMobileOpen) ? section.label : ''}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 ${active ? 'text-white' : 'text-gray-600'}`}>
                      {section.icon}
                    </span>
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="flex-1 text-left">
                        {section.label}
                      </span>
                    )}
                    {active && (!isCollapsed || isMobileOpen) && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}
                  </button>
                </li>
              )
            }
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-200" ref={userMenuRef}>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-2 sm:gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors ${(isCollapsed && !isMobileOpen) ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0">
              {currentUser ? getInitials(currentUser.ten_zalo) : 'A'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                  {currentUser?.ten_zalo || 'Admin'}
                </p>
                <p className="text-[10px] sm:text-xs font-sans text-gray-500 truncate">
                  {currentUser?.la_admin ? 'Quản trị viên' : 'Người dùng'}
                </p>
              </div>
            )}
            {(!isCollapsed || isMobileOpen) && (
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (!isCollapsed || isMobileOpen) && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

export default Sidebar
