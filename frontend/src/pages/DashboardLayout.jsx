// src/pages/DashboardLayout.jsx
import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/app', label: 'Dashboard', icon: 'fa-gauge-high', end: true }],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/app/scan', label: 'Email Scanner', icon: 'fa-envelope-open-text' },
      { to: '/app/batch', label: 'Batch Scan', icon: 'fa-layer-group' },
      { to: '/app/history', label: 'Scan History', icon: 'fa-clock-rotate-left' },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/app/settings', label: 'Settings', icon: 'fa-gear' }],
  },
];

const PAGE_TITLES = {
  '/app': 'Dashboard',
  '/app/scan': 'Email Scanner',
  '/app/batch': 'Batch Scan',
  '/app/history': 'Scan History',
  '/app/settings': 'Settings',
};

const navItemClassName = ({ isActive }) =>
  [
    'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-[0.99]',
    isActive ? 'bg-blue-500/10 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
  ].join(' ');

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // drawer: mobile only
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem('userRole') || 'user';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userInitials = userEmail.split('@')[0].substring(0, 2).toUpperCase();
  const pageTitle = PAGE_TITLES[location.pathname] || 'PhishGuard AI';

  // Close overlays when the route changes (React's "adjust state during
  // render" pattern — avoids an effect that only resets state).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setSidebarOpen(false);
    setProfileOpen(false);
  }

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-200 font-sans antialiased">
      {/* Sidebar drawer backdrop (mobile) */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800 bg-[#111827] transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-gray-800 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <i className="fas fa-shield-halved" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-white">PhishGuard AI</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {section.label}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={navItemClassName}>
                      <i className={`fas ${item.icon} w-4 text-center`} aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {userRole === 'admin' && (
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Administration
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <NavLink to="/admin" className={navItemClassName}>
                    <i className="fas fa-user-shield w-4 text-center" aria-hidden="true" />
                    Admin Console
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-gray-800 px-4 py-4">
          <div className="flex items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
              {userInitials}
            </span>
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {userRole === 'admin' ? 'Admin User' : 'Standard User'}
              </p>
              <p className="truncate text-xs text-gray-400" title={userEmail}>
                {userEmail}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600/90 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-red-600 active:scale-[0.98]"
          >
            <i className="fas fa-right-from-bracket" aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-gray-800 bg-[#111827]/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            className="inline-flex min-h-11 items-center justify-center rounded-lg p-2.5 text-gray-400 transition hover:bg-gray-800 hover:text-white active:scale-95 md:hidden"
          >
            <i className="fas fa-bars" aria-hidden="true" />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-white sm:text-xl">
            {pageTitle}
          </h1>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-gray-300 transition hover:bg-gray-800 hover:text-white active:scale-[0.98]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {userInitials}
              </span>
              <i
                className={`fas fa-chevron-down text-[10px] text-gray-500 transition-transform ${
                  profileOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <>
                {/* Click-away backdrop */}
                <button
                  type="button"
                  aria-label="Close profile menu"
                  onClick={() => setProfileOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 rounded-xl border border-gray-700 bg-[#111827] p-2 shadow-2xl shadow-black/40"
                >
                  <div className="border-b border-gray-800 px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-white" title={userEmail}>
                      {userEmail}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-blue-300">
                      {userRole === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <Link
                    to="/app/settings"
                    role="menuitem"
                    className="mt-1 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
                  >
                    <i className="fas fa-gear w-4 text-center text-gray-500" aria-hidden="true" />
                    Account settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                  >
                    <i
                      className="fas fa-right-from-bracket w-4 text-center text-red-400"
                      aria-hidden="true"
                    />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
