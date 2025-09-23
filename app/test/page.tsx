// app/test/page.tsx
export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600 mb-4">If you can see this page, the basic routing is working!</p>
        <div className="space-y-2">
          <a href="/" className="block text-blue-600 hover:text-blue-800">← Back to Home</a>
          <a href="/auth/login" className="block text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    </div>
  )
}