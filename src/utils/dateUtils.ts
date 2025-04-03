/**
 * Formats a date string or Date object into a user-friendly format
 * @param dateString - Date string or Date object to format
 * @returns Formatted date string (e.g. "January 1, 2023")
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}; 