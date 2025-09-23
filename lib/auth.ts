// lib/auth.ts
import { User } from '../types'
import { supabase, supabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'

export class AuthService {
  static async login(email: string, password: string): Promise<User> {
    console.log('AuthService.login called with:', email)
    
    try {
      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single()

      if (userError || !userData) {
        throw new Error('Invalid email or password')
      }

      // Verify password (in production, you'd use proper password hashing)
      // For now, we'll use a simple comparison
      const isValidPassword = await bcrypt.compare(password, userData.password_hash || password)
      
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Update last login
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id)

      // Convert database user to application user format
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar_url,
        phone: userData.phone,
        isActive: userData.status === 'active',
        isVerified: userData.email_verified,
        twoFactorEnabled: userData.two_factor_enabled,
        lastLogin: new Date(userData.last_login || userData.created_at),
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
        permissions: [], // You might want to fetch this from a separate table
        departmentId: '' // You might want to fetch this from student/teacher tables
      }

      console.log('Login successful for:', user.email)
      return user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  static async getProfile(userId: string): Promise<User> {
    console.log('AuthService.getProfile called with userId:', userId)
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('status', 'active')
        .single()

      if (error || !userData) {
        throw new Error('User not found')
      }

      // Convert database user to application user format
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar_url,
        phone: userData.phone,
        isActive: userData.status === 'active',
        isVerified: userData.email_verified,
        twoFactorEnabled: userData.two_factor_enabled,
        lastLogin: new Date(userData.last_login || userData.created_at),
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
        permissions: [], // You might want to fetch this from a separate table
        departmentId: '' // You might want to fetch this from student/teacher tables
      }

      return user
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  }

  static async register(userData: Partial<User>): Promise<User> {
    console.log('AuthService.register called with:', userData.email)
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email!)
        .single()

      if (existingUser) {
        throw new Error('User already exists')
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password!, 12)

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: userData.email!,
          password_hash: passwordHash,
          name: userData.name!,
          role: userData.role || 'student',
          avatar_url: userData.avatar,
          phone: userData.phone,
          status: 'active',
          email_verified: false,
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newUser) {
        throw new Error('Failed to create user')
      }

      // Convert to application user format
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar_url,
        phone: newUser.phone,
        isActive: newUser.status === 'active',
        isVerified: newUser.email_verified,
        twoFactorEnabled: newUser.two_factor_enabled,
        lastLogin: new Date(newUser.created_at),
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at),
        permissions: userData.permissions || [],
        departmentId: userData.departmentId || ''
      }

      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  static async logout(): Promise<void> {
    console.log('AuthService.logout called')
    // In a real app, you might want to invalidate tokens or update last activity
    return Promise.resolve()
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    console.log('AuthService.changePassword called for user:', userId)
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      // Verify old password
      const isValidPassword = await bcrypt.compare(oldPassword, userData.password_hash)
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12)

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw new Error('Failed to update password')
      }
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  static async resetPassword(email: string): Promise<void> {
    console.log('AuthService.resetPassword called for email:', email)
    
    try {
      // Check if user exists
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', email)
        .single()

      if (error || !userData) {
        throw new Error('User not found')
      }

      // In a real app, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with the reset link
      
      console.log('Password reset would be initiated for:', email)
      // For now, just simulate success
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  static async verifyEmail(userId: string, token: string): Promise<void> {
    console.log('AuthService.verifyEmail called for user:', userId)
    
    try {
      // In a real app, you would verify the token against stored verification tokens
      // For now, we'll just mark the user as verified
      
      const { error } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error('Failed to verify email')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  static async enable2FA(userId: string): Promise<string> {
    console.log('AuthService.enable2FA called for user:', userId)
    
    try {
      // Get user email for 2FA setup
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      // Enable 2FA
      const { error } = await supabase
        .from('users')
        .update({ 
          two_factor_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error('Failed to enable 2FA')
      }

      // Return mock QR code data for 2FA setup
      // In a real app, you would generate a proper TOTP secret
      return `otpauth://totp/QRAttendance:${userData.email}?secret=DEMO2FASECRET&issuer=QRAttendance`
    } catch (error) {
      console.error('Enable 2FA error:', error)
      throw error
    }
  }

  static async disable2FA(userId: string, code: string): Promise<void> {
    console.log('AuthService.disable2FA called for user:', userId)
    
    try {
      // In a real app, you would verify the 2FA code
      // For now, we'll just disable 2FA
      
      const { error } = await supabase
        .from('users')
        .update({ 
          two_factor_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error('Failed to disable 2FA')
      }
    } catch (error) {
      console.error('Disable 2FA error:', error)
      throw error
    }
  }
}