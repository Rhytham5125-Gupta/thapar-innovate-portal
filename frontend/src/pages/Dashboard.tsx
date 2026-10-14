import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { TaskCard } from '../components/TaskCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertOctagon,
  CalendarDays,
  Search,
  Filter,
  RefreshCw,
  FolderDot,
  FileText
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const [departments, setDepartments] = useState<any[]>([]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (err) {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchDepartments();
  }, []);

  // Compute stats metrics dynamically
  const now = new Date();
  
  const totalTasks = tasks.length;
  
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'approved').length; // approved (closed)
  
  const overdueTasks = tasks.filter(t => {
    return t.status !== 'approved' && new Date(t.deadline) < now;
  }).length;

  const upcomingDeadlines = tasks.filter(t => {
    if (t.status === 'approved') return false;
    const diff = new Date(t.deadline).getTime() - now.getTime();
    return diff > 0 && diff < 48 * 60 * 60 * 1000; // Less than 48h
  }).length;

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase()) ||
      (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesDept = deptFilter === 'all' || task.department === deptFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDept;
  });

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Here is an overview of your department activities and assigned assignments.
            </p>
          </div>
          <button
            onClick={fetchTasks}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 text-sm border border-slate-200 dark:border-slate-800/80"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Board</span>
          </button>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tasks</p>
              <p className="text-xl font-extrabold">{totalTasks}</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending</p>
              <p className="text-xl font-extrabold">{pendingTasks}</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">In Progress</p>
              <p className="text-xl font-extrabold">{inProgressTasks}</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed</p>
              <p className="text-xl font-extrabold">{completedTasks}</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overdue</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{overdueTasks}</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Urgent</p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{upcomingDeadlines}</p>
            </div>
          </div>

        </div>

        {/* Search, Filter Toolbar */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Global search */}
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by title, description or assignee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-red-800 transition-colors"
            />
          </div>

          {/* Filter selects */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-600 dark:text-slate-300 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="under-review">Under Review</option>
                <option value="changes-requested">Changes Requested</option>
                <option value="approved">Approved (Closed)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              <FolderDot className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-600 dark:text-slate-300 font-semibold"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-600 dark:text-slate-300 font-semibold"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks grid rendering */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading task boards...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/20 border border-red-800/40 p-4 rounded-2xl text-center text-red-500 text-sm">
            {error}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No tasks found</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 max-w-md mx-auto leading-relaxed">
              No tasks matched your search query or filters. Check back later or try adjusting filters.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
};
