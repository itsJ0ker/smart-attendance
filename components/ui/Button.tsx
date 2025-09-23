// components/ui/Button.tsx
'use client'
import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode // Alias for leftIcon
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  gradient?: boolean
  glow?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className = '',
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    leftIcon,
    rightIcon,
    fullWidth = false,
    gradient = false,
    glow = false,
    children,
    disabled,
    ...props
  }, ref) => {
    // Use icon as leftIcon if leftIcon is not provided
    const finalLeftIcon = leftIcon || icon
    const baseClasses = 'btn'
    
    const variantClasses = {
      primary: gradient ? 'gradient-primary text-white' : 'btn-primary',
      secondary: 'btn-secondary',
      success: gradient ? 'gradient-success text-white' : 'btn-success',
      warning: gradient ? 'gradient-warning text-white' : 'btn-warning',
      error: gradient ? 'gradient-error text-white' : 'btn-error',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
    }

    const sizeClasses = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
      xl: 'btn-xl',
    }

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      glow && 'shadow-glow',
      loading && 'cursor-not-allowed',
      className,
    ].filter(Boolean).join(' ')

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {!loading && finalLeftIcon && (
          <span className="mr-2">{finalLeftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button