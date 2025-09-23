// app/debug/page.tsx
'use client'
import { useAuth } from '../../hooks/useAuth'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('auth_token'))
    }
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Authentication Status</h2>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
            <p><strong>Auth Token:</strong> {authToken || 'null'}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Environment</h2>
            <p><strong>Window defined:</strong> {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
            <p><strong>Mounted:</strong> {mounted ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Navigation</h2>
            <div className="space-y-2">
              <a href="/" className="block text-blue-600 hover:text-blue-800">← Back to Home</a>
              <a href="/auth/login" className="block text-blue-600 hover:text-blue-800">Go to Login</a>
              <a href="/test" className="block text-blue-600 hover:text-blue-800">Go to Test Page</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}