import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a relative time string (e.g. "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const pastDate = new Date(date);
  
  // Time difference in seconds
  const secondsPast = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (secondsPast < 60) {
    return 'indi';
  }
  
  if (secondsPast < 3600) {
    const minutes = Math.floor(secondsPast / 60);
    return `${minutes} ${minutes === 1 ? 'dəqiqə' : 'dəqiqə'} əvvəl`;
  }
  
  if (secondsPast < 86400) {
    const hours = Math.floor(secondsPast / 3600);
    return `${hours} ${hours === 1 ? 'saat' : 'saat'} əvvəl`;
  }
  
  if (secondsPast < 2592000) {
    const days = Math.floor(secondsPast / 86400);
    return `${days} ${days === 1 ? 'gün' : 'gün'} əvvəl`;
  }
  
  if (secondsPast < 31536000) {
    const months = Math.floor(secondsPast / 2592000);
    return `${months} ${months === 1 ? 'ay' : 'ay'} əvvəl`;
  }
  
  const years = Math.floor(secondsPast / 31536000);
  return `${years} ${years === 1 ? 'il' : 'il'} əvvəl`;
}

/**
 * Format a date to a locale string
 */
export function formatDate(date: Date | string, locale = 'az-AZ'): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
}
