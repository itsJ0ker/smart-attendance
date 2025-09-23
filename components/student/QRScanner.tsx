// components/student/QRScanner.tsx
'use client'
import { useState } from 'react'
import { QrScanner } from '@yudiel/react-qr-scanner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function QRScanner() {
  const { user } = useAuth()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleScanResult = async (qrCode: string) => {
    if (!user) return

    try {
      setMessage(null)

      // Validate QR code and mark attendance
      const { data: lecture, error: lectureError } = await supabase
        .from('lectures')
        .select('*')
        .eq('qr_code', qrCode)
        .gt('qr_expires_at', new Date().toISOString())
        .single()

      if (lectureError || !lecture) {
        throw new Error('Invalid or expired QR code')
      }

      // Check if already marked
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('lecture_id', lecture.id)
        .eq('student_id', user.id)
        .single()

      if (existingAttendance) {
        throw new Error('Attendance already marked for this lecture')
      }

      // Get device fingerprint and location
      const deviceFingerprint = await generateDeviceFingerprint()
      const location = await getCurrentLocation()

      // Mark attendance
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          lecture_id: lecture.id,
          student_id: user.id,
          device_fingerprint: deviceFingerprint,
          latitude: location.latitude,
          longitude: location.longitude
        })

      if (attendanceError) throw attendanceError

      setMessage({ type: 'success', text: 'Attendance marked successfully!' })
      
      // Check for anomalies
      await checkForAnomalies(lecture.id, deviceFingerprint, location)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const generateDeviceFingerprint = async (): Promise<string> => {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|')
    return btoa(fingerprint)
  }

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => reject(error)
      )
    })
  }

  const checkForAnomalies = async (lectureId: string, deviceFingerprint: string, location: any) => {
    // Check for multiple attendances from same device
    const { data: sameDeviceAttendances } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('device_fingerprint', deviceFingerprint)
      .eq('lecture_id', lectureId)

    if (sameDeviceAttendances && sameDeviceAttendances.length > 1) {
      await supabase
        .from('anomaly_logs')
        .insert({
          user_id: user!.id,
          type: 'multiple_same_device',
          description: `Multiple students marked attendance from same device for lecture ${lectureId}`,
          severity: 'high'
        })
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
      
      {message && (
        <div className={`p-3 rounded-md mb-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="qr-scanner">
        <QrScanner
          onDecode={(result) => handleScanResult(result)}
          onError={(error) => console.error(error)}
        />
      </div>
      
      <p className="text-sm text-gray-600 mt-4 text-center">
        Point your camera at the QR code shown in class
      </p>
    </div>
  )
}