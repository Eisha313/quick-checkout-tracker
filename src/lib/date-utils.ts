/**
 * Date utility functions for the checkout tracker
 */

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  
  // Handle future dates
  if (diffInMs < 0) {
    return 'in the future';
  }
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  } else {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
}

export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const end = getEndOfDay(new Date());
  let start: Date;

  switch (period) {
    case 'today':
      start = getStartOfDay(new Date());
      break;
    case 'week':
      start = getStartOfDay(new Date());
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start = getStartOfDay(new Date());
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start = getStartOfDay(new Date());
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start = getStartOfDay(new Date());
      start.setDate(start.getDate() - 7);
  }

  return { start, end };
}

export function isWithinHours(date: Date | string, hours: number): boolean {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return false;
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  return diffInHours >= 0 && diffInHours <= hours;
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return 0;
  }
  
  const diffInMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

export function parseDate(dateString: string): Date | null {
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
