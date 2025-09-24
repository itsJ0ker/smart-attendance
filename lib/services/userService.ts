// lib/services/userService.ts
import { supabase } from '../supabase'
import { Database } from '../supabase'
import bcrypt from 'bcryptjs'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type Student = Database['public']['Tables']['students']['Row']
type Teacher = Database['public']['Tables']['teachers']['Row']

export interface UserWithProfile {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'teacher' | 'student'
  avatar_url?: string
  phone?: string
  status: 'active' | 'inactive' | 'suspended'
  last_login?: string
  email_verified: boolean
  two_factor_enabled: boolean
  created_at: string
  profile?: StudentProfile | TeacherProfile
}

export interface StudentProfile {
  student_id: string
  department: {
    id: string
    name: string
    code: string
  }
  year: number
  semester: number
  gpa?: number
  enrollment_date: string
}

export interface TeacherProfile {
  employee_id: string
  department: {
    id: string
    name: string
    code: string
  }
  specialization?: string
  hire_date: string
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'admin' | 'teacher' | 'student'
  phone?: string
  avatar_url?: string
  // Student specific
  student_id?: string
  department_id?: string
  year?: number
  semester?: number
  // Teacher specific
  employee_id?: string
  specialization?: string
}

class UserService {
  // Create new user
  async createUser(userData: CreateUserData) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12)

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          avatar_url: userData.avatar_url,
          status: 'active',
          email_verified: false,
          two_factor_enabled: false
        })
        .select()
        .single()

      if (userError) {
        throw userError
      }

      // Create profile based on role
      if (userData.role === 'student' && userData.student_id && userData.department_id) {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: user.id,
            student_id: userData.student_id,
            department_id: userData.department_id,
            year: userData.year || 1,
            semester: userData.semester || 1
          })

        if (studentError) {
          // Rollback user creation
          await supabase.from('users').delete().eq('id', user.id)
          throw studentError
        }
      } else if (userData.role === 'teacher' && userData.employee_id && userData.department_id) {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            user_id: user.id,
            employee_id: userData.employee_id,
            department_id: userData.department_id,
            specialization: userData.specialization
          })

        if (teacherError) {
          // Rollback user creation
          await supabase.from('users').delete().eq('id', user.id)
          throw teacherError
        }
      }

      return { success: true, data: user }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: 'Failed to create user' }
    }
  }

  // Get user with profile
  async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return null
      }

      let profile: StudentProfile | TeacherProfile | undefined

      if (user.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select(`
            student_id,
            year,
            semester,
            gpa,
            enrollment_date,
            departments!inner(
              id,
              name,
              code
            )
          `)
          .eq('user_id', userId)
          .single()

        if (studentData) {
          profile = {
            student_id: studentData.student_id,
            department: {
              id: studentData.departments.id,
              name: studentData.departments.name,
              code: studentData.departments.code
            },
            year: studentData.year,
            semester: studentData.semester,
            gpa: studentData.gpa,
            enrollment_date: studentData.enrollment_date
          }
        }
      } else if (user.role === 'teacher') {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select(`
            employee_id,
            specialization,
            hire_date,
            departments!inner(
              id,
              name,
              code
            )
          `)
          .eq('user_id', userId)
          .single()

        if (teacherData) {
          profile = {
            employee_id: teacherData.employee_id,
            department: {
              id: teacherData.departments.id,
              name: teacherData.departments.name,
              code: teacherData.departments.code
            },
            specialization: teacherData.specialization,
            hire_date: teacherData.hire_date
          }
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
        phone: user.phone,
        status: user.status,
        last_login: user.last_login,
        email_verified: user.email_verified,
        two_factor_enabled: user.two_factor_enabled,
        created_at: user.created_at,
        profile
      }
    } catch (error) {
      console.error('Error getting user with profile:', error)
      return null
    }
  }

  // Get all users with pagination
  async getUsers(
    page: number = 1,
    limit: number = 20,
    role?: 'admin' | 'teacher' | 'student',
    search?: string,
    status?: 'active' | 'inactive' | 'suspended'
  ) {
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })

      if (role) {
        query = query.eq('role', role)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data: users, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        throw error
      }

      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    } catch (error) {
      console.error('Error getting users:', error)
      return { success: false, error: 'Failed to fetch users' }
    }
  }

  // Update user
  async updateUser(userId: string, updates: Partial<UserWithProfile>) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          avatar_url: updates.avatar_url,
          status: updates.status,
          email_verified: updates.email_verified,
          two_factor_enabled: updates.two_factor_enabled
        })
        .eq('id', userId)
        .select()
        .single()

      if (userError) {
        throw userError
      }

      // Update profile if provided
      if (updates.profile && user.role === 'student') {
        const studentProfile = updates.profile as StudentProfile
        await supabase
          .from('students')
          .update({
            year: studentProfile.year,
            semester: studentProfile.semester,
            gpa: studentProfile.gpa
          })
          .eq('user_id', userId)
      } else if (updates.profile && user.role === 'teacher') {
        const teacherProfile = updates.profile as TeacherProfile
        await supabase
          .from('teachers')
          .update({
            specialization: teacherProfile.specialization
          })
          .eq('user_id', userId)
      }

      return { success: true, data: user }
    } catch (error) {
      console.error('Error updating user:', error)
      return { success: false, error: 'Failed to update user' }
    }
  }

  // Delete user
  async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Failed to delete user' }
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get current user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12)

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error('Error changing password:', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const [
        { count: totalUsers },
        { count: totalStudents },
        { count: totalTeachers },
        { count: totalAdmins },
        { count: activeUsers },
        { count: inactiveUsers }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['admin', 'super_admin']),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'inactive')
      ])

      return {
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          totalStudents: totalStudents || 0,
          totalTeachers: totalTeachers || 0,
          totalAdmins: totalAdmins || 0,
          activeUsers: activeUsers || 0,
          inactiveUsers: inactiveUsers || 0
        }
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return { success: false, error: 'Failed to fetch statistics' }
    }
  }

  // Update last login
  async updateLastLogin(userId: string) {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  // Search users
  async searchUsers(query: string, role?: string, limit: number = 10) {
    try {
      let searchQuery = supabase
        .from('users')
        .select('id, name, email, role, avatar_url, status')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit)

      if (role) {
        searchQuery = searchQuery.eq('role', role)
      }

      const { data, error } = await searchQuery

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error searching users:', error)
      return { success: false, error: 'Search failed' }
    }
  }

  // Bulk update user status
  async bulkUpdateStatus(userIds: string[], status: 'active' | 'inactive' | 'suspended') {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .in('id', userIds)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error bulk updating status:', error)
      return { success: false, error: 'Failed to update users' }
    }
  }
}

export default new UserService()