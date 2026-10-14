import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  CalendarClock,
  History,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Check,
  X,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Tab states: 'users' | 'extensions' | 'logs' | 'analytics'
  const [activeTab, setActiveTab] = useState<'users' | 'extensions' | 'logs' | 'analytics'>('analytics');

  // Data states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Loading & Paging
  const [loading, setLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [logPages, setLogPages] = useState(1);

  // Form states (User updating)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('employee');
  const [editStatus, setEditStatus] = useState('active');
  const [editDept, setEditDept] = useState('Computer Science');

  // Extension review state
  const [reviewComments, setReviewComments] = useState('');

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      if (response.data.success) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsersList(response.data.users);
      }
    } catch (err) {
      console.error('Failed to load user records:', err);
    }
  };

  const fetchExtensions = async () => {
    try {
      const response = await api.get('/extensions');
      if (response.data.success) {
        setExtensions(response.data.extensions);
      }
    } catch (err) {
      console.error('Failed to load extension requests:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get(`/audit?page=${logPage}&limit=20`);
      if (response.data.success) {
        setAuditLogs(response.data.logs);
        setLogPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    if (activeTab === 'analytics') await fetchAnalytics();
    if (activeTab === 'users') await fetchUsers();
    if (activeTab === 'extensions') await fetchExtensions();
    if (activeTab === 'logs') await fetchAuditLogs();
    setLoading(false);
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab, logPage]);

  // Handle User Save Action
  const handleUpdateUser = async (userId: string) => {
    try {
      const response = await api.put('/users/update-settings', {
        userId,
        role: editRole,
        status: editStatus,
        department: editDept,
      });

      if (response.data.success) {
        alert('User details updated successfully.');
        setEditingUserId(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Handle Extension approval / rejection
  const handleReviewExtension = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await api.post('/extensions/review', {
        requestId,
        action,
        comments: reviewComments || `${action.toUpperCase()}D by admin`,
      });

      if (response.data.success) {
        alert(`Extension request successfully ${action === 'approve' ? 'Approved' : 'Rejected'}`);
        setReviewComments('');
        fetchExtensions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to review extension');
    }
  };

  // Export report datasets to Excel-compatible CSV format
  const exportToCSV = () => {
    if (!analytics) return;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Thapar Innovate Portal - Productivity Report\n';
    csvContent += `Generated Date, ${new Date().toLocaleDateString()}\n\n`;
    
    // Core Metrics
    csvContent += 'Metric, Value\n';
    csvContent += `Total Users, ${analytics.stats.totalUsers}\n`;
    csvContent += `Total Employees, ${analytics.stats.totalEmployees}\n`;
    csvContent += `Total Tasks, ${analytics.stats.totalTasks}\n`;
    csvContent += `Completed Tasks, ${analytics.stats.approvedTasks}\n`;
    csvContent += `Pending Tasks, ${analytics.stats.pendingTasks}\n`;
    csvContent += `Overdue Tasks, ${analytics.stats.overdueTasks}\n`;
    csvContent += `Average Completion Rate, ${analytics.stats.averageCompletionPercentage}%\n\n`;

    // Department Distribution
    csvContent += 'Department, Total Tasks, Completed, Pending\n';
    analytics.charts.departmentDistribution.forEach((d: any) => {
      csvContent += `"${d.department}", ${d.total}, ${d.completed}, ${d.pending}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tiet-innovate-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Layout generation
  const handlePrintPDF = () => {
    window.print();
  };

  // Recharts colors
  const COLORS = ['#800000', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

  return (
    <Layout>
      <div className="space-y-6 print:space-y-4 print:p-0">
        
        {/* Admin Header controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:border-none">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center">
              <ShieldCheck className="w-6.5 h-6.5 text-red-700 mr-2 shrink-0" />
              <span>System Administration Portal</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Review analytics charts, manage employee roles, audit activities, and approve deadline extensions.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0 print:hidden">
            <button
              onClick={exportToCSV}
              disabled={!analytics}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={handlePrintPDF}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Tab Controls Navigation */}
        <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-md print:hidden">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'users', label: 'Employees', icon: Users },
            { id: 'extensions', label: 'Extensions', icon: CalendarClock },
            { id: 'logs', label: 'Audit Logs', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setLogPage(1);
                }}
                className={`flex items-center justify-center space-x-1.5 flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isSel
                    ? 'bg-white text-red-800 shadow dark:bg-slate-800 dark:text-red-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Tabs Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading admin dashboard components...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB: Analytics Charting Dashboard */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                
                {/* Micro metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                  <div className="glass-card p-4 rounded-xl flex items-center space-x-4 border border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Users</p>
                      <p className="text-lg font-black">{analytics.stats.totalUsers}</p>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl flex items-center space-x-4 border border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Tasks</p>
                      <p className="text-lg font-black">{analytics.stats.totalTasks - analytics.stats.approvedTasks}</p>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl flex items-center space-x-4 border border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Closed (Approved)</p>
                      <p className="text-lg font-black">{analytics.stats.approvedTasks}</p>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl flex items-center space-x-4 border border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completion Rate</p>
                      <p className="text-lg font-black">{analytics.stats.averageCompletionPercentage}%</p>
                    </div>
                  </div>
                </div>

                {/* Recharts section */}
                <div className="grid md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-10">
                  
                  {/* Task Status Distribution */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider">Task Status Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.charts.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          >
                            {analytics.charts.statusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tasks by Department */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider">Tasks by Department</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.charts.departmentDistribution}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="department" stroke="#888888" fontSize={10} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="total" name="Total Tasks" fill="#800000" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="completed" name="Closed Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Monthly Productivity */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider">Monthly Productivity (Last 6 Months)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.charts.monthlyProductivity}>
                          <defs>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={10} />
                          <YAxis stroke="#888888" fontSize={10} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Area type="monotone" dataKey="completed" name="Tasks Closed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                          <Area type="monotone" dataKey="created" name="Tasks Created" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Performer Employees */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider">Top Performer Performance</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.charts.employeePerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis type="number" stroke="#888888" fontSize={10} />
                          <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} tickLine={false} width={80} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="completed" name="Closed Tasks" fill="#10b981" stackId="a" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="pending" name="Pending Tasks" fill="#3b82f6" stackId="a" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: User Management List */}
            {activeTab === 'users' && (
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs">
                      {usersList.map((userRecord) => (
                        <tr key={userRecord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <img
                              src={userRecord.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userRecord.name)}`}
                              alt=""
                              className="w-8.5 h-8.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{userRecord.name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-550 dark:text-slate-400 font-semibold">{userRecord.email}</td>
                          
                          {/* Role Select */}
                          <td className="px-6 py-4">
                            {editingUserId === userRecord._id ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded py-1 px-2 text-xs"
                              >
                                <option value="admin">Admin</option>
                                <option value="employee">Employee</option>
                                <option value="intern">Intern</option>
                              </select>
                            ) : (
                              <span className="capitalize font-semibold">{userRecord.role}</span>
                            )}
                          </td>

                          {/* Department Select */}
                          <td className="px-6 py-4">
                            {editingUserId === userRecord._id ? (
                              <input
                                type="text"
                                value={editDept}
                                onChange={(e) => setEditDept(e.target.value)}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded py-1 px-2 text-xs w-28"
                              />
                            ) : (
                              <span className="font-semibold text-slate-400">{userRecord.department}</span>
                            )}
                          </td>

                          {/* Status Badge Select */}
                          <td className="px-6 py-4">
                            {editingUserId === userRecord._id ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded py-1 px-2 text-xs"
                              >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                userRecord.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {userRecord.status}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {userRecord._id === user?.id ? (
                              <span className="text-[10px] text-slate-400 italic">Self</span>
                            ) : editingUserId === userRecord._id ? (
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleUpdateUser(userRecord._id)}
                                  className="p-1 bg-red-800 text-white rounded hover:bg-red-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingUserId(userRecord._id);
                                  setEditRole(userRecord.role);
                                  setEditStatus(userRecord.status);
                                  setEditDept(userRecord.department);
                                }}
                                className="text-red-700 hover:underline font-semibold"
                              >
                                Manage Settings
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Extension Requests Approval */}
            {activeTab === 'extensions' && (
              <div className="space-y-4">
                <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Evaluation Remarks / Review Comments
                  </label>
                  <input
                    type="text"
                    placeholder="Provide review reasoning (e.g. approved due to medical leave, rejected due to upcoming deadline)..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                {extensions.length === 0 ? (
                  <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
                    No deadline extension requests pending review.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {extensions.map((req) => (
                      <div
                        key={req._id}
                        className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={req.requestedBy.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(req.requestedBy.name)}`}
                              alt=""
                              className="w-6.5 h-6.5 rounded-full"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{req.requestedBy.name}</p>
                              <p className="text-[9px] text-slate-400 leading-none mt-1 capitalize">{req.requestedBy.role} • {req.requestedBy.department}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400 font-semibold">Task Associated:</p>
                          <p className="text-sm font-bold truncate mt-0.5">{req.taskId?.title || 'Unknown Task'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                          <div>
                            <p className="text-slate-400 text-[10px] leading-none font-semibold">Current Deadline</p>
                            <p className="font-bold text-red-650 mt-1">{req.taskId?.deadline ? new Date(req.taskId.deadline).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] leading-none font-semibold">Requested New</p>
                            <p className="font-bold text-emerald-600 mt-1">{new Date(req.requestedDeadline).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400 font-semibold">Justification Reason:</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 mt-1 italic leading-relaxed">
                            "{req.reason}"
                          </p>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex space-x-2 pt-2 border-t border-slate-100 dark:border-slate-850/50 justify-end">
                            <button
                              onClick={() => handleReviewExtension(req._id, 'approve')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReviewExtension(req._id, 'reject')}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Audit Logs */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          <th className="px-6 py-4">Timestamp</th>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4">Details</th>
                          <th className="px-6 py-4">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-[11px]">
                        {auditLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-6 py-3 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="px-6 py-3 font-semibold">
                              {log.user ? (
                                <span>{log.user.name} ({log.user.role})</span>
                              ) : (
                                <span className="text-slate-400 italic">System</span>
                              )}
                            </td>
                            <td className="px-6 py-3 font-bold text-red-800 dark:text-red-400 uppercase tracking-wide">{log.action}</td>
                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300 leading-normal max-w-sm truncate">{log.details}</td>
                            <td className="px-6 py-3 text-slate-400 font-mono">{log.ipAddress || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Log Pagination Controls */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Page {logPage} of {logPages}</span>
                  <div className="flex space-x-1">
                    <button
                      disabled={logPage === 1}
                      onClick={() => setLogPage(logPage - 1)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-500 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={logPage === logPages}
                      onClick={() => setLogPage(logPage + 1)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-500 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
};
