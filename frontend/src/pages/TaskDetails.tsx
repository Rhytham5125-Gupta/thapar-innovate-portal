import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileCheck,
  UploadCloud,
  FileText,
  User as UserIcon,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  FileWarning,
  MessageSquareCode,
  Download,
  AlertTriangle,
  FolderDot
} from 'lucide-react';

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form toggle states
  const [isEditing, setIsEditing] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Form Fields - Editing
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDept, setEditDept] = useState('Computer Science');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);

  // Form Fields - Extension Request
  const [extDeadline, setExtDeadline] = useState('');
  const [extReason, setExtReason] = useState('');
  const [extError, setExtError] = useState<string | null>(null);

  // Form Fields - Work Submission
  const [subNotes, setSubNotes] = useState('');
  const [subFiles, setSubFiles] = useState<FileList | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  // Form Fields - Submission Review
  const [activeReviewSubId, setActiveReviewSubId] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  // States for Admin Direct Extension Review
  const [pendingExtension, setPendingExtension] = useState<any>(null);
  const [adminExtensionComment, setAdminExtensionComment] = useState('');

  // States for Employee/Admin Direct Intern Assignment
  const [selectedInternId, setSelectedInternId] = useState('');
  const [assigningIntern, setAssigningIntern] = useState(false);

  const fetchTaskDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/tasks/${id}`);
      if (response.data.success) {
        const taskData = response.data.task;
        setTask(taskData);
        
        // Initialize editing state
        setEditTitle(taskData.title);
        setEditDescription(taskData.description);
        setEditPriority(taskData.priority);
        setEditDept(taskData.department);
        setEditAssignedTo(taskData.assignedTo?._id || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await api.get(`/submissions/task/${id}`);
      if (response.data.success) {
        setSubmissions(response.data.submissions);
      }
    } catch (err) {
      console.error('Failed to load submission history:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsersList(response.data.users);
      }
    } catch (err) {
      console.error('Failed to retrieve user directory:', err);
    }
  };

  const fetchPendingExtension = async () => {
    try {
      const response = await api.get('/extensions');
      if (response.data.success) {
        const match = response.data.extensions.find(
          (ext: any) => ext.taskId?._id === id && ext.status === 'pending'
        );
        setPendingExtension(match || null);
      }
    } catch (err) {
      console.error('Failed to load pending extension requests:', err);
    }
  };

  const handleReviewExtensionOnTask = async (action: 'approve' | 'reject') => {
    if (!pendingExtension) return;
    try {
      const response = await api.post('/extensions/review', {
        requestId: pendingExtension._id,
        action,
        comments: adminExtensionComment || `${action.toUpperCase()}D via Task Page`,
      });

      if (response.data.success) {
        alert(`Extension request successfully ${action}d.`);
        setPendingExtension(null);
        setAdminExtensionComment('');
        fetchTaskDetails(); // Reload task
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to review extension request');
    }
  };

  useEffect(() => {
    fetchTaskDetails();
    fetchSubmissions();
    fetchUsers();
    if (user?.role === 'admin') {
      fetchPendingExtension();
    }
  }, [id, user]);

  const handleStartTask = async () => {
    try {
      const response = await api.patch(`/tasks/${id}/status`, { status: 'in-progress' });
      if (response.data.success) {
        setTask(response.data.task);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start task');
    }
  };

  const handleClaimTask = async () => {
    try {
      const response = await api.post(`/tasks/${id}/claim`);
      if (response.data.success) {
        setTask(response.data.task);
        alert('Task claimed successfully! You are now the assignee.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to claim task');
    }
  };

  const handleAssignToIntern = async () => {
    if (!selectedInternId) return;
    setAssigningIntern(true);
    try {
      const response = await api.put(`/tasks/${id}`, {
        assignedTo: selectedInternId,
      });
      if (response.data.success) {
        setTask(response.data.task);
        setSelectedInternId('');
        alert('Task successfully assigned to intern!');
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign task to intern');
    } finally {
      setAssigningIntern(false);
    }
  };

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: editTitle,
        description: editDescription,
        assignedTo: editAssignedTo || null,
      };
      if (isAdmin || isCreator) {
        payload.priority = editPriority;
        payload.department = editDept;
      }
      const response = await api.put(`/tasks/${id}`, payload);

      if (response.data.success) {
        setTask(response.data.task);
        setIsEditing(false);
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task permanently?')) return;
    try {
      const response = await api.delete(`/tasks/${id}`);
      if (response.data.success) {
        navigate('/');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleRequestExtensionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extDeadline || !extReason) {
      setExtError('Please fill in both the new deadline and the reason.');
      return;
    }

    setExtError(null);
    try {
      const response = await api.post('/extensions/request', {
        taskId: id,
        requestedDeadline: extDeadline,
        reason: extReason,
      });

      if (response.data.success) {
        setShowExtensionModal(false);
        setExtDeadline('');
        setExtReason('');
        alert('Deadline extension request submitted to administrators.');
      }
    } catch (err: any) {
      setExtError(err.response?.data?.message || 'Failed to submit extension request');
    }
  };

  const handleWorkSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFiles || subFiles.length === 0) {
      setSubError('At least one file attachment is required.');
      return;
    }

    setSubError(null);
    const formData = new FormData();
    formData.append('taskId', id || '');
    formData.append('notes', subNotes);
    for (let i = 0; i < subFiles.length; i++) {
      formData.append('files', subFiles[i]);
    }

    try {
      const response = await api.post('/submissions/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setTask(response.data.task);
        setShowSubmissionModal(false);
        setSubNotes('');
        setSubFiles(null);
        fetchSubmissions();
        alert('Work submitted. Task is now under review.');
      }
    } catch (err: any) {
      setSubError(err.response?.data?.message || 'Failed to submit work files');
    }
  };

  const handleReviewSubmissionSubmit = async (action: 'approve' | 'request-changes') => {
    if (!reviewComments && action === 'request-changes') {
      setReviewError('Review comments are required when requesting revisions.');
      return;
    }

    setReviewError(null);
    try {
      const response = await api.post('/submissions/review', {
        submissionId: activeReviewSubId,
        action,
        reviewComments,
      });

      if (response.data.success) {
        setTask(response.data.task);
        setShowReviewModal(false);
        setReviewComments('');
        fetchSubmissions();
        alert(`Work submission has been marked as: ${action === 'approve' ? 'Approved (Closed)' : 'Changes Requested'}`);
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading task details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-2xl text-center text-red-500 max-w-xl mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="font-semibold text-sm">{error || 'Task not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // Permission flags
  const isCreator = ((task.createdBy as any)?._id || task.createdBy) === user?.id;
  const isAssigned = ((task.assignedTo as any)?._id || task.assignedTo) === user?.id;
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  const canDelegate = (isAdmin || isEmployee) && (isAssigned || isCreator || !task.assignedTo || task.department === user?.department);
  const canEdit = isAdmin || isCreator || (isAssigned && task.editPermissionGranted) || canDelegate;
  const isOverdue = new Date() > new Date(task.deadline);
  const isOverdueAndNotApproved = isOverdue && task.status !== 'approved';

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved (Closed)';
      case 'changes-requested': return 'Changes Requested';
      case 'work-submitted': return 'Work Submitted';
      case 'under-review': return 'Under Review';
      case 'in-progress': return 'In Progress';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{task.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 uppercase">
                  {task.department}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                  task.priority === 'high' ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {task.priority} Priority
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Task</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={handleDeleteTask}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Details Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Main Panel */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Task Details Form or View */}
            {isEditing ? (
              <form onSubmit={handleEditTaskSubmit} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Edit Task Details</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Task Heading</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea
                    required
                    rows={5}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                  />
                </div>

                {(isAdmin || canDelegate || isCreator) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Department Scope</label>
                      <input
                        type="text"
                        disabled={!isAdmin && !isCreator}
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-sm focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Assign Intern / Assignee</label>
                      <select
                        value={editAssignedTo}
                        onChange={(e) => setEditAssignedTo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                      >
                        <option value="">Open to Everyone (Claimable Task)</option>
                        <optgroup label="🎓 Interns">
                          {usersList.filter(u => u.role === 'intern').map((u) => (
                            <option key={u._id} value={u._id}>{u.name} (Intern - {u.department})</option>
                          ))}
                        </optgroup>
                        <optgroup label="💼 Employees">
                          {usersList.filter(u => u.role === 'employee').map((u) => (
                            <option key={u._id} value={u._id}>{u.name} (Employee - {u.department})</option>
                          ))}
                        </optgroup>
                        {isAdmin && (
                          <optgroup label="🛡️ Administrators">
                            {usersList.filter(u => u.role === 'admin').map((u) => (
                              <option key={u._id} value={u._id}>{u.name} (Admin - {u.department})</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Description</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {task.description}
                </p>

                {/* Attachments links */}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Reference Files / Attachments</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {task.attachments.map((file: any, idx: number) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl hover:border-red-800/30 transition-all text-xs font-semibold"
                        >
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submissions History */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center">
                <FileCheck className="w-4.5 h-4.5 text-red-500 mr-2" />
                <span>Work Submissions History</span>
              </h3>

              {submissions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                  No submissions recorded yet for this task.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub, idx) => (
                    <div
                      key={sub._id}
                      className="p-4 bg-slate-55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={sub.submittedBy.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(sub.submittedBy.name)}`}
                            alt="Submitter avatar"
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-xs font-bold">{sub.submittedBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(sub.createdAt).toLocaleString()}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            sub.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            sub.status === 'changes-requested' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {sub.status === 'changes-requested' ? 'Changes Req' : sub.status}
                          </span>
                        </div>
                      </div>

                      {sub.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                          {sub.notes}
                        </p>
                      )}

                      {/* Files list */}
                      <div className="grid md:grid-cols-2 gap-2">
                        {sub.files.map((file: any, fIdx: number) => (
                          <div
                            key={fIdx}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg text-xs"
                          >
                            <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                            <a
                              href={file.url.startsWith('http') ? file.url : `${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${file.url}`}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>

                      {/* Review comment details */}
                      {sub.reviewComments && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-850/50 flex items-start space-x-2 text-xs">
                          <MessageSquareCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-600 dark:text-slate-400">Review Comments: </span>
                            <span className="text-slate-500 dark:text-slate-400">{sub.reviewComments}</span>
                          </div>
                        </div>
                      )}

                      {/* Review action buttons (Visible to Admin/Creator for review submission) */}
                      {(isAdmin || isCreator) && sub.status === 'under-review' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-850/50 flex space-x-2 justify-end">
                          <button
                            onClick={() => {
                              setActiveReviewSubId(sub._id);
                              setShowReviewModal(true);
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Evaluate Submission</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar - Status, Actions & Metadata */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Admin Action: Extension Request Review */}
            {user?.role === 'admin' && pendingExtension && (
              <div className="bg-amber-950/20 border border-amber-500/35 p-5 rounded-2xl space-y-4 text-xs">
                <div className="flex items-center space-x-2 text-amber-500">
                  <Calendar className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-[11px]">Extension Requested</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 font-semibold">Requested By:</span>{' '}
                    <span className="font-bold text-slate-200">{pendingExtension.requestedBy?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Requested Date:</span>{' '}
                    <span className="font-bold text-emerald-450">
                      {new Date(pendingExtension.requestedDeadline).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Reason:</span>
                    <p className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg italic text-slate-350 leading-relaxed">
                      "{pendingExtension.reason}"
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Evaluation Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Provide review reasoning (optional)..."
                    value={adminExtensionComment}
                    onChange={(e) => setAdminExtensionComment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-200 focus:border-amber-500"
                  />
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => handleReviewExtensionOnTask('approve')}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReviewExtensionOnTask('reject')}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status Panel */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Assignment Status</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black uppercase text-red-700 dark:text-red-500">
                  {getStatusLabel(task.status)}
                </span>
                <CountdownTimer deadline={task.deadline} status={task.status} />
              </div>

              {/* Task workflow triggers */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                {!task.assignedTo && (
                  <div className="space-y-3">
                    <div className="bg-amber-950/20 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Open Task:</span> This assignment is open to everyone. You must claim this task before you can submit work or request extensions.
                      </div>
                    </div>
                    {['employee', 'intern'].includes(user?.role || '') && (
                      <button
                        onClick={handleClaimTask}
                        className="w-full flex items-center justify-center space-x-1.5 bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-700 hover:to-rose-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Claim & Start Task</span>
                      </button>
                    )}
                  </div>
                )}

                {task.assignedTo && isOverdueAndNotApproved && !isAdmin && (
                  <div className="bg-rose-950/20 border border-rose-500/30 text-rose-450 p-3.5 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold">Deadline Expired:</span> Direct status updates and submissions are locked. You must request a deadline extension and get admin approval to resume.
                    </div>
                  </div>
                )}

                {task.assignedTo && isAssigned && task.status === 'pending' && (
                  <button
                    onClick={handleStartTask}
                    disabled={isOverdue && !isAdmin}
                    className="w-full flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-55"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start Work (In Progress)</span>
                  </button>
                )}

                {task.assignedTo && isAssigned && ['in-progress', 'changes-requested'].includes(task.status) && (
                  <button
                    onClick={() => setShowSubmissionModal(true)}
                    disabled={isOverdue && !isAdmin}
                    className="w-full flex items-center justify-center space-x-1.5 bg-red-800 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-55"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Submit Work Files</span>
                  </button>
                )}

                {task.assignedTo && isAssigned && task.status !== 'approved' && (
                  <button
                    onClick={() => setShowExtensionModal(true)}
                    className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-800"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Request Extension</span>
                  </button>
                )}

                {/* Direct Delegation / Assign to Intern for Employees & Admins */}
                {canDelegate && task.status !== 'approved' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Assign / Delegate to Intern</span>
                      <span className="text-[10px] text-emerald-500 font-semibold">Available</span>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={selectedInternId}
                        onChange={(e) => setSelectedInternId(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-2.5 text-xs focus:outline-none focus:border-red-800 text-slate-700 dark:text-slate-300"
                      >
                        <option value="">Select an Intern...</option>
                        {usersList.filter(u => u.role === 'intern').map((intern) => (
                          <option key={intern._id} value={intern._id}>
                            {intern.name} ({intern.department})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAssignToIntern}
                        disabled={!selectedInternId || assigningIntern}
                        className="px-3.5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        {assigningIntern ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Info Panel */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider">Assignment Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Assigned To:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                    <UserIcon className="w-3.5 h-3.5 mr-1" />
                    {task.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Assigned Email:</span>
                  <span className="font-semibold text-slate-400 truncate max-w-[150px]">
                    {task.assignedTo?.email || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Created By:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {task.createdBy?.name || 'Admin'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Deadline:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {new Date(task.deadline).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Created Date:</span>
                  <span className="font-semibold text-slate-400">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Last Updated:</span>
                  <span className="font-semibold text-slate-400">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal: Request Deadline Extension */}
        {showExtensionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base">Request Extension</h3>
              </div>

              {extError && (
                <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-xs">
                  {extError}
                </div>
              )}

              <form onSubmit={handleRequestExtensionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">New Requested Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={extDeadline}
                    onChange={(e) => setExtDeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Justification Reason</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a detailed, professional reason for requesting an extension..."
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-grow py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExtensionModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Submit Work */}
        {showSubmissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 text-red-700">
                <UploadCloud className="w-5 h-5" />
                <h3 className="font-bold text-base">Submit Work Performed</h3>
              </div>

              {subError && (
                <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-xs">
                  {subError}
                </div>
              )}

              <form onSubmit={handleWorkSubmissionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Upload Deliverables (Multiple support)</label>
                  <input
                    type="file"
                    multiple
                    required
                    onChange={(e) => setSubFiles(e.target.files)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Allowed formats: PDF, Word, Excel, PPT, Zip, Images, and code files (Max 10MB per file).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Submission Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the tasks completed, document revisions, or add references link..."
                    value={subNotes}
                    onChange={(e) => setSubNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-grow py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Submit Deliverables
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmissionModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Evaluate / Review Submission */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 text-red-700">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-base">Evaluate Work Submission</h3>
              </div>

              {reviewError && (
                <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-xs">
                  {reviewError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Review Comments</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed feedback, quality reviews, or details on required revisions..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleReviewSubmissionSubmit('approve')}
                    className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Close</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleReviewSubmissionSubmit('request-changes')}
                    className="flex-grow py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Request Changes</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};
