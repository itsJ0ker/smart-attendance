// components/QRGenerator.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  RefreshCw, 
  Settings, 
  Clock,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Printer,
  Monitor,
  Smartphone,
  Timer,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import Button from './ui/Button'
import { Card, CardHeader, CardBody } from './ui/Card'
import Badge from './ui/Badge'
import { Modal } from './ui/Modal'
import { SecurityService } from '../lib/security'
import toast from 'react-hot-toast'

interface QRGeneratorProps {
  isOpen: boolean
  onClose: () => void
  classData?: {
    id: string
    name: string
    room: string
    teacher: string
    startTime: string
    endTime: string
  }
  className?: string
}

interface QRCodeData {
  classId: string
  className: string
  teacher: string
  room: string
  timestamp: string
  validUntil: string
  location: {
    latitude: number
    longitude: number
  }
  securityHash: string
  sessionId: string
}

interface QRSettings {
  validDuration: number // minutes
  maxDistance: number // meters
  requireLocation: boolean
  allowEarlyEntry: boolean
  autoRefresh: boolean
}

export default function QRGenerator({ isOpen, onClose, classData, className }: QRGeneratorProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [settings, setSettings] = useState<QRSettings>({
    validDuration: 30,
    maxDistance: 100,
    requireLocation: true,
    allowEarlyEntry: true,
    autoRefresh: false
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [studentsScanned, setStudentsScanned] = useState<number>(0)
  const [isActive, setIsActive] = useState(false)
  const [showQRCode, setShowQRCode] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Mock class data if not provided
  const defaultClassData = {
    id: 'CS101-2024-001',
    name: 'Computer Science 101',
    room: 'Room 201',
    teacher: 'Prof. David Wilson',
    startTime: '09:00 AM',
    endTime: '10:30 AM'
  }

  const currentClass = classData || defaultClassData

  useEffect(() => {
    if (isOpen && !qrData) {
      generateQRCode()
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (qrData && isActive) {
      startTimer()
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [qrData, isActive])

  const generateQRCode = async () => {
    setIsGenerating(true)
    
    try {
      // Get current location
      const location = await getCurrentLocation()
      
      // Generate secure QR code data
      const sessionId = SecurityService.generateSessionId()
      const timestamp = new Date().toISOString()
      const validUntil = new Date(Date.now() + settings.validDuration * 60 * 1000).toISOString()
      
      const qrCodeData: QRCodeData = {
        classId: currentClass.id,
        className: currentClass.name,
        teacher: currentClass.teacher,
        room: currentClass.room,
        timestamp,
        validUntil,
        location,
        securityHash: SecurityService.generateSecureHash(`${currentClass.id}-${timestamp}-${sessionId}`),
        sessionId
      }
      
      setQrData(qrCodeData)
      setTimeRemaining(settings.validDuration * 60)
      setIsActive(true)
      setStudentsScanned(0)
      
      toast.success('QR code generated successfully!')
      
    } catch (error) {
      toast.error('Failed to generate QR code')
      console.error('QR generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Mock location for demo
        resolve({
          latitude: 40.7128,
          longitude: -74.0060
        })
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          // Mock location for demo
          resolve({
            latitude: 40.7128,
            longitude: -74.0060
          })
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          if (settings.autoRefresh) {
            generateQRCode()
          }
          return 0
        }
        return prev - 1
      })
      
      // Simulate students scanning (for demo)
      if (Math.random() < 0.1) { // 10% chance per second
        setStudentsScanned(prev => prev + 1)
      }
    }, 1000)
  }

  const refreshQRCode = () => {
    generateQRCode()
  }

  const downloadQRCode = () => {
    if (!qrRef.current) return
    
    // In a real implementation, this would generate and download the actual QR code image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      canvas.width = 400
      canvas.height = 400
      
      // Draw a mock QR code pattern
      ctx.fillStyle = '#000000'
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i * 20, j * 20, 20, 20)
          }
        }
      }
      
      // Download the image
      const link = document.createElement('a')
      link.download = `qr-code-${currentClass.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast.success('QR code downloaded!')
    }
  }

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${currentClass.name}`,
          text: `Attendance QR code for ${currentClass.name} in ${currentClass.room}`,
          url: window.location.href
        })
      } catch (error) {
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    if (qrData) {
      const qrText = JSON.stringify(qrData, null, 2)
      navigator.clipboard.writeText(qrText).then(() => {
        toast.success('QR code data copied to clipboard!')
      }).catch(() => {
        toast.error('Failed to copy to clipboard')
      })
    }
  }

  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow && qrData) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${currentClass.name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { border: 2px solid #000; padding: 20px; margin: 20px auto; width: 300px; }
              .qr-code { width: 200px; height: 200px; background: #f0f0f0; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
              .class-info { margin-top: 20px; }
              .class-info h2 { margin: 10px 0; }
              .class-info p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-code">QR CODE</div>
              <div class="class-info">
                <h2>${currentClass.name}</h2>
                <p><strong>Room:</strong> ${currentClass.room}</p>
                <p><strong>Teacher:</strong> ${currentClass.teacher}</p>
                <p><strong>Time:</strong> ${currentClass.startTime} - ${currentClass.endTime}</p>
                <p><strong>Valid Until:</strong> ${new Date(qrData.validUntil).toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = () => {
    if (!isActive) return 'error'
    if (timeRemaining < 300) return 'warning' // Less than 5 minutes
    return 'success'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              QR Code Generator
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate attendance QR code for {currentClass.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={<Settings className="w-4 h-4" />}
            >
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Attendance QR Code
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor()}>
                      {isActive ? 'Active' : 'Expired'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQRCode(!showQRCode)}
                      icon={showQRCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    >
                      {showQRCode ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <AnimatePresence mode="wait">
                  {showQRCode ? (
                    <motion.div
                      key="qr-visible"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center"
                    >
                      <div 
                        ref={qrRef}
                        className={`w-80 h-80 mx-auto mb-6 border-4 rounded-lg flex items-center justify-center ${
                          isActive 
                            ? 'border-success-500 bg-white' 
                            : 'border-gray-300 bg-gray-100'
                        }`}
                      >
                        <div className="text-center">
                          <QrCode className={`w-32 h-32 mx-auto mb-2 ${
                            isActive ? 'text-gray-800' : 'text-gray-400'
                          }`} />
                          <p className="text-sm text-gray-500">
                            {isActive ? 'Scan to mark attendance' : 'QR Code Expired'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Timer Display */}
                      {isActive && (
                        <motion.div
                          className="mb-4"
                          animate={{ scale: timeRemaining < 60 ? [1, 1.05, 1] : 1 }}
                          transition={{ duration: 1, repeat: timeRemaining < 60 ? Infinity : 0 }}
                        >
                          <div className={`text-3xl font-bold ${
                            timeRemaining < 300 ? 'text-warning-600' : 'text-success-600'
                          }`}>
                            {formatTime(timeRemaining)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Time remaining
                          </p>
                        </motion.div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={refreshQRCode}
                          loading={isGenerating}
                          icon={<RefreshCw className="w-4 h-4" />}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadQRCode}
                          icon={<Download className="w-4 h-4" />}
                        >
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={shareQRCode}
                          icon={<Share2 className="w-4 h-4" />}
                        >
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={printQRCode}
                          icon={<Printer className="w-4 h-4" />}
                        >
                          Print
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="qr-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-20"
                    >
                      <EyeOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        QR code is hidden for security
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRCode(true)}
                        className="mt-4"
                      >
                        Show QR Code
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardBody>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Class Information */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Class Information
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {currentClass.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Course
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {currentClass.room}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Location
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {currentClass.startTime} - {currentClass.endTime}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Schedule
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {studentsScanned} students
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Scanned so far
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Security Settings */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Security Settings
                      </h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Valid Duration (minutes)
                        </label>
                        <select
                          value={settings.validDuration}
                          onChange={(e) => setSettings(prev => ({ ...prev, validDuration: Number(e.target.value) }))}
                          className="form-select w-full"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Distance (meters)
                        </label>
                        <select
                          value={settings.maxDistance}
                          onChange={(e) => setSettings(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                          className="form-select w-full"
                        >
                          <option value={50}>50 meters</option>
                          <option value={100}>100 meters</option>
                          <option value={200}>200 meters</option>
                          <option value={500}>500 meters</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.requireLocation}
                            onChange={(e) => setSettings(prev => ({ ...prev, requireLocation: e.target.checked }))}
                            className="form-checkbox"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Require location verification
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.allowEarlyEntry}
                            onChange={(e) => setSettings(prev => ({ ...prev, allowEarlyEntry: e.target.checked }))}
                            className="form-checkbox"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow early attendance
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.autoRefresh}
                            onChange={(e) => setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                            className="form-checkbox"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Auto-refresh when expired
                          </span>
                        </label>
                      </div>
                      
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={generateQRCode}
                        loading={isGenerating}
                      >
                        Apply Settings
                      </Button>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Quick Actions
                </h3>
              </CardHeader>
              <CardBody className="space-y-2">
                <Button variant="outline" size="sm" fullWidth icon={<Monitor className="w-4 h-4" />}>
                  Display on Screen
                </Button>
                <Button variant="outline" size="sm" fullWidth icon={<Smartphone className="w-4 h-4" />}>
                  Send to Mobile
                </Button>
                <Button variant="outline" size="sm" fullWidth icon={<Eye className="w-4 h-4" />}>
                  View Attendance
                </Button>
                <Button variant="outline" size="sm" fullWidth icon={<Download className="w-4 h-4" />}>
                  Export Report
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  )
}