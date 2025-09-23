// components/ui/Input.tsx
'use client'
import React, { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outlined'
  inputSize?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className = '',
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    inputSize = 'md',
    fullWidth = true,
    type = 'text',
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const baseClasses = 'form-input'
    
    const variantClasses = {
      default: '',
      filled: 'bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-800',
      outlined: 'border-2',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    }

    const stateClasses = {
      error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
      default: '',
    }

    const currentState = error ? 'error' : success ? 'success' : 'default'

    const inputClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[inputSize],
      stateClasses[currentState],
      leftIcon && 'pl-10',
      (rightIcon || isPassword) && 'pr-10',
      fullWidth && 'w-full',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="form-label">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={inputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {(rightIcon || isPassword) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {isPassword ? (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="mt-1 flex items-center">
            {error && (
              <>
                <AlertCircle className="w-4 h-4 text-error-500 mr-1" />
                <span className="form-error">{error}</span>
              </>
            )}
            {success && (
              <>
                <CheckCircle className="w-4 h-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 dark:text-success-400">{success}</span>
              </>
            )}
            {helperText && !error && !success && (
              <span className="form-help">{helperText}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input