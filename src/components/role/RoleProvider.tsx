'use client'

import { createContext, useContext, useMemo } from 'react'
import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider'

// 교사/직원/학생 역할
export type AppRole = 'teacher' | 'admin' | 'staff' | 'student' | 'student_vip' | 'student_pending'

type RoleContextValue = {
  role: AppRole
  setRole: (r: AppRole) => void
  // 교사용
  teacherId: string
  setTeacherId: (id: string) => void
  teacherName: string
  // 학생용
  studentId: string
  setStudentId: (id: string) => void
  studentName: string
  // 현재 사용자 ID/이름 (역할에 따라 다름)
  userId: string
  userName: string
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseAuth()
  const profile = auth.profile

  const value = useMemo<RoleContextValue>(() => {
    const role: AppRole = !auth.isAuthenticated
      ? 'student_pending'
      : (profile?.role as AppRole) || 'student'

    const userId = profile?.id ?? ''
    const userName = profile?.name ?? profile?.email ?? '사용자'
    const isStudentRole = role === 'student' || role === 'student_vip' || role === 'student_pending'

    return {
      role,
      setRole: () => {},
      teacherId: isStudentRole ? '' : userId,
      setTeacherId: () => {},
      teacherName: isStudentRole ? '' : userName,
      studentId: isStudentRole ? userId : '',
      setStudentId: () => {},
      studentName: isStudentRole ? userName : '',
      // 현재 역할에 따른 사용자 정보
      userId,
      userName,
    }
  }, [auth.isAuthenticated, profile])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
