import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/supabase/auth'

export async function GET() {
  return withAuth(
    async (user) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ students: data })
    },
    { allowedRoles: ['admin', 'teacher'] }
  )
}

export async function POST(request: Request) {
  return withAuth(
    async (user) => {
      const supabase = await createClient()
      const body = await request.json()

      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            name: body.name,
            grade: body.grade,
            school: body.school,
            phone: body.phone,
            parent_phone: body.parent_phone,
          },
        ])
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ student: data }, { status: 201 })
    },
    { allowedRoles: ['admin', 'teacher'] }
  )
}
