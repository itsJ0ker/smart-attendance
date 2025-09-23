// app/auth/login/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  QrCode, 
  Shield, 
  Users, 
  GraduationCap,
  Building,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { Card, CardBody } from '../../../components/ui/Card'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import { SecurityService } from '../../../lib/security'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

const demoAccounts = [
  {
    email: 'admin@college.edu',
    password: 'admin',
    role: 'admin',
    name: 'Michael Chen',
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-red-500',
    description: 'Full system access & analytics'
  },
  {
    email: 'teacher@college.edu',
    password: 'teacher',
    role: 'teacher',
    name: 'Prof. David Wilson',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Generate QR codes & manage classes'
  },
  {
    email: 'student@college.edu',
    password: 'student',
    role: 'student',
    name: 'Alex Johnson',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'bg-green-500',
    description: 'Scan QR codes & view attendance'
  },
]

const features = [
  {
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Code Technology',
    description: 'Secure, fast, and contactless attendance marking'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Advanced Security',
    description: 'Anti-fraud protection with location verification'
  },
  {
    icon: <Building className="w-6 h-6" />,
    title: 'Enterprise Ready',
    description: 'Scalable solution for institutions of any size'
  },
]

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user) {
      // Redirect based on role
      switch (user.role) {
        case 'admin':
        case 'super_admin':
          router.push('/admin/dashboard')
          break
        case 'teacher':
          router.push('/teacher/dashboard')
          break
        case 'student':
          router.push('/student/dashboard')
          break
        default:
          router.push('/dashboard')
      }
    }
  }, [user, router])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    
    try {
      // Rate limiting check
      if (!SecurityService.checkRateLimit('login', 5, 15 * 60 * 1000)) {
        toast.error('Too many login attempts. Please try again in 15 minutes.')
        return
      }

      await login(data.email, data.password)
      toast.success('Login successful!')
      
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setSelectedDemo(account.email)
    setValue('email', account.email)
    setValue('password', account.password)
    
    try {
      await login(account.email, account.password)
      toast.success(`Logged in as ${account.name}`)
    } catch (error: any) {
      toast.error(error.message || 'Demo login failed')
    } finally {
      setSelectedDemo(null)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Checking authentication..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 border border-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">QR Attendance</h1>
                <p className="text-primary-200">Enterprise Edition</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Modern Attendance
              <br />
              <span className="text-primary-200">Management System</span>
            </h2>

            <p className="text-xl text-primary-100 mb-12 leading-relaxed">
              Streamline your institution's attendance tracking with cutting-edge QR technology, 
              advanced security features, and comprehensive analytics.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                    <p className="text-primary-200">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                QR Attendance
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>

          <Card className="shadow-2xl border-0">
            <CardBody className="p-8">
              <div className="hidden lg:block text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Demo Accounts */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Quick Demo Access
                </h3>
                <div className="grid gap-3">
                  {demoAccounts.map((account) => (
                    <motion.button
                      key={account.email}
                      onClick={() => handleDemoLogin(account)}
                      disabled={isLoading || selectedDemo === account.email}
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-10 h-10 ${account.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                        {selectedDemo === account.email ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          account.icon
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {account.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or sign in with credentials
                  </span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    leftIcon={<Lock className="w-5 h-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                    error={errors.password?.message}
                    {...register('password')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      {...register('rememberMe')}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  gradient
                  glow
                >
                  Sign In
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200">
                      Secure Login
                    </h4>
                    <p className="text-xs text-primary-600 dark:text-primary-300 mt-1">
                      Your session is protected with advanced security features including device fingerprinting and location verification.
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact{' '}
              <a href="mailto:support@college.edu" className="text-primary-600 hover:text-primary-500">
                support@college.edu
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}