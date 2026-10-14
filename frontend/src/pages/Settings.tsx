import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Shield,
  Briefcase,
  FileCheck,
  Calendar,
  Layers,
  History,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        setProfileData(response.data);
      }
    } catch (err) {
      console.error('Failed to load profile metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileStats();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl font-bold tracking-tight">Account & Profile Settings</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            View security parameters, department details, and task statistics.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading profile summary...</p>
          </div>
        ) : profileData ? (
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left Card: Profile Credentials */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                <img
                  src={profileData.profile.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profileData.profile.name)}`}
                  alt=""
                  className="w-24 h-24 rounded-full border-2 border-red-800/20 bg-white"
                />
                
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{profileData.profile.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase tracking-wide">
                    {profileData.profile.role}
                  </span>
                </div>

                <div className="w-full text-xs space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                  <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-350">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{profileData.profile.email}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-350">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{profileData.profile.department} Department</span>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-350">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Registered: {new Date(profileData.profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Progress Chart Gauge */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Completion Performance</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-550 dark:text-slate-450 font-semibold">Average Task Success:</span>
                  <span className="text-lg font-black text-red-800 dark:text-red-400 flex items-center">
                    <Percent className="w-4 h-4 mr-0.5" />
                    {profileData.stats.completionPercentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                  <div
                    className="bg-red-800 h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileData.stats.completionPercentage}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Right Card: Statistics Counts & Activity Timeline */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Task statistics */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 rounded-lg">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Tasks</p>
                    <p className="text-base font-black">{profileData.stats.totalTasks}</p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-lg">
                    <CheckCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Closed (Approved)</p>
                    <p className="text-base font-black">{profileData.stats.completedTasks}</p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 rounded-lg">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Pending Scope</p>
                    <p className="text-base font-black">{profileData.stats.pendingTasks}</p>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 rounded-lg">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Overdue Tasks</p>
                    <p className="text-base font-black text-rose-600 dark:text-rose-450">{profileData.stats.overdueTasks}</p>
                  </div>
                </div>

              </div>

              {/* Recent Account Action Logs */}
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center">
                  <History className="w-4.5 h-4.5 text-red-500 mr-2" />
                  <span>Recent Account Activity</span>
                </h3>

                {profileData.activity.length === 0 ? (
                  <div className="text-center py-6 text-slate-450 dark:text-slate-500 text-xs italic">
                    No recent activity logs recorded.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 dark:border-slate-800/80 pl-4 ml-1.5 space-y-4">
                    {profileData.activity.map((act: any) => (
                      <div key={act._id} className="relative text-xs">
                        {/* Dot highlight */}
                        <div className="w-2.5 h-2.5 bg-red-800 rounded-full absolute top-1 left-[-20.5px] border-2 border-white dark:border-slate-900" />
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-800 dark:text-red-400 uppercase tracking-wide text-[10px]">
                            {act.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">
                          {act.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center text-slate-400 py-10">Failed to load profile.</div>
        )}

      </div>
    </Layout>
  );
};
