import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusSquare,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Shield,
  Menu,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Poll notifications count
  const fetchNotificationCount = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setUnreadNotifications(response.data.unreadCount);
      }
    } catch (error) {
      // Quiet fail if not authorized
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'employee', 'intern'] },
    { label: 'Create Task', path: '/tasks/create', icon: PlusSquare, roles: ['admin', 'employee'] }, // Employees/admins can create tasks
    { label: 'Admin Portal', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
    { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['admin', 'employee', 'intern'], badge: unreadNotifications },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'employee', 'intern'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img src="/logo.png" alt="TIET Innovate" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-wider">TIET INNOVATE</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar: Desktop */}
      <aside className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40`}>
        {/* Branding header */}
        <div className="hidden md:flex items-center space-x-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <img src="/logo.png" alt="Thapar Innovate" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100 uppercase">Thapar Innovate</h1>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Employee Portal</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.name || '')}`}
            alt="Profile Avatar"
            className="w-10 h-10 rounded-full border border-red-800/20 bg-white"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">{user?.name}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{user?.role} • {user?.department}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-red-800 text-white shadow-md shadow-red-900/10'
                    : 'text-slate-600 hover:text-red-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-red-800' : 'bg-red-800 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls (Dark Mode Toggle & Logout) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="hidden md:flex items-center space-x-3 w-full px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all font-medium text-sm text-left"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4.5 h-4.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4.5 h-4.5 text-slate-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 rounded-xl transition-all font-medium text-sm text-left"
          >
            <LogOut className="w-4.5 h-4.5 text-slate-400 hover:text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
};
