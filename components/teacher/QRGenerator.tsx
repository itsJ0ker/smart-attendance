// components/teacher/QRGenerator.tsx
'use client'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface QRGeneratorProps {
  subjectId: string
  onQRGenerated: (qrCode: string) => void
}

export default function QRGenerator({ subjectId, onQRGenerated }: QRGeneratorProps) {
  const { user } = useAuth()
  const [qrCode, setQrCode] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [isActive, setIsActive] = useState(false)

  const generateQRCode = async () => {
    if (!user) return

    const uniqueCode = `ATTEND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    
    const { data: lecture } = await supabase
      .from('lectures')
      .insert({
        subject_id: subjectId,
        teacher_id: user.id,
        qr_code: uniqueCode,
        qr_expires_at: expires.toISOString()
      })
      .select()
      .single()

    if (lecture) {
      setQrCode(uniqueCode)
      setExpiresAt(expires)
      setIsActive(true)
      onQRGenerated(uniqueCode)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && expiresAt) {
      interval = setInterval(() => {
        if (new Date() > expiresAt) {
          setIsActive(false)
          setQrCode('')
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, expiresAt])

  const getTimeRemaining = () => {
    if (!expiresAt) return 0
    return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">QR Code Attendance</h3>
      
      {!isActive ? (
        <button
          onClick={generateQRCode}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Start Attendance Session
        </button>
      ) : (
        <div className="text-center">
          <div className="mb-4">
            <QRCode value={qrCode} size={200} />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Time remaining: {getTimeRemaining()} seconds
          </p>
          <p className="text-xs text-gray-500">
            Students should scan this QR code to mark attendance
          </p>
        </div>
      )}
    </div>
  )
}