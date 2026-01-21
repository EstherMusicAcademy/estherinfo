"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, useState } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, error, helperText, icon, className = "", ...props }: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full rounded-lg border bg-surface px-3 py-2 text-sm
            transition-all duration-200
            ${icon ? "pl-10" : ""}
            ${error
              ? "border-red-500 focus:ring-2 focus:ring-red-500"
              : isFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-border focus:border-primary"
            }
            ${props.disabled ? "cursor-not-allowed opacity-50" : ""}
            ${className}
          `}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 animate-slideIn flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function FormTextarea({ label, error, helperText, className = "", ...props }: FormTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={`
          w-full rounded-lg border bg-surface px-3 py-2 text-sm
          transition-all duration-200 resize-none
          ${error
            ? "border-red-500 focus:ring-2 focus:ring-red-500"
            : isFocused
            ? "border-primary ring-2 ring-primary/20"
            : "border-border focus:border-primary"
          }
          ${props.disabled ? "cursor-not-allowed opacity-50" : ""}
          ${className}
        `}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 animate-slideIn flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, error, helperText, options, className = "", ...props }: FormSelectProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        {...(props as any)}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e as any);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e as any);
        }}
        className={`
          w-full rounded-lg border bg-surface px-3 py-2 text-sm
          transition-all duration-200
          ${error
            ? "border-red-500 focus:ring-2 focus:ring-red-500"
            : isFocused
            ? "border-primary ring-2 ring-primary/20"
            : "border-border focus:border-primary"
          }
          ${props.disabled ? "cursor-not-allowed opacity-50" : ""}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 animate-slideIn flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}
