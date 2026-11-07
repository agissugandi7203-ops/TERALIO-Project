import React, { useId } from 'react';

/**
 * InputGroup
 * Takes label, placeholder, and type.
 * - The label is `text-sm font-medium text-white`.
 * - The input is `bg-brand-gray border-none rounded-xl h-11 px-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20`.
 */
export function InputGroup({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  name,
  rightElement,
  labelRight,
  helperText,
  autoComplete,
  required = false,
  disabled = false,
  isNight = true,
}) {
  const generatedId = useId();
  const inputId = name ? `auth-input-${name}` : generatedId;

  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium ${isNight ? 'text-white' : 'text-[#14202f]'}`}
        >
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className={`w-full border-none rounded-xl h-11 px-4 outline-none transition-all ${
            isNight
              ? 'bg-brand-gray bg-[#1A1A1A] text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/20'
              : 'bg-white border border-[#14202f]/16 text-[#14202f] placeholder:text-[#667587]/40 focus:ring-2 focus:ring-[#14202f]/20 shadow-sm'
          } ${rightElement ? 'pr-11' : ''}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
            {rightElement}
          </div>
        )}
      </div>
      {helperText && (
        <p className={`text-xs ${isNight ? 'text-white/40' : 'text-[#667587]'}`}>{helperText}</p>
      )}
    </div>
  );
}

export default InputGroup;
