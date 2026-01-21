import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'teacher' | 'student'

export type AuthenticatedUser = {
  sub: string
  email: string
  name: string
  role: UserRole
  groups: string[]
}

export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: string; status: number }

export async function extractAuthFromRequest(): Promise<AuthResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { success: false, error: '인증이 필요합니다.', status: 401 }
  }

  const role = (user.user_metadata?.role as UserRole) || 'student'
  const name = user.user_metadata?.name || user.email || 'Unknown'

  return {
    success: true,
    user: {
      sub: user.id,
      email: user.email!,
      name,
      role,
      groups: [],
    },
  }
}

export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): { allowed: true } | { allowed: false; error: string } {
  if (!allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      error: `접근 권한이 없습니다. 필요한 권한: ${allowedRoles.join(', ')}`,
    }
  }
  return { allowed: true }
}

export function authErrorResponse(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status })
}

export function withAuth(
  handler: (request: Request, user: AuthenticatedUser) => Promise<NextResponse>,
  options?: { allowedRoles?: UserRole[] }
) {
  return async (request: Request): Promise<NextResponse> => {
    const authResult = await extractAuthFromRequest()

    if (!authResult.success) {
      return authErrorResponse(authResult.error, authResult.status)
    }

    if (options?.allowedRoles) {
      const roleCheck = requireRole(authResult.user, options.allowedRoles)
      if (!roleCheck.allowed) {
        return authErrorResponse(roleCheck.error, 403)
      }
    }

    return handler(request, authResult.user)
  }
}

/** WARNING: 개발 환경 전용. 프로덕션에서 절대 사용 금지. */
export function withAuthDev(
  handler: (request: Request, user: AuthenticatedUser) => Promise<NextResponse>,
  options?: { allowedRoles?: UserRole[] }
) {
  return async (request: Request): Promise<NextResponse> => {
    if (process.env.NODE_ENV === 'development') {
      const devUserId = request.headers.get('X-Dev-User-Id')
      const devRole = request.headers.get('X-Dev-Role') as UserRole | null

      if (devUserId) {
        const mockUser: AuthenticatedUser = {
          sub: devUserId,
          email: `${devUserId}@dev.local`,
          name: `Dev User (${devUserId})`,
          role: devRole || 'admin',
          groups: [],
        }

        if (options?.allowedRoles) {
          const roleCheck = requireRole(mockUser, options.allowedRoles)
          if (!roleCheck.allowed) {
            return authErrorResponse(roleCheck.error, 403)
          }
        }

        return handler(request, mockUser)
      }
    }

    return withAuth(handler, options)(request)
  }
}
