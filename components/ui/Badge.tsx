// components/ui/Badge.tsx
'use client'
import React from 'react'
import { motion } from 'framer-motion'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  pulse?: boolean
  removable?: boolean
  onRemove?: () => void
  icon?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className = '',
    variant = 'primary',
    size = 'md',
    dot = false,
    pulse = false,
    removable = false,
    onRemove,
    icon,
    leftIcon,
    rightIcon,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'badge'
    
    const variantClasses = {
      primary: 'badge-primary',
      secondary: 'badge-gray',
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
      gray: 'badge-gray',
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    }

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      pulse && 'animate-pulse',
      className,
    ].filter(Boolean).join(' ')

    if (dot) {
      return (
        <span
          ref={ref}
          className={`inline-block w-2 h-2 rounded-full ${variantClasses[variant].replace('badge-', 'bg-').replace('100', '500')} ${pulse ? 'animate-pulse' : ''} ${className}`}
          {...props}
        />
      )
    }

    // Support icon as alias for leftIcon for better DX
    const displayLeftIcon = icon || leftIcon

    return (
      <motion.span
        ref={ref}
        className={classes}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...props}
      >
        <span className="flex items-center gap-1">
          {displayLeftIcon && (
            <span className="inline-flex items-center">
              {displayLeftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </span>
        {removable && onRemove && (
          <button
            type="button"
            className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs rounded-full hover:bg-black/10 focus:outline-none"
            onClick={onRemove}
          >
            ×
          </button>
        )}
      </motion.span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge