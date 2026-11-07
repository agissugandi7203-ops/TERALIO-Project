import React from 'react';

export function InputGroup({
  id,
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  required = false,
  rightSlot,
  helperText,
  autoComplete,
}) {
  return (
    <div className="auth-input-group">
      <label className="auth-input-label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          className={`auth-input-control ${rightSlot ? 'auth-input-control--with-icon' : ''}`}
        />
        {rightSlot && <div className="auth-input-slot">{rightSlot}</div>}
      </div>
      {helperText && <p className="auth-input-helper">{helperText}</p>}
    </div>
  );
}

export default InputGroup;
