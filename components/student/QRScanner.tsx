// components/student/QRScanner.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ScanLine,
  Flashlight,
  FlashlightOff,
  RotateCcw
} from 'lucide-react'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import studentService from '../../services/studentService'

interface QRScannerProps {
  studentId?: string
  onAttendanceMarked?: () => void
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: (result: any) => void
  lectureId?: string
}

interface ScanResult {
  success: boolean
  message: string
  status?: 'present' | 'late'
  data?: any
}

export default function QRScanner({ 
  studentId, 
  onAttendanceMarked, 
  isOpen = true, 
  onClose, 
  onSuccess, 
  lectureId 
}: QRScannerProps) {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera when scanner opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera()
    } else {
      cleanup()
    }

    return cleanup
  }, [isOpen, facingMode])

  const initializeCamera = async () => {
    try {
      setError(null)
      setResult(null)
      
      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      setStream(mediaStream)
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startScanning()
        }
      }

    } catch (err: any) {
      console.error('Camera initialization error:', err)
      setHasPermission(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to scan QR codes.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    
    // Scan every 500ms
    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 500)
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      // Use a QR code detection library (you'll need to install one)
      // For now, we'll simulate QR detection by looking for URL patterns in a mock way
      // In a real implementation, you'd use a library like 'qr-scanner' or 'jsqr'
      
      // Mock QR detection - in reality, you'd use a proper QR library
      const mockDetectQR = () => {
        // This is a placeholder - replace with actual QR detection
        const currentUrl = window.location.href
        if (currentUrl.includes('localhost') || currentUrl.includes('attendance')) {
          // Simulate finding a QR code after a few seconds
          const now = Date.now()
          if (now % 10000 < 1000) { // Simulate detection every 10 seconds for 1 second
            return {
              data: `${window.location.origin}/attendance/scan?lecture=${lectureId || 'test'}&code=mock-qr-code-${now}`
            }
          }
        }
        return null
      }

      const qrResult = mockDetectQR()
      
      if (qrResult) {
        await handleQRDetection(qrResult.data)
      }

    } catch (err) {
      console.error('QR scanning error:', err)
    }
  }

  const handleQRDetection = async (qrData: string) => {
    const currentStudentId = studentId || user?.id
    if (!currentStudentId) return

    setIsScanning(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    try {
      // Get location and device info
      const location = await studentService.getCurrentLocation()
      const deviceInfo = studentService.getDeviceInfo()

      // Mark attendance using the service
      const response = await studentService.markAttendance(
        qrData,
        currentStudentId,
        location,
        deviceInfo
      )

      setResult({
        success: true,
        message: response.message,
        status: response.attendance.status as 'present' | 'late',
        data: response
      })
      
      if (onSuccess) {
        onSuccess(response)
      }

      if (onAttendanceMarked) {
        onAttendanceMarked()
      }

      // Auto close after 3 seconds if onClose is provided
      if (onClose) {
        setTimeout(() => {
          onClose()
        }, 3000)
      }

    } catch (err: any) {
      console.error('QR processing error:', err)
      setResult({
        success: false,
        message: err.message || 'Invalid QR code'
      })
    }
  }

  const toggleFlashlight = async () => {
    if (!stream) return

    try {
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashlightOn } as any]
        })
        setFlashlightOn(!flashlightOn)
      }
    } catch (err) {
      console.error('Flashlight error:', err)
    }
  }

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user')
  }

  const cleanup = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    setIsScanning(false)
    setHasPermission(null)
    setError(null)
    setResult(null)
  }

  const retryCamera = () => {
    cleanup()
    initializeCamera()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scan QR Code
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<X className="w-5 h-5" />}
            />
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Camera View */}
            {hasPermission === null && (
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Initializing camera...
                  </p>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center p-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={retryCamera}
                    icon={<RotateCcw className="w-4 h-4" />}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {hasPermission === true && !result && (
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Corner brackets */}
                      <div className="w-48 h-48 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                        
                        {/* Scanning line */}
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-white shadow-lg"
                          animate={{ y: [0, 192, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFlashlight}
                    className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    icon={flashlightOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={switchCamera}
                    className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    icon={<RotateCcw className="w-4 h-4" />}
                  />
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="aspect-square bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center"
              >
                <div className="text-center p-4">
                  {result.success ? (
                    <>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Success!
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {result.message}
                      </p>
                      {result.status && (
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          result.status === 'present' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {result.status === 'present' ? 'Present' : 'Late'}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Error
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {result.message}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setResult(null)
                          startScanning()
                        }}
                      >
                        Try Again
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Instructions */}
            {hasPermission === true && !result && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Point your camera at the QR code displayed by your teacher
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}