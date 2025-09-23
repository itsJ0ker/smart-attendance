// lib/mockData.ts
import { User, AttendanceRecord, Course, Department, Subject, AnomalyLog, AuditLog } from '../types'

// Mock Departments
export const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'Computer Science',
    code: 'CS',
    description: 'Department of Computer Science and Engineering',
    headOfDepartment: 'prof-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'dept-2',
    name: 'Mathematics',
    code: 'MATH',
    description: 'Department of Mathematics',
    headOfDepartment: 'prof-2',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'dept-3',
    name: 'Physics',
    code: 'PHY',
    description: 'Department of Physics',
    headOfDepartment: 'prof-3',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// Mock Subjects
export const mockSubjects: Subject[] = [
  {
    id: 'subj-1',
    name: 'Data Structures and Algorithms',
    code: 'CS301',
    credits: 4,
    departmentId: 'dept-1',
    description: 'Fundamental data structures and algorithms',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'subj-2',
    name: 'Database Management Systems',
    code: 'CS302',
    credits: 3,
    departmentId: 'dept-1',
    description: 'Database design and management',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'subj-3',
    name: 'Linear Algebra',
    code: 'MATH201',
    credits: 3,
    departmentId: 'dept-2',
    description: 'Linear algebra and matrix theory',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'subj-4',
    name: 'Quantum Physics',
    code: 'PHY401',
    credits: 4,
    departmentId: 'dept-3',
    description: 'Introduction to quantum mechanics',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// Mock Users with comprehensive data
export const mockUsers: User[] = [
  // Super Admin
  {
    id: 'super-admin-1',
    email: 'superadmin@college.edu',
    password: 'superadmin',
    name: 'Dr. Sarah Wilson',
    role: 'super_admin',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0001',
    address: '123 Admin Street, College City, CC 12345',
    dateOfBirth: new Date('1975-03-15'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: true,
    lastLogin: new Date('2024-01-15T08:00:00Z'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15'),
    permissions: ['all'],
    departmentId: 'dept-1'
  },
  // Admin
  {
    id: 'admin-1',
    email: 'admin@college.edu',
    password: 'admin',
    name: 'Prof. Michael Chen',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0002',
    address: '456 Faculty Lane, College City, CC 12345',
    dateOfBirth: new Date('1980-07-22'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: true,
    lastLogin: new Date('2024-01-15T07:30:00Z'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15'),
    permissions: ['manage_users', 'manage_courses', 'view_reports', 'manage_attendance'],
    departmentId: 'dept-1'
  },
  // Teachers
  {
    id: 'teacher-1',
    email: 'teacher@college.edu',
    password: 'teacher',
    name: 'Dr. Emily Rodriguez',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0003',
    address: '789 Professor Ave, College City, CC 12345',
    dateOfBirth: new Date('1985-11-08'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: false,
    lastLogin: new Date('2024-01-15T09:15:00Z'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15'),
    permissions: ['manage_attendance', 'view_students', 'generate_qr'],
    departmentId: 'dept-1',
    employeeId: 'EMP001',
    specialization: 'Data Structures and Algorithms'
  },
  {
    id: 'teacher-2',
    email: 'john.smith@college.edu',
    password: 'teacher123',
    name: 'Prof. John Smith',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0004',
    address: '321 Academic Blvd, College City, CC 12345',
    dateOfBirth: new Date('1978-05-14'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: true,
    lastLogin: new Date('2024-01-14T16:45:00Z'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-14'),
    permissions: ['manage_attendance', 'view_students', 'generate_qr'],
    departmentId: 'dept-2',
    employeeId: 'EMP002',
    specialization: 'Mathematics'
  },
  // Students
  {
    id: 'student-1',
    email: 'student@college.edu',
    password: 'student',
    name: 'Alex Johnson',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0005',
    address: '555 Student Housing, College City, CC 12345',
    dateOfBirth: new Date('2002-09-12'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: false,
    lastLogin: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-01-15'),
    permissions: ['scan_qr', 'view_attendance'],
    departmentId: 'dept-1',
    studentId: 'STU2023001',
    year: 2,
    semester: 4,
    gpa: 3.75
  },
  {
    id: 'student-2',
    email: 'maria.garcia@student.college.edu',
    password: 'student123',
    name: 'Maria Garcia',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0006',
    address: '777 Campus Drive, College City, CC 12345',
    dateOfBirth: new Date('2001-12-03'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: false,
    lastLogin: new Date('2024-01-15T11:00:00Z'),
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-01-15'),
    permissions: ['scan_qr', 'view_attendance'],
    departmentId: 'dept-1',
    studentId: 'STU2023002',
    year: 3,
    semester: 6,
    gpa: 3.92
  },
  {
    id: 'student-3',
    email: 'david.kim@student.college.edu',
    password: 'student123',
    name: 'David Kim',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0007',
    address: '999 Dormitory Lane, College City, CC 12345',
    dateOfBirth: new Date('2003-04-18'),
    isActive: true,
    isVerified: true,
    twoFactorEnabled: false,
    lastLogin: new Date('2024-01-15T09:45:00Z'),
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-01-15'),
    permissions: ['scan_qr', 'view_attendance'],
    departmentId: 'dept-1',
    studentId: 'STU2023003',
    year: 1,
    semester: 2,
    gpa: 3.45
  }
]

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Advanced Data Structures',
    code: 'CS301-A',
    subjectId: 'subj-1',
    teacherId: 'teacher-1',
    departmentId: 'dept-1',
    semester: 'Spring 2024',
    year: 2024,
    credits: 4,
    maxStudents: 30,
    enrolledStudents: ['student-1', 'student-2', 'student-3'],
    schedule: [
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101'
      },
      {
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101'
      },
      {
        day: 'Friday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101'
      }
    ],
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'course-2',
    name: 'Database Systems Lab',
    code: 'CS302-B',
    subjectId: 'subj-2',
    teacherId: 'teacher-1',
    departmentId: 'dept-1',
    semester: 'Spring 2024',
    year: 2024,
    credits: 3,
    maxStudents: 25,
    enrolledStudents: ['student-1', 'student-2'],
    schedule: [
      {
        day: 'Tuesday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'CS-Lab-1'
      },
      {
        day: 'Thursday',
        startTime: '14:00',
        endTime: '16:00',
        room: 'CS-Lab-1'
      }
    ],
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// Mock Attendance Records
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'student-1',
    courseId: 'course-1',
    teacherId: 'teacher-1',
    date: new Date('2024-01-15'),
    status: 'present',
    checkInTime: new Date('2024-01-15T09:05:00Z'),
    verificationMethod: 'qr_code',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 5
    },
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iOS',
      deviceId: 'device-123'
    },
    ipAddress: '192.168.1.100',
    notes: 'On time arrival',
    createdAt: new Date('2024-01-15T09:05:00Z'),
    updatedAt: new Date('2024-01-15T09:05:00Z')
  },
  {
    id: 'att-2',
    studentId: 'student-2',
    courseId: 'course-1',
    teacherId: 'teacher-1',
    date: new Date('2024-01-15'),
    status: 'present',
    checkInTime: new Date('2024-01-15T09:03:00Z'),
    verificationMethod: 'qr_code',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 3
    },
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Android 14; Mobile)',
      platform: 'Android',
      deviceId: 'device-456'
    },
    ipAddress: '192.168.1.101',
    notes: 'Early arrival',
    createdAt: new Date('2024-01-15T09:03:00Z'),
    updatedAt: new Date('2024-01-15T09:03:00Z')
  },
  {
    id: 'att-3',
    studentId: 'student-3',
    courseId: 'course-1',
    teacherId: 'teacher-1',
    date: new Date('2024-01-15'),
    status: 'late',
    checkInTime: new Date('2024-01-15T09:15:00Z'),
    verificationMethod: 'qr_code',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 8
    },
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      platform: 'Windows',
      deviceId: 'device-789'
    },
    ipAddress: '192.168.1.102',
    notes: 'Late by 15 minutes',
    createdAt: new Date('2024-01-15T09:15:00Z'),
    updatedAt: new Date('2024-01-15T09:15:00Z')
  }
]

// Mock Anomaly Logs
export const mockAnomalyLogs: AnomalyLog[] = [
  {
    id: 'anom-1',
    type: 'suspicious_location',
    severity: 'medium',
    description: 'Student attempted to check in from unusual location',
    userId: 'student-1',
    courseId: 'course-1',
    timestamp: new Date('2024-01-14T10:30:00Z'),
    data: {
      expectedLocation: { latitude: 40.7128, longitude: -74.0060 },
      actualLocation: { latitude: 40.7500, longitude: -73.9857 },
      distance: 5.2
    },
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date('2024-01-14T10:30:00Z')
  },
  {
    id: 'anom-2',
    type: 'multiple_devices',
    severity: 'high',
    description: 'Multiple device check-ins detected for same student',
    userId: 'student-2',
    courseId: 'course-2',
    timestamp: new Date('2024-01-13T14:15:00Z'),
    data: {
      devices: ['device-456', 'device-999'],
      timeGap: 30
    },
    resolved: true,
    resolvedBy: 'admin-1',
    resolvedAt: new Date('2024-01-13T15:00:00Z'),
    createdAt: new Date('2024-01-13T14:15:00Z')
  }
]

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    action: 'user_login',
    userId: 'teacher-1',
    targetId: null,
    targetType: null,
    timestamp: new Date('2024-01-15T09:15:00Z'),
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    details: {
      loginMethod: 'email_password',
      success: true
    },
    createdAt: new Date('2024-01-15T09:15:00Z')
  },
  {
    id: 'audit-2',
    action: 'qr_code_generated',
    userId: 'teacher-1',
    targetId: 'course-1',
    targetType: 'course',
    timestamp: new Date('2024-01-15T09:20:00Z'),
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    details: {
      courseCode: 'CS301-A',
      expirationTime: new Date('2024-01-15T10:20:00Z'),
      locationRequired: true
    },
    createdAt: new Date('2024-01-15T09:20:00Z')
  },
  {
    id: 'audit-3',
    action: 'attendance_marked',
    userId: 'student-1',
    targetId: 'att-1',
    targetType: 'attendance',
    timestamp: new Date('2024-01-15T09:05:00Z'),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    details: {
      courseCode: 'CS301-A',
      status: 'present',
      verificationMethod: 'qr_code'
    },
    createdAt: new Date('2024-01-15T09:05:00Z')
  }
]

