// types/index.ts

// ============= CORE USER TYPES =============
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'super_admin';
  avatar_url?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

export interface Student extends User {
  student_id: string;
  department: string;
  semester: number;
  batch: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
  enrollment_date: string;
  graduation_date?: string;
  cgpa?: number;
  attendance_percentage?: number;
}

export interface Teacher extends User {
  teacher_id: string;
  department: string;
  subjects: string[];
  designation: string;
  qualification: string;
  experience_years: number;
  joining_date: string;
  salary?: number;
  office_location?: string;
}

export interface Admin extends User {
  admin_id: string;
  permissions: string[];
  department?: string;
  access_level: 'full' | 'limited' | 'read_only';
}

// ============= ACADEMIC TYPES =============
export interface Department {
  id: string;
  name: string;
  code: string;
  head_id?: string;
  description?: string;
  established_date?: string;
  total_students?: number;
  total_teachers?: number;
  created_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department_id: string;
  semester: number;
  credits: number;
  type: 'theory' | 'practical' | 'project';
  description?: string;
  prerequisites?: string[];
  syllabus_url?: string;
  is_active: boolean;
  created_at: string;
  department?: Department;
}

export interface Course {
  id: string;
  subject_id: string;
  teacher_id: string;
  semester: number;
  academic_year: string;
  section: string;
  max_students: number;
  enrolled_students: number;
  schedule: CourseSchedule[];
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  subject?: Subject;
  teacher?: Teacher;
}

export interface CourseSchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  start_time: string;
  end_time: string;
  room_number?: string;
  building?: string;
}

// ============= ATTENDANCE TYPES =============
export interface Lecture {
  id: string;
  course_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  qr_code: string;
  qr_expires_at: string;
  latitude?: number;
  longitude?: number;
  room_number?: string;
  building?: string;
  max_distance_meters: number;
  attendance_window_minutes: number;
  total_students: number;
  present_students: number;
  absent_students: number;
  late_students: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  started_at?: string;
  ended_at?: string;
  course?: Course;
  subject?: Subject;
  teacher?: Teacher;
}

export interface Attendance {
  id: string;
  lecture_id: string;
  student_id: string;
  marked_at: string;
  status: 'present' | 'late' | 'absent';
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  latitude?: number;
  longitude?: number;
  distance_from_lecture?: number;
  verification_method: 'qr_scan' | 'manual' | 'biometric';
  verified_by?: string;
  notes?: string;
  student?: Student;
  lecture?: Lecture;
}

export interface AttendanceStats {
  student_id: string;
  subject_id: string;
  total_lectures: number;
  attended_lectures: number;
  late_count: number;
  absent_count: number;
  attendance_percentage: number;
  last_attendance?: string;
  trend: 'improving' | 'declining' | 'stable';
}

// ============= SECURITY & AUDIT TYPES =============
export interface AnomalyLog {
  id: string;
  user_id: string;
  type: 'suspicious_location' | 'multiple_devices' | 'rapid_scanning' | 'invalid_qr' | 'time_manipulation' | 'proxy_detection';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: User;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  user?: User;
}

export interface SecuritySettings {
  id: string;
  organization_id: string;
  max_qr_scan_distance: number;
  qr_expiry_minutes: number;
  allow_late_attendance: boolean;
  late_threshold_minutes: number;
  require_location_verification: boolean;
  enable_device_fingerprinting: boolean;
  enable_proxy_detection: boolean;
  max_attendance_per_day: number;
  suspicious_activity_threshold: number;
  auto_block_suspicious_users: boolean;
  notification_settings: NotificationSettings;
  updated_at: string;
  updated_by: string;
}

// ============= NOTIFICATION TYPES =============
export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  attendance_reminders: boolean;
  anomaly_alerts: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'attendance' | 'security' | 'system' | 'academic';
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

// ============= REPORTING TYPES =============
export interface Report {
  id: string;
  name: string;
  type: 'attendance' | 'performance' | 'security' | 'custom';
  parameters: Record<string, any>;
  generated_by: string;
  generated_at: string;
  file_url?: string;
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
}

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_lectures_today: number;
  active_lectures: number;
  average_attendance: number;
  attendance_trend: 'up' | 'down' | 'stable';
  security_alerts: number;
  system_health: 'good' | 'warning' | 'critical';
}

// ============= API RESPONSE TYPES =============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// ============= FORM TYPES =============
export interface LoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
  two_factor_code?: string;
}

export interface CreateUserForm {
  email: string;
  name: string;
  role: User['role'];
  phone?: string;
  department?: string;
  student_id?: string;
  teacher_id?: string;
  semester?: number;
  batch?: string;
}

export interface CreateLectureForm {
  course_id: string;
  title: string;
  description?: string;
  room_number?: string;
  building?: string;
  duration_minutes: number;
  attendance_window_minutes: number;
  max_distance_meters: number;
  scheduled_at?: string;
}

// ============= UTILITY TYPES =============
export type UserRole = User['role'];
export type AttendanceStatus = Attendance['status'];
export type LectureStatus = Lecture['status'];
export type AnomalyType = AnomalyLog['type'];
export type NotificationType = Notification['type'];
export type ReportType = Report['type'];