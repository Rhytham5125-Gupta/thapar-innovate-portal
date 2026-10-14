import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string | Date;
  status: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline, status }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);
  const [isUrgent, setIsUrgent] = useState<boolean>(false); // Urgent if less than 24 hours left

  useEffect(() => {
    // If task is already closed (approved)
    if (status === 'approved') {
      setTimeLeft('Task Completed');
      setIsOverdue(false);
      setIsUrgent(false);
      return;
    }

    const calculateTime = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft('Overdue');
        setIsOverdue(true);
        setIsUrgent(false);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);

      setIsOverdue(false);
      setIsUrgent(difference < 24 * 60 * 60 * 1000);

      let timeString = '';
      if (difference >= 24 * 60 * 60 * 1000) {
        // Greater than 24 hours: show only days and hours
        timeString = `${days}d ${hours}h`;
      } else {
        // Less than 24 hours: show only hours and minutes
        timeString = `${hours}h ${minutes}m`;
      }

      setTimeLeft(timeString);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 5000);

    return () => clearInterval(interval);
  }, [deadline, status]);

  if (status === 'approved') {
    return (
      <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Clock className="w-3.5 h-3.5 mr-1" />
        Closed
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-md">
        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
        Overdue
      </span>
    );
  }

  return (
    <span
      className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${
        isUrgent
          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 animate-pulse'
          : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
      }`}
    >
      <Clock className="w-3.5 h-3.5 mr-1" />
      {timeLeft}
    </span>
  );
};
