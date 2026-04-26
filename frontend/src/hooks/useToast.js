import { useState, useCallback } from 'react';

/**
 * Custom hook for showing toast notifications using Material UI Snackbar
 * @returns {Object} - Toast methods and toast state
 */
export function useToast() {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
  });

  const showToast = useCallback((message, severity = 'info') => {
    setToast({
      open: true,
      message,
      severity,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const success = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  const error = useCallback((message) => {
    showToast(message, 'error');
  }, [showToast]);

  const warning = useCallback((message) => {
    showToast(message, 'warning');
  }, [showToast]);

  const info = useCallback((message) => {
    showToast(message, 'info');
  }, [showToast]);

  return {
    success,
    error,
    warning,
    info,
    toastOpen: toast.open,
    toastMessage: toast.message,
    toastSeverity: toast.severity,
    hideToast,
  };
}

export default useToast;
