import * as React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

/**
 * Custom NumberField component with increment/decrement buttons
 * Properly handles step values from dataset configuration
 */
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  size = 'medium',
  error = false,
  helperText,
  disabled = false,
  inputRef,
}) {
  const handleIncrement = () => {
    const currentValue = value ?? min ?? 0;
    const newValue = Math.min(currentValue + step, max ?? Infinity);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = value ?? min ?? 0;
    const newValue = Math.max(currentValue - step, min ?? -Infinity);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange(null);
    } else {
      const numVal = Number(val);
      // Round to nearest step
      const rounded = Math.round(numVal / step) * step;
      // Clamp to min/max
      const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, rounded));
      onChange(clamped);
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleIncrement();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleDecrement();
        break;
      default:
        break;
    }
  };

  return (
    <FormControl fullWidth size={size} error={error} disabled={disabled}>
      {label && <InputLabel>{label}</InputLabel>}
      <OutlinedInput
        ref={inputRef}
        type="number"
        value={value ?? ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        inputProps={{
          min,
          max,
          step,
        }}
        startAdornment={
          <InputAdornment position="start">
            <Button
              size="small"
              onClick={handleDecrement}
              disabled={disabled || (min !== undefined && value <= min)}
              sx={{ minWidth: 32, p: 0.5 }}
            >
              <RemoveIcon fontSize="small" />
            </Button>
          </InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end">
            <Button
              size="small"
              onClick={handleIncrement}
              disabled={disabled || (max !== undefined && value >= max)}
              sx={{ minWidth: 32, p: 0.5 }}
            >
              <AddIcon fontSize="small" />
            </Button>
          </InputAdornment>
        }
        label={label}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

export default NumberField;
