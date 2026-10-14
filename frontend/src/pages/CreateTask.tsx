import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Link as LinkIcon, FileCheck } from 'lucide-react';

export const CreateTask: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [department, setDepartment] = useState(user?.department || 'Computer Science');
  const [assignedTo, setAssignedTo] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attachments simulation
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        // Exclude admin if they don't do tasks, but keep all for simplicity
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch user directory:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const addAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName || !newLinkUrl) return;

    // Detect format
    let type = 'document';
    if (newLinkUrl.endsWith('.pdf')) type = 'pdf';
    else if (newLinkUrl.match(/\.(jpg|jpeg|png)$/i)) type = 'image';
    else if (newLinkUrl.match(/\.(zip|rar)$/i)) type = 'zip';

    setAttachments([...attachments, { name: newLinkName, url: newLinkUrl, type }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const removeAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) {
      setError('Please fill in title, description, and deadline date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/tasks', {
        title,
        description,
        deadline,
        priority,
        department,
        assignedTo: assignedTo || undefined,
        attachments,
      });

      if (response.data.success) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Button & Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Create New Assignment</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Assign task details, set critical priorities, and bind resource links.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-800/40 text-red-500 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main creation form */}
          <form onSubmit={handleSubmit} className="lg:col-span-8 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Task Heading / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prep Computer Science Midterm Examination papers"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Task Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder="Write clear, comprehensive task guidelines, requirements and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-800 transition-colors resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Deadline Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Priority Rating
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-800 transition-colors"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assign Department Scope
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-800 transition-colors"
                >
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Assign Intern / Assignee</span>
                  <span className="text-[10px] text-emerald-500 font-medium">Interns &amp; Employees</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-800 transition-colors"
                >
                  <option value="">Open to Everyone (Claimable Task)</option>
                  <optgroup label="🎓 Interns">
                    {users.filter(u => u.role === 'intern').map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} (Intern - {u.department})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="💼 Employees">
                    {users.filter(u => u.role === 'employee').map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} (Employee - {u.department})
                      </option>
                    ))}
                  </optgroup>
                  {users.some(u => u.role === 'admin') && (
                    <optgroup label="🛡️ Administrators">
                      {users.filter(u => u.role === 'admin').map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} (Admin - {u.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-red-800 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4.5 h-4.5" />
                )}
                <span>Create Task</span>
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl font-semibold text-slate-600 dark:text-slate-300 transition-all text-sm border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Attachments Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center">
                <FileCheck className="w-4 h-4 text-red-500 mr-2" />
                <span>Task Attachments</span>
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Provide reference files or document urls (e.g. syllabus guidelines, template sheets) that are immediately available for download.
              </p>

              {attachments.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="min-w-0 flex-1 flex items-center space-x-2">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs truncate font-medium">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={addAttachment} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  required
                  placeholder="Link Title (e.g. Course Syllabus)"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-red-800"
                />
                
                <input
                  type="url"
                  required
                  placeholder="Attachment URL (http://...)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-red-800"
                />

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Attachment</span>
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};
