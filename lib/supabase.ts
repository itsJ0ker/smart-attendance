// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin client for server-side operations with elevated privileges
// Important: only initialize on the server to avoid leaking service key to the client bundle
export const supabaseAdmin = (typeof window === 'undefined' && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : (null as any)

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          role: 'super_admin' | 'admin' | 'teacher' | 'student'
          avatar_url?: string
          phone?: string
          status: 'active' | 'inactive' | 'suspended'
          last_login?: string
          email_verified: boolean
          two_factor_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          role: 'super_admin' | 'admin' | 'teacher' | 'student'
          avatar_url?: string
          phone?: string
          status?: 'active' | 'inactive' | 'suspended'
          last_login?: string
          email_verified?: boolean
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: 'super_admin' | 'admin' | 'teacher' | 'student'
          avatar_url?: string
          phone?: string
          status?: 'active' | 'inactive' | 'suspended'
          last_login?: string
          email_verified?: boolean
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          student_id: string
          department_id: string
          year: number
          semester: number
          gpa?: number
          enrollment_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          student_id: string
          department_id: string
          year: number
          semester: number
          gpa?: number
          enrollment_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          student_id?: string
          department_id?: string
          year?: number
          semester?: number
          gpa?: number
          enrollment_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string
          employee_id: string
          department_id: string
          specialization?: string
          hire_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_id: string
          department_id: string
          specialization?: string
          hire_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_id?: string
          department_id?: string
          specialization?: string
          hire_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          head_of_department?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          head_of_department?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          head_of_department?: string
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          credits: number
          department_id: string
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          credits: number
          department_id: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          credits?: number
          department_id?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          code: string
          subject_id: string
          teacher_id: string
          department_id: string
          semester: string
          year: number
          credits: number
          max_students: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          subject_id: string
          teacher_id: string
          department_id: string
          semester: string
          year: number
          credits: number
          max_students: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          subject_id?: string
          teacher_id?: string
          department_id?: string
          semester?: string
          year?: number
          credits?: number
          max_students?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lectures: {
        Row: {
          id: string
          course_id: string
          teacher_id: string
          subject_id: string
          title: string
          description?: string
          scheduled_at: string
          duration_minutes: number
          room?: string
          qr_code?: string
          qr_expires_at?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          teacher_id: string
          subject_id: string
          title: string
          description?: string
          scheduled_at: string
          duration_minutes: number
          room?: string
          qr_code?: string
          qr_expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          teacher_id?: string
          subject_id?: string
          title?: string
          description?: string
          scheduled_at?: string
          duration_minutes?: number
          room?: string
          qr_code?: string
          qr_expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          lecture_id: string
          student_id: string
          status: 'present' | 'absent' | 'late' | 'excused'
          marked_at: string
          verification_method: 'qr_code' | 'manual' | 'biometric'
          location_lat?: number
          location_lng?: number
          device_info?: any
          ip_address?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          student_id: string
          status: 'present' | 'absent' | 'late' | 'excused'
          marked_at?: string
          verification_method: 'qr_code' | 'manual' | 'biometric'
          location_lat?: number
          location_lng?: number
          device_info?: any
          ip_address?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          student_id?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          marked_at?: string
          verification_method?: 'qr_code' | 'manual' | 'biometric'
          location_lat?: number
          location_lng?: number
          device_info?: any
          ip_address?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      anomaly_logs: {
        Row: {
          id: string
          type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          user_id?: string
          lecture_id?: string
          data?: any
          resolved: boolean
          resolved_by?: string
          resolved_at?: string
          resolution_notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          user_id?: string
          lecture_id?: string
          data?: any
          resolved?: boolean
          resolved_by?: string
          resolved_at?: string
          resolution_notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          description?: string
          user_id?: string
          lecture_id?: string
          data?: any
          resolved?: boolean
          resolved_by?: string
          resolved_at?: string
          resolution_notes?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}