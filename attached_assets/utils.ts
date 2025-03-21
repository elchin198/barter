import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A simple Azerbaijani date-fns locale (not complete)
export const azLocale = {
  code: 'az',
  formatDistance: (token: string, count: number, options?: any) => {
    let result = '';
    
    const tokenMapping: {[key: string]: string} = {
      xSeconds: `${count} saniyə`,
      xMinutes: `${count} dəqiqə`,
      xHours: `${count} saat`,
      xDays: `${count} gün`,
      xMonths: `${count} ay`,
      xYears: `${count} il`,
    };
    
    if (token in tokenMapping) {
      result = tokenMapping[token];
    } else {
      // Default for other tokens
      result = `${count} ${token}`;
    }
    
    if (options?.addSuffix) {
      result = `${result} əvvəl`;
    }
    
    return result;
  },
  // Add other locale functions as needed
}