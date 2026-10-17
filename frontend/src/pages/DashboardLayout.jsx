// src/pages/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // on desktop always visible
  const navigate = useNavigate();

  const userRole = localStorage.getItem('userRole') || 'user';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userInitials = userEmail.split('@')[0].substring(0, 2).toUpperCase();

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-200 font-sans antialiased">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-800">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">PhishGuard AI</Link>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link to="/scanner" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-search mr-3"></i> Scan Email
            </Link>
            <Link to="/scanner/history" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-history mr-3"></i> History
            </Link>
            <Link to="/scanner/batch" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-layer-group mr-3"></i> Batch Scan
            </Link>
            <Link to="/scanner/settings" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-cog mr-3"></i> Settings
            </Link>
          </nav>
          <div className="px-4 py-6 border-t border-gray-800">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">{userInitials}</div>
              <div className="ml-3">
                <p className="text-sm font-medium">{userRole === 'admin' ? 'Admin User' : 'Standard User'}</p>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>
            </div>
            <button onClick={logout} className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">Logout</button>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="md:ml-64">
        <header className="bg-[#111827] border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-2xl font-bold">Security Operations Center</h1>
          <div className="text-sm text-gray-400">Last updated: Just now</div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