// Helper functions for mock data
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id)
}

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email === email)
}

export const getCoursesByTeacher = (teacherId: string): Course[] => {
  return mockCourses.filter(course => course.teacherId === teacherId)
}

export const getCoursesByStudent = (studentId: string): Course[] => {
  return mockCourses.filter(course => course.enrolledStudents.includes(studentId))
}

export const getAttendanceByStudent = (studentId: string): AttendanceRecord[] => {
  return mockAttendanceRecords.filter(record => record.studentId === studentId)
}

export const getAttendanceByCourse = (courseId: string): AttendanceRecord[] => {
  return mockAttendanceRecords.filter(record => record.courseId === courseId)
}

export const getTodaysClasses = (teacherId: string): Course[] => {
  const today = new Date().toLocaleLowerString('en-US', { weekday: 'long' })
  return mockCourses.filter(course => 
    course.teacherId === teacherId && 
    course.schedule.some(schedule => schedule.day === today)
  )
}

export const getStudentTodaysClasses = (studentId: string): Course[] => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  return mockCourses.filter(course => 
    course.enrolledStudents.includes(studentId) && 
    course.schedule.some(schedule => schedule.day === today)
  )
}

// Statistics helpers
export const getAttendanceStats = () => {
  const totalRecords = mockAttendanceRecords.length
  const presentCount = mockAttendanceRecords.filter(r => r.status === 'present').length
  const lateCount = mockAttendanceRecords.filter(r => r.status === 'late').length
  const absentCount = mockAttendanceRecords.filter(r => r.status === 'absent').length
  
  return {
    total: totalRecords,
    present: presentCount,
    late: lateCount,
    absent: absentCount,
    presentPercentage: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
    latePercentage: totalRecords > 0 ? Math.round((lateCount / totalRecords) * 100) : 0,
    absentPercentage: totalRecords > 0 ? Math.round((absentCount / totalRecords) * 100) : 0
  }
}

export const getUserStats = () => {
  return {
    total: mockUsers.length,
    admins: mockUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    teachers: mockUsers.filter(u => u.role === 'teacher').length,
    students: mockUsers.filter(u => u.role === 'student').length,
    active: mockUsers.filter(u => u.isActive).length,
    verified: mockUsers.filter(u => u.isVerified).length
  }
}

export const getSecurityStats = () => {
  return {
    totalAnomalies: mockAnomalyLogs.length,
    unresolvedAnomalies: mockAnomalyLogs.filter(a => !a.resolved).length,
    highSeverityAnomalies: mockAnomalyLogs.filter(a => a.severity === 'high').length,
    recentAudits: mockAuditLogs.filter(a => 
      new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  }
}