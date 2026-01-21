import { createClient } from './server'

export type UserRole = 'admin' | 'teacher' | 'student'

export type AuthenticatedUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: string; status: number }

export async function getAuthenticatedUser(): Promise<AuthResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      success: false,
      error: '인증이 필요합니다.',
      status: 401,
    }
  }

  // user_metadata에서 role 가져오기
  const role = (user.user_metadata?.role as UserRole) || 'student'
  const name = user.user_metadata?.name || user.email || 'Unknown'

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email!,
      name,
      role,
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

export async function withAuth(
  handler: (user: AuthenticatedUser) => Promise<Response>,
  options?: { allowedRoles?: UserRole[] }
): Promise<Response> {
  const authResult = await getAuthenticatedUser()

  if (!authResult.success) {
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (options?.allowedRoles) {
    const roleCheck = requireRole(authResult.user, options.allowedRoles)
    if (!roleCheck.allowed) {
      return new Response(
        JSON.stringify({ error: roleCheck.error }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return handler(authResult.user)
}
