'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseAuth } from '@/components/auth/SupabaseAuthProvider'
import type { Subject } from '@/lib/subjectStore'

type Tab = 'login' | 'signup'
type SignupRole = 'teacher' | 'staff' | 'student'
type ApiError = { error: string }

export default function SupabaseAuthPage() {
  const router = useRouter()
  const auth = useSupabaseAuth()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')

  // signup
  const [signupRole, setSignupRole] = useState<SignupRole>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [majorSubjectId, setMajorSubjectId] = useState<string>('')
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear() - 18)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    async function run() {
      const res = await fetch('/api/subjects', { cache: 'no-store' })
      const data = (await res.json()) as { subjects: Subject[] } | ApiError
      if (!res.ok) return
      const majors = (data as { subjects: Subject[] }).subjects.filter(
        (s) => s.isActive && s.category === 'major'
      )
      setSubjects(majors)
      if (!majorSubjectId && majors.length) setMajorSubjectId(majors[0].id)
    }
    void run()
  }, [majorSubjectId])

  // 이미 로그인 상태면 홈으로 리다이렉트
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.push('/')
    }
  }, [auth.isLoading, auth.isAuthenticated, router])

  const title = useMemo(() => {
    if (tab === 'login') return '로그인'
    return '가입'
  }, [tab])

  async function doLogin() {
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPw,
    })

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
  }

  async function doSignup() {
    setError(null)
    setSuccess(null)

    if (pw !== pwConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    const role = signupRole === 'student' ? 'student' : signupRole

    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        data: {
          name,
          role,
          major_subject_id: majorSubjectId || undefined,
          birth_year: signupRole === 'student' ? birthYear : undefined,
          phone: signupRole === 'student' ? phone : undefined,
        },
      },
    })

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
    setTab('login')
    setLoginEmail(email)
  }

  if (auth.isLoading) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">로그인</h1>
          <p className="mt-2 text-sm text-muted">로그인 정보를 확인하는 중입니다.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          회원가입 후 이메일 인증이 필요합니다.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            className={`h-10 rounded-lg border px-4 text-sm font-medium ${
              tab === 'login'
                ? 'border-[color:var(--primary)] bg-surface'
                : 'border-border bg-background hover:bg-surface'
            }`}
            onClick={() => setTab('login')}
          >
            로그인
          </button>
          <button
            className={`h-10 rounded-lg border px-4 text-sm font-medium ${
              tab === 'signup'
                ? 'border-[color:var(--primary)] bg-surface'
                : 'border-border bg-background hover:bg-surface'
            }`}
            onClick={() => setTab('signup')}
          >
            가입
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mb-4 text-sm text-green-600">{success}</p> : null}

          {tab === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">이메일</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">비밀번호</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                />
              </div>
              <button
                onClick={doLogin}
                className="h-10 rounded-lg bg-[color:var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                로그인
              </button>
            </div>
          )}

          {tab === 'signup' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">가입 유형</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as SignupRole)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                >
                  <option value="student">학생</option>
                  <option value="teacher">선생님</option>
                  <option value="staff">직원</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                    aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPw ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPwConfirm ? 'text' : 'password'}
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwConfirm((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                    aria-label={showPwConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
                  >
                    {showPwConfirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              {(signupRole === 'teacher' || signupRole === 'student') && (
                <div>
                  <label className="mb-1 block text-sm font-medium">전공</label>
                  <select
                    value={majorSubjectId}
                    onChange={(e) => setMajorSubjectId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {signupRole === 'student' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">출생연도</label>
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">연락처</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                </>
              )}
              <button
                onClick={doSignup}
                className="h-10 rounded-lg bg-[color:var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                가입 요청
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
