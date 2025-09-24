import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, email, role, status, password } = body

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (status) updateData.status = status

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single()

      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: 'Email already exists'
        }, { status: 400 })
      }
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        name,
        role,
        status,
        avatar_url,
        phone,
        created_at,
        updated_at,
        last_login,
        email_verified
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update user'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if user exists and get their role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Prevent deletion of admin users (safety measure)
    if (user.role === 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete admin users'
      }, { status: 403 })
    }

    // Delete related records first
    await supabase.from('attendance').delete().eq('student_id', id)
    await supabase.from('student_courses').delete().eq('student_id', id)
    
    // Delete user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete user'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}