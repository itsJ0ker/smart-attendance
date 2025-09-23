// lib/security.ts
import CryptoJS from 'crypto-js'
import UAParser from 'ua-parser-js'

export class SecurityService {
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production'

  // Device Fingerprinting
  static generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server-side'

    const parser = new UAParser()
    const result = parser.getResult()
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      device: result.device.type || 'desktop',
    }

    return CryptoJS.SHA256(JSON.stringify(fingerprint)).toString()
  }

  // Location Services
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => resolve(null),
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }

  // Distance Calculation (Haversine formula)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Proxy Detection
  static async detectProxy(): Promise<boolean> {
    try {
      // Check for common proxy headers
      const response = await fetch('/api/security/check-proxy', {
        method: 'GET',
        headers: {
          'X-Forwarded-For': '',
          'X-Real-IP': '',
          'X-Proxy-Connection': '',
        },
      })
      const data = await response.json()
      return data.isProxy || false
    } catch {
      return false
    }
  }

  // Rate Limiting
  static checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    if (typeof window === 'undefined') return true

    const now = Date.now()
    const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]')
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs)
    
    if (validAttempts.length >= maxAttempts) {
      return false
    }

    // Add current attempt
    validAttempts.push(now)
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(validAttempts))
    
    return true
  }

  // Encrypt sensitive data
  static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString()
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  // Generate secure QR code with expiration
  static generateSecureQRCode(lectureId: string, teacherId: string, expiryMinutes: number = 5): string {
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000)
    const payload = {
      lectureId,
      teacherId,
      expiryTime,
      nonce: Math.random().toString(36).substring(2, 15),
    }
    
    return this.encrypt(JSON.stringify(payload))
  }

  // Validate QR code
  static validateQRCode(qrCode: string): { valid: boolean; data?: any; error?: string } {
    try {
      const decrypted = this.decrypt(qrCode)
      const payload = JSON.parse(decrypted)
      
      if (Date.now() > payload.expiryTime) {
        return { valid: false, error: 'QR code has expired' }
      }
      
      return { valid: true, data: payload }
    } catch {
      return { valid: false, error: 'Invalid QR code' }
    }
  }

  // Anomaly Detection
  static detectAnomalies(attendanceData: {
    studentId: string
    location?: { latitude: number; longitude: number }
    deviceFingerprint: string
    timestamp: number
    lectureLocation?: { latitude: number; longitude: number }
  }): string[] {
    const anomalies: string[] = []

    // Check for rapid successive scans
    const recentScans = this.getRecentScans(attendanceData.studentId)
    if (recentScans.length > 3) {
      anomalies.push('rapid_scanning')
    }

    // Check for location anomalies
    if (attendanceData.location && attendanceData.lectureLocation) {
      const distance = this.calculateDistance(
        attendanceData.location.latitude,
        attendanceData.location.longitude,
        attendanceData.lectureLocation.latitude,
        attendanceData.lectureLocation.longitude
      )
      
      if (distance > 100) { // More than 100 meters away
        anomalies.push('suspicious_location')
      }
    }

    // Check for device fingerprint changes
    const lastFingerprint = localStorage.getItem(`last_fingerprint_${attendanceData.studentId}`)
    if (lastFingerprint && lastFingerprint !== attendanceData.deviceFingerprint) {
      anomalies.push('multiple_devices')
    }
    localStorage.setItem(`last_fingerprint_${attendanceData.studentId}`, attendanceData.deviceFingerprint)

    // Check for time manipulation
    const serverTime = Date.now()
    const timeDiff = Math.abs(serverTime - attendanceData.timestamp)
    if (timeDiff > 60000) { // More than 1 minute difference
      anomalies.push('time_manipulation')
    }

    return anomalies
  }

  private static getRecentScans(studentId: string): number[] {
    const scans = JSON.parse(localStorage.getItem(`recent_scans_${studentId}`) || '[]')
    const now = Date.now()
    const recentScans = scans.filter((timestamp: number) => now - timestamp < 300000) // Last 5 minutes
    
    recentScans.push(now)
    localStorage.setItem(`recent_scans_${studentId}`, JSON.stringify(recentScans))
    
    return recentScans
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    score: number
    feedback: string[]
    isStrong: boolean
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score += 1
    else feedback.push('Password should be at least 8 characters long')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Password should contain lowercase letters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Password should contain uppercase letters')

    if (/\d/.test(password)) score += 1
    else feedback.push('Password should contain numbers')

    if (/[^a-zA-Z\d]/.test(password)) score += 1
    else feedback.push('Password should contain special characters')

    return {
      score,
      feedback,
      isStrong: score >= 4,
    }
  }

  // Generate secure token
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Session management
  static createSession(userId: string, role: string): string {
    const sessionData = {
      userId,
      role,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      deviceFingerprint: this.generateDeviceFingerprint(),
    }
    
    const token = this.encrypt(JSON.stringify(sessionData))
    localStorage.setItem('session_token', token)
    return token
  }

  static validateSession(token: string): { valid: boolean; data?: any } {
    try {
      const decrypted = this.decrypt(token)
      const sessionData = JSON.parse(decrypted)
      
      if (Date.now() > sessionData.expiresAt) {
        return { valid: false }
      }
      
      // Validate device fingerprint
      const currentFingerprint = this.generateDeviceFingerprint()
      if (sessionData.deviceFingerprint !== currentFingerprint) {
        return { valid: false }
      }
      
      return { valid: true, data: sessionData }
    } catch {
      return { valid: false }
    }
  }

  static destroySession(): void {
    localStorage.removeItem('session_token')
    localStorage.removeItem('auth_token')
  }
}