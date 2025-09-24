// components/teacher/QRGenerator.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCode, 
  X, 
  Download, 
  Share2, 
  RefreshCw, 
  Clock, 
  Users, 
  CheckCircle,
  Copy,
  Printer,
  Maximize2,
  Timer
} from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useAuth } from '../../hooks/useAuth'

interface QRGeneratorProps {
  isOpen: boolean
  onClose: () => void
  lectureId: string
  lectureName: string
  onSuccess?: (qrData: any) => void
}

interface QRData {
  qr_code: string
  qr_code_image: string
  qr_code_url: string
  expires_at: string
  lecture_id: string
}

export default function QRGenerator({ 
  isOpen, 
  onClose, 
  lectureId, 
  lectureName,
  onSuccess 
}: QRGeneratorProps) {
  const { user } = useAuth()
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expirationMinutes, setExpirationMinutes] = useState(30)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const qrImageRef = useRef<HTMLImageElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const attendanceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Generate QR code when component opens
  useEffect(() => {
    if (isOpen && !qrData) {
      generateQRCode()
    }
  }, [isOpen])

  // Update countdown timer
  useEffect(() => {
    if (qrData && qrData.expires_at) {
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [qrData])

  // Poll attendance count
  useEffect(() => {
    if (qrData) {
      fetchAttendanceCount()
      attendanceTimerRef.current = setInterval(fetchAttendanceCount, 5000) // Every 5 seconds
    }

    return () => {
      if (attendanceTimerRef.current) {
        clearInterval(attendanceTimerRef.current)
      }
    }
  }, [qrData])

  const generateQRCode = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/lectures/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lectureId,
          teacherId: user.id,
          expirationMinutes
        })
      })

      const result = await response.json()

      if (result.success) {
        setQrData(result.data)
        if (onSuccess) {
          onSuccess(result.data)
        }
      } else {
        setError(result.error || 'Failed to generate QR code')
      }
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const updateTimer = () => {
    if (!qrData?.expires_at) return

    const now = new Date().getTime()
    const expiry = new Date(qrData.expires_at).getTime()
    const remaining = Math.max(0, expiry - now)

    setTimeRemaining(remaining)

    if (remaining === 0) {
      // QR code expired
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const fetchAttendanceCount = async () => {
    try {
      const response = await fetch(`/api/lectures/${lectureId}`)
      const result = await response.json()

      if (result.success && result.data.attendance_stats) {
        setAttendanceCount(result.data.attendance_stats.present + result.data.attendance_stats.late)
      }
    } catch (err) {
      console.error('Error fetching attendance count:', err)
    }
  }

  const refreshQRCode = () => {
    setQrData(null)
    generateQRCode()
  }

  const downloadQRCode = () => {
    if (!qrData?.qr_code_image) return

    const link = document.createElement('a')
    link.href = qrData.qr_code_image
    link.download = `qr-code-${lectureName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareQRCode = async () => {
    if (!qrData?.qr_code_image) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrData.qr_code_image)
      const blob = await response.blob()
      const file = new File([blob], 'qr-code.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code - ${lectureName}`,
          text: 'Scan this QR code to mark your attendance',
          files: [file]
        })
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(qrData.qr_code_url)
        // You might want to show a toast notification here
        alert('QR code URL copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing QR code:', err)
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(qrData.qr_code_url)
        alert('QR code URL copied to clipboard!')
      } catch (clipboardErr) {
        console.error('Clipboard error:', clipboardErr)
      }
    }
  }

  const copyURL = async () => {
    if (!qrData?.qr_code_url) return

    try {
      await navigator.clipboard.writeText(qrData.qr_code_url)
      // Show success feedback
      alert('URL copied to clipboard!')
    } catch (err) {
      console.error('Error copying URL:', err)
    }
  }

  const printQRCode = () => {
    if (!qrData?.qr_code_image) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${lectureName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container { 
                max-width: 400px; 
                margin: 0 auto; 
              }
              img { 
                max-width: 100%; 
                height: auto; 
              }
              .info { 
                margin: 20px 0; 
                font-size: 14px; 
                color: #666; 
              }
              .title { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px; 
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="title">${lectureName}</div>
              <div class="info">Scan to mark attendance</div>
              <img src="${qrData.qr_code_image}" alt="QR Code" />
              <div class="info">
                Expires: ${new Date(qrData.expires_at).toLocaleString()}
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 ${
          isFullscreen ? 'bg-white' : ''
        }`}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white dark:bg-gray-800 rounded-2xl w-full max-h-[90vh] overflow-hidden ${
            isFullscreen ? 'max-w-4xl' : 'max-w-md'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                QR Code Generator
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lectureName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                icon={<Maximize2 className="w-4 h-4" />}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={<X className="w-5 h-5" />}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Generating QR code...
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={generateQRCode}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </Button>
              </div>
            )}

            {qrData && (
              <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {timeRemaining !== null && timeRemaining > 0 ? (
                          <span className="text-green-600 dark:text-green-400">
                            {formatTimeRemaining(timeRemaining)}
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            Expired
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {attendanceCount} scanned
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={timeRemaining && timeRemaining > 0 ? 'success' : 'error'}
                    icon={timeRemaining && timeRemaining > 0 ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  >
                    {timeRemaining && timeRemaining > 0 ? 'Active' : 'Expired'}
                  </Badge>
                </div>

                {/* QR Code Display */}
                <div className="text-center">
                  <div className={`inline-block p-6 bg-white rounded-2xl shadow-lg ${
                    isFullscreen ? 'p-12' : ''
                  }`}>
                    <img
                      ref={qrImageRef}
                      src={qrData.qr_code_image}
                      alt="QR Code"
                      className={`mx-auto ${
                        isFullscreen ? 'w-96 h-96' : 'w-64 h-64'
                      }`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Students can scan this code to mark their attendance
                  </p>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={refreshQRCode}
                    icon={<RefreshCw className="w-4 h-4" />}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadQRCode}
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareQRCode}
                    icon={<Share2 className="w-4 h-4" />}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={printQRCode}
                    icon={<Printer className="w-4 h-4" />}
                  >
                    Print
                  </Button>
                </div>

                {/* Settings */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiration Time
                    </label>
                    <select
                      value={expirationMinutes}
                      onChange={(e) => setExpirationMinutes(parseInt(e.target.value))}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyURL}
                    icon={<Copy className="w-4 h-4" />}
                    fullWidth
                    className="text-xs"
                  >
                    Copy QR Code URL
                  </Button>
                </div>

                {/* Expiration Warning */}
                {timeRemaining !== null && timeRemaining < 300000 && timeRemaining > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        QR code expires in less than 5 minutes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}