"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRole } from "@/components/role/RoleProvider";
import { useSupabaseAuth as useAuth } from "@/components/auth/SupabaseAuthProvider";
import { IconLogout } from "@/components/icons/UiIcons";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`relative inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-white shadow-md"
          : "text-muted hover:bg-background hover:text-foreground hover:scale-105"
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-white rounded-full"></span>
      )}
    </Link>
  );
}

function Menu({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 클릭 시 details 닫기
    const details = e.currentTarget.closest("details");
    if (details) {
      details.removeAttribute("open");
    }
  }

  return (
    <details className="relative">
      <summary className="inline-flex h-10 cursor-pointer list-none items-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-background hover:text-foreground">
        {title}
      </summary>
      <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col py-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={handleClick}
              className="px-3 py-2 text-sm text-muted hover:bg-background hover:text-foreground"
            >
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}

export function TopNav() {
  const auth = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const isLoggedIn = auth.isAuthenticated;

  // 학생 역할 체크
  const isStudent = role === "student" || role === "student_vip" || role === "student_pending";
  const isStaff = role === "teacher" || role === "admin" || role === "staff";

  function handleLogin() {
    router.push("/auth");
  }

  function handleLogout() {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    auth.signOut();
    router.push("/auth");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-background">
            <span className="relative h-10 w-24 overflow-hidden rounded-md">
              <Image
                src="/esther-logo-basic.png"
                alt="에스더실용음악학원"
                fill
                priority
                className="object-cover object-center"
              />
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/" label="홈" />
            
            {/* 관리자 대시보드 */}
            {isLoggedIn && role === "admin" && (
              <NavLink href="/admin" label="대시보드" />
            )}
            
            {/* 공통: 연습실 예약 (선생님, 관리자, 학생) */}
            {isLoggedIn && (isStaff || isStudent) && role !== "student_pending" && (
              <NavLink href="/practice-room" label="연습실 예약" />
            )}
            
            {/* 공통: 모의고사 (선생님, 관리자, 직원, 학생) */}
            {isLoggedIn && (isStaff || (isStudent && role !== "student_pending")) && (
              <NavLink href="/admin/mock-tests" label="모의고사" />
            )}
            
            {/* 공통: 업무일지 (선생님, 관리자, 직원) */}
            {isLoggedIn && isStaff && (
              <NavLink href="/teacher/work-log" label="업무일지" />
            )}
            
            {/* 공통: 가이드북 (선생님, 관리자, 직원) */}
            {isLoggedIn && isStaff && (
              <NavLink href="/guidebook" label="가이드북" />
            )}
            
            {/* 선생님/관리자 전용: 학생 관리 */}
            {isLoggedIn && (role === "teacher" || role === "admin") && (
              <NavLink href="/teacher/students" label="학생 관리" />
            )}
            
            {/* 피드백 공유 (관리자만) */}
            {isLoggedIn && role === "admin" && (
              <NavLink href="/admin/share-links" label="피드백 공유 관리" />
            )}
            
            {/* 내 정보 (모든 로그인 사용자) */}
            {isLoggedIn && (isStaff || isStudent) && (
              <NavLink href="/settings/profile" label="내 정보" />
            )}
          </nav>

          {/* 모바일 메뉴 */}
          <div className="flex items-center gap-2 md:hidden">
            <Menu
              title="메뉴"
              items={[
                { href: "/", label: "홈" },
                ...(isLoggedIn && role === "admin" ? [{ href: "/admin", label: "대시보드" }] : []),
                ...(isLoggedIn && (isStaff || isStudent) && role !== "student_pending" ? [{ href: "/practice-room", label: "연습실 예약" }] : []),
                ...(isLoggedIn && (isStaff || (isStudent && role !== "student_pending")) ? [{ href: "/admin/mock-tests", label: "모의고사" }] : []),
                ...(isLoggedIn && isStaff ? [
                  { href: "/teacher/work-log", label: "업무일지" },
                  { href: "/guidebook", label: "가이드북" },
                ] : []),
                ...(isLoggedIn && (role === "teacher" || role === "admin") ? [{ href: "/teacher/students", label: "학생 관리" }] : []),
                ...(isLoggedIn && role === "admin" ? [{ href: "/admin/share-links", label: "피드백 공유 관리" }] : []),
                ...(isLoggedIn && (isStaff || isStudent) ? [{ href: "/settings/profile", label: "내 정보" }] : []),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors"
              title="로그아웃"
            >
              <IconLogout />
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors"
              title="로그인"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
