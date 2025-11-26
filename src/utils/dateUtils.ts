// Date utility functions for consistent formatting across the application

export const formatDate = (dateString: string | Date, options?: {
  includeTime?: boolean;
  includeSeconds?: boolean;
  format?: 'short' | 'medium' | 'long';
}) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const {
      includeTime = false,
      includeSeconds = false,
      format = 'short'
    } = options || {};

    const formatOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'Asia/Kolkata' // Indian timezone
    };

    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.hour12 = true;
    }

    if (includeSeconds) {
      formatOptions.second = '2-digit';
    }

    if (format === 'medium') {
      formatOptions.month = 'short';
    } else if (format === 'long') {
      formatOptions.month = 'long';
    }

    return date.toLocaleDateString('en-IN', formatOptions);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'N/A';
  }
};

export const formatDateTime = (dateString: string | Date) => {
  if (!dateString) return 'N/A';
  
  try {
    return formatDate(dateString, { 
      includeTime: true, 
      includeSeconds: true 
    });
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return 'N/A';
  }
};

export const formatTimeAgo = (dateString: string | Date) => {
  if (!dateString) return 'N/A';
  
  try {
    const now = new Date();
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'N/A';
    
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch (error) {
    console.warn('TimeAgo formatting error:', error);
    return 'N/A';
  }
};

export const formatCurrency = (amount: number) => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting error:', error);
    return '₹0.00';
  }
};
