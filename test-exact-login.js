// Test the exact login flow your app uses
const { AuthService } = require('./lib/auth.ts')

async function testLogin() {
  try {
    console.log('Testing exact login flow...\n')
    
    const email = 'joijoi00666@gmail.com'
    const password = 'password123'
    
    console.log('Attempting login with:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log()
    
    const user = await AuthService.login(email, password)
    
    console.log('✅ LOGIN SUCCESSFUL!')
    console.log('User data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified
    })
    
  } catch (error) {
    console.error('❌ LOGIN FAILED:', error.message)
    console.error('Full error:', error)
  }
}

testLogin()