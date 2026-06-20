import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  id: string; // Required for Guideline matching
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-stone-700 tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-3 bg-white border-2 rounded-2xl outline-none transition-all duration-155 text-stone-900 placeholder:text-stone-400 focus:border-brand-500 font-medium ${
          error ? 'border-red-400 focus:border-red-500 bg-red-50/10' : 'border-stone-200 focus:border-brand-500'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs font-semibold text-red-600 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-stone-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id: string; // Required
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-stone-700 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full px-4 py-3 bg-white border-2 rounded-2xl outline-none transition-all duration-155 text-stone-900 placeholder:text-stone-400 min-h-[100px] font-medium resize-y focus:border-brand-500 ${
          error ? 'border-red-400 focus:border-red-500 bg-red-50/10' : 'border-stone-200 focus:border-brand-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-red-600 mt-0.5">{error}</p>}
    </div>
  );
};
