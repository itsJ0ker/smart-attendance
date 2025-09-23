// components/QRScanner.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Clock,
  Scan,
  RefreshCw,
  Settings,
  Flashlight,
  FlashlightOff,
  Smartphone,
  Monitor
} from 'lucide-react'
import Button from './ui/Button'
import { Card, CardBody } from './ui/Card'
import Badge from './ui/Badge'
import { Modal } from './ui/Modal'
import { SecurityService } from '../lib/security'
import toast from 'react-hot-toast'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (data: any) => void
  className?: string
}

interface ScanResult {
  success: boolean
  message: string
  data?: any
  timestamp: string
  location?: {
    latitude: number
    longitude: number
  }
}

export default function QRScanner({ isOpen, onClose, onScanSuccess, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment')
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Mock QR data for demonstration
  const mockQRData = {
    classId: 'CS101-2024-001',
    className: 'Computer Science 101',
    teacher: 'Prof. David Wilson',
    room: 'Room 201',
    timestamp: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    }
  }

  useEffect(() => {
    if (isOpen) {
      requestCameraPermission()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setHasPermission(true)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera permission denied:', error)
      setHasPermission(false)
      toast.error('Camera access is required to scan QR codes')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setFlashlightOn(false)
  }

  const toggleFlashlight = async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack && 'torch' in videoTrack.getCapabilities()) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashlightOn } as any]
          })
          setFlashlightOn(!flashlightOn)
        } catch (error) {
          toast.error('Flashlight not supported on this device')
        }
      } else {
        toast.error('Flashlight not available')
      }
    }
  }

  const switchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    setCameraFacing(newFacing)
    
    stopCamera()
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      toast.error('Failed to switch camera')
    }
  }

  const simulateQRScan = async () => {
    setIsProcessing(true)
    
    try {
      // Get current location for verification
      const location = await getCurrentLocation()
      
      // Simulate QR code validation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Validate location (mock validation)
      const isLocationValid = validateLocation(location, mockQRData.location)
      
      // Check if QR code is still valid
      const isTimeValid = new Date() < new Date(mockQRData.validUntil)
      
      if (!isTimeValid) {
        setScanResult({
          success: false,
          message: 'QR code has expired. Please ask your teacher to generate a new one.',
          timestamp: new Date().toLocaleTimeString()
        })
        return
      }
      
      if (!isLocationValid) {
        setScanResult({
          success: false,
          message: 'You are not in the correct location for this class.',
          timestamp: new Date().toLocaleTimeString(),
          location
        })
        return
      }
      
      // Success case
      const attendanceData = {
        ...mockQRData,
        studentLocation: location,
        scanTime: new Date().toISOString(),
        deviceFingerprint: SecurityService.generateDeviceFingerprint()
      }
      
      setScanResult({
        success: true,
        message: `Successfully marked attendance for ${mockQRData.className}`,
        data: attendanceData,
        timestamp: new Date().toLocaleTimeString(),
        location
      })
      
      onScanSuccess(attendanceData)
      
    } catch (error) {
      setScanResult({
        success: false,
        message: 'Failed to process QR code. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
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
            latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.01
          })
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const validateLocation = (userLocation: any, classLocation: any) => {
    // Calculate distance between user and class location
    const distance = SecurityService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      classLocation.latitude,
      classLocation.longitude
    )
    
    // Allow 100 meters tolerance
    return distance <= 0.1
  }

  const handleRetry = () => {
    setScanResult(null)
    setIsProcessing(false)
  }

  const handleClose = () => {
    setScanResult(null)
    setIsProcessing(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            QR Code Scanner
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {scanResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Card>
                <CardBody className="p-8">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    scanResult.success 
                      ? 'bg-success-100 dark:bg-success-900' 
                      : 'bg-error-100 dark:bg-error-900'
                  }`}>
                    {scanResult.success ? (
                      <CheckCircle className="w-10 h-10 text-success-600 dark:text-success-400" />
                    ) : (
                      <AlertCircle className="w-10 h-10 text-error-600 dark:text-error-400" />
                    )}
                  </div>
                  
                  <h3 className={`text-xl font-semibold mb-2 ${
                    scanResult.success 
                      ? 'text-success-800 dark:text-success-200' 
                      : 'text-error-800 dark:text-error-200'
                  }`}>
                    {scanResult.success ? 'Attendance Marked!' : 'Scan Failed'}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {scanResult.message}
                  </p>
                  
                  {scanResult.data && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 text-left">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Class:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {scanResult.data.className}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Teacher:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {scanResult.data.teacher}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Room:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {scanResult.data.room}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Time:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {scanResult.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 justify-center">
                    {scanResult.success ? (
                      <Button variant="primary" onClick={handleClose}>
                        Done
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleRetry}>
                          Try Again
                        </Button>
                        <Button variant="primary" onClick={handleClose}>
                          Close
                        </Button>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {hasPermission === false ? (
                <Card>
                  <CardBody className="p-8 text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Camera Access Required
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please allow camera access to scan QR codes for attendance.
                    </p>
                    <Button variant="primary" onClick={requestCameraPermission}>
                      Enable Camera
                    </Button>
                  </CardBody>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Camera View */}
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-80 object-cover"
                    />
                    
                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                          {/* Corner indicators */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                          
                          {/* Scanning line animation */}
                          <motion.div
                            className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-lg"
                            animate={{
                              top: ['0%', '100%', '0%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                          />
                        </div>
                        
                        <p className="text-white text-center mt-4 text-sm">
                          Position QR code within the frame
                        </p>
                      </div>
                    </div>
                    
                    {/* Camera Controls */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFlashlight}
                        className="bg-black/50 text-white hover:bg-black/70"
                      >
                        {flashlightOn ? (
                          <FlashlightOff className="w-4 h-4" />
                        ) : (
                          <Flashlight className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={switchCamera}
                        className="bg-black/50 text-white hover:bg-black/70"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <Card>
                    <CardBody className="p-4">
                      <div className="flex items-start space-x-3">
                        <Scan className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            How to scan
                          </h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Point your camera at the QR code displayed by your teacher</li>
                            <li>• Make sure the QR code fits within the scanning frame</li>
                            <li>• Hold steady until the code is automatically detected</li>
                            <li>• Ensure you're in the correct classroom location</li>
                          </ul>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      variant="primary"
                      fullWidth
                      loading={isProcessing}
                      onClick={simulateQRScan}
                      icon={<Scan className="w-4 h-4" />}
                    >
                      {isProcessing ? 'Processing...' : 'Simulate Scan (Demo)'}
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}