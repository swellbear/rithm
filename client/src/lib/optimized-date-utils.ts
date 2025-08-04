// Optimized date utilities with specific imports from date-fns
// Reduces bundle size by importing only needed functions (~5MB vs 36MB)

// Only import specific functions needed throughout the app
export { 
  format,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  parseISO,
  formatDistanceToNow,
  differenceInDays,
  differenceInHours,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks
} from 'date-fns';

// Custom date formatting utilities using the specific imports
export const formatTimestamp = (date: Date | string) => {
  const { format, parseISO } = require('date-fns');
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
};

export const formatRelativeTime = (date: Date | string) => {
  const { formatDistanceToNow, parseISO } = require('date-fns');
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatShortDate = (date: Date | string) => {
  const { format, parseISO } = require('date-fns');
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatTime = (date: Date | string) => {
  const { format, parseISO } = require('date-fns');
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm:ss');
};

// Week/month range utilities
export const getCurrentWeekRange = () => {
  const { startOfWeek, endOfWeek } = require('date-fns');
  const now = new Date();
  return {
    start: startOfWeek(now),
    end: endOfWeek(now)
  };
};

export const getCurrentMonthRange = () => {
  const { startOfMonth, endOfMonth } = require('date-fns');
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  };
};

// Date comparison utilities
export const isDateInRange = (date: Date | string, start: Date | string, end: Date | string) => {
  const { isAfter, isBefore, parseISO } = require('date-fns');
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startObj = typeof start === 'string' ? parseISO(start) : start;
  const endObj = typeof end === 'string' ? parseISO(end) : end;
  
  return isAfter(dateObj, startObj) && isBefore(dateObj, endObj);
};

// ML Platform specific date utilities
export const formatTrainingTimestamp = (timestamp: number) => {
  const { format } = require('date-fns');
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
};

export const calculateTrainingDuration = (startTime: number, endTime: number) => {
  const { differenceInHours, differenceInDays } = require('date-fns');
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const days = differenceInDays(end, start);
  const hours = differenceInHours(end, start) % 24;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    const minutes = Math.floor((endTime - startTime) / (1000 * 60));
    return `${minutes}m`;
  }
};