import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'

const Layout = ({ children, isAdmin = true, showSidebar = true, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {showSidebar && (
        <>
          <Sidebar 
            isAdmin={isAdmin} 
            isCollapsed={isCollapsed} 
            onToggle={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            onMobileClose={() => setIsMobileOpen(false)}
            onLogout={onLogout}
          />
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary"
            aria-label="Open menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </>
      )}

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
        // Mobile: no margin
        'ml-0'
      } ${
        // Desktop: margin based on collapsed state and sidebar visibility
        showSidebar ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-80') : 'lg:ml-0'
      }`}>
        <div className="p-4 sm:p-5 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout

