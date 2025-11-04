/**
 * Custom Toast Utility with Gradient Styling
 */

import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
      },
    });
  },
  
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(245, 87, 108, 0.3)',
      },
    });
  },
  
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
      },
    });
  },
  
  warning: (message: string) => {
    sonnerToast.warning(message, {
      duration: 4500,
      style: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(250, 112, 154, 0.3)',
      },
    });
  },
};
