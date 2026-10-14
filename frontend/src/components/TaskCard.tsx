import React from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from './CountdownTimer';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: any; // Using populated type from endpoint
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'work-submitted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'under-review':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'changes-requested':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

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

  const formattedDeadline = new Date(task.deadline).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="glass-card hover:border-red-800/30 dark:hover:border-red-800/20 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none border border-slate-200 dark:border-slate-800/60 relative overflow-hidden group">
      
      {/* Priority & Countdown Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
            {task.department}
          </span>
        </div>
        <CountdownTimer deadline={task.deadline} status={task.status} />
      </div>

      {/* Task Content */}
      <div className="flex-1 mb-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-1">
          {task.title}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Footer Info: User Assignment & Action Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center space-x-2.5">
          {task.assignedTo ? (
            <>
              <img
                src={task.assignedTo.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(task.assignedTo.name)}`}
                alt="Assignee Avatar"
                className="w-7.5 h-7.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                  {task.assignedTo.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize leading-none">
                  {task.assignedTo.role}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-1.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Open Task</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider ${getStatusStyle(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>

          <Link
            to={`/tasks/${task._id}`}
            className="p-1.5 bg-slate-100 hover:bg-red-800 text-slate-500 hover:text-white dark:bg-slate-800 dark:hover:bg-red-800 dark:text-slate-400 rounded-lg transition-all duration-200"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
};
