// hooks/useAuth.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { AuthService } from '../lib/auth'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkSession()
  }, [])

  const checkSession = async () => {
    console.log('checkSession called')
    try {
      // Only access localStorage on the client side
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        console.log('Found token:', token)
        if (token) {
          // In a real app, you'd verify the token with your backend
          console.log('Getting profile for token:', token)
          const userData = await AuthService.getProfile(token)
          console.log('Profile data:', userData)
          setUser(userData)
        } else {
          console.log('No token found')
        }
      } else {
        console.log('Window not defined, skipping localStorage check')
      }
    } catch (error) {
      console.error('Session check failed:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const userData = await AuthService.login(email, password)
      setUser(userData)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', userData.id)
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, login: async () => {}, logout: async () => {}, loading: true }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}