// components/ui/Alert.tsx
'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
  actions?: React.ReactNode
}

const Alert: React.FC<AlertProps> = ({
  className = '',
  variant = 'info',
  title,
  description,
  dismissible = false,
  onDismiss,
  icon,
  actions,
  children,
  ...props
}) => {
  const variantClasses = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
    info: 'alert-info',
  }

  const defaultIcons = {
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const classes = [
    'alert',
    variantClasses[variant],
    className,
  ].filter(Boolean).join(' ')

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      <div className="flex">
        {/* Icon */}
        <div className="flex-shrink-0">
          {icon || defaultIcons[variant]}
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">
              {title}
            </h3>
          )}
          {description && (
            <div className={`text-sm ${title ? 'mt-1' : ''}`}>
              {description}
            </div>
          )}
          {children && (
            <div className={`text-sm ${title || description ? 'mt-2' : ''}`}>
              {children}
            </div>
          )}
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Alert