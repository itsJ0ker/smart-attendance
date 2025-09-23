// components/ui/Card.tsx
'use client'
import React from 'react'
import { motion } from 'framer-motion'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow'
  hover?: boolean
  animated?: boolean
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className = '',
    variant = 'default',
    padding = 'md',
    shadow = 'sm',
    hover = false,
    animated = true,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'card'
    
    const variantClasses = {
      default: '',
      glass: 'glass',
      gradient: 'gradient-primary text-white',
      bordered: 'border-2',
    }

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    }

    const shadowClasses = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      glow: 'shadow-glow',
    }

    const classes = [
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      shadowClasses[shadow],
      hover && 'hover:shadow-lg transition-shadow duration-200',
      className,
    ].filter(Boolean).join(' ')

    const CardComponent = (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )

    if (animated) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {CardComponent}
        </motion.div>
      )
    }

    return CardComponent
  }
)

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', border = true, children, ...props }, ref) => {
    const classes = [
      'card-header',
      !border && 'border-b-0',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['card-body', className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', border = true, children, ...props }, ref) => {
    const classes = [
      'card-footer',
      !border && 'border-t-0',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardBody.displayName = 'CardBody'
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardBody, CardFooter }