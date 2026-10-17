import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-200">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-800">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">PhishGuard AI</Link>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link to="/admin" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-tachometer-alt mr-3"></i> Dashboard
            </Link>
            <Link to="/admin/users" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-users mr-3"></i> Users
            </Link>
            <Link to="/admin/results" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-database mr-3"></i> Scan Results
            </Link>
            <Link to="/admin/feedback" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-comments mr-3"></i> Feedback
            </Link>
            <Link to="/admin/domains" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-globe mr-3"></i> Trusted Domains
            </Link>
            <Link to="/admin/features" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-microchip mr-3"></i> Feature Flags
            </Link>
            <Link to="/admin/feature-requests" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-flag mr-3"></i> Feature Requests
            </Link>
            <Link to="/admin/requests" className="nav-item flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800">
              <i className="fas fa-user-check mr-3"></i> Requests
            </Link>
          </nav>
          <div className="px-4 py-6 border-t border-gray-800">
            <button onClick={logout} className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">Logout</button>
          </div>
        </div>
      </div>
      <div className="md:ml-64">
        <header className="bg-[#111827] border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400 hover:text-white"><i className="fas fa-bars"></i></button>
          <h1 className="text-xl font-bold">Admin Command Center</h1>
          <span className="text-sm text-green-400 font-mono">Admin Mode</span>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
