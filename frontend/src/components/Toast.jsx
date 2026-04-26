import { Snackbar, Alert } from '@mui/material';

/**
 * Toast notification component that displays messages using Material UI Snackbar
 * @param {Object} props
 * @param {boolean} props.open - Whether the toast is visible
 * @param {string} props.message - The message to display
 * @param {string} props.severity - The severity level ('success', 'error', 'warning', 'info')
 * @param {Function} props.onClose - Callback when toast is closed
 */
function Toast({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

export default Toast;
