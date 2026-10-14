import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, CalendarDays, ExternalLink, RefreshCw } from 'lucide-react';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      // Update local state
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      // Navigate to task detail if link is specified
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      if (response.data.success) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-slate-100 flex items-center">
              <Bell className="w-6 h-6 text-red-700 mr-2 shrink-0" />
              <span>In-App Notification Center</span>
            </h1>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
              Receive updates on tasks assignments, deadline changes, approvals and submissions.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              onClick={fetchNotifications}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading notification logs...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-slate-450 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-250">No notifications</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-relaxed">
              Your inbox is clean! You will receive live alerts when assignments details change or status transitions occur.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-150 dark:divide-slate-800">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleMarkAsRead(notif._id, notif.link)}
                className={`p-5 flex items-start justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all relative ${
                  !notif.isRead ? 'bg-red-50/10 dark:bg-red-950/5' : ''
                }`}
              >
                {/* Unread circle highlight */}
                {!notif.isRead && (
                  <div className="w-1.5 h-1.5 bg-red-700 rounded-full absolute left-3 top-7.5 animate-ping" />
                )}

                <div className="flex-1 min-w-0 pr-4 pl-2.5">
                  <h3 className={`text-xs font-bold ${!notif.isRead ? 'text-red-800 dark:text-red-400' : 'text-slate-650 dark:text-slate-200'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  
                  <div className="flex items-center space-x-1 mt-2 text-[10px] text-slate-400 font-medium">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {notif.link && (
                  <div className="p-1.5 bg-slate-100 hover:bg-red-800 text-slate-500 hover:text-white dark:bg-slate-800 dark:hover:bg-red-800 dark:text-slate-450 rounded-lg transition-colors shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
};
