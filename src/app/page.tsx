"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/role/RoleProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { IconCalendar, IconFileList, IconVideo } from "@/components/icons/UiIcons";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const auth = useAuth();
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace("/auth");
    }
  }, [auth.isAuthenticated, auth.isLoading, router]);

  if (auth.isLoading || !auth.isAuthenticated) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">로그인 화면으로 이동 중...</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-surface to-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="rounded-3xl border border-border bg-surface p-10 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-40 overflow-hidden rounded-lg">
              <Image
                src="/esther-logo-basic.png"
                alt="에스더실용음악학원"
                fill
                priority
                className="object-cover object-center"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight">에스더 실용음악학원</h1>
              <p className="mt-2 text-lg text-muted">관리 시스템</p>
            </div>
          </div>

          {/* Role-based Description */}
          <div className="mt-8 rounded-2xl bg-background p-6">
            {role === "admin" && (
              <>
                <h2 className="text-xl font-semibold">관리자 대시보드</h2>
                <p className="mt-2 text-muted">
                  교사 승인, 학생 관리, 과목 관리, 모의고사 영상 관리 등<br />
                  학원 운영에 필요한 모든 기능을 관리할 수 있습니다.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/admin"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-medium text-white transition-colors hover:bg-[color:var(--primary-hover)]"
                  >
                    관리자 대시보드
                  </Link>
                  <Link
                    href="/teacher/students"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    내 학생 보기
                  </Link>
                  <Link
                    href="/admin/mock-tests"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    모의고사 관리
                  </Link>
                </div>
              </>
            )}

            {role === "teacher" && (
              <>
                <h2 className="text-xl font-semibold">선생님 페이지</h2>
                <p className="mt-2 text-muted">
                  담당 학생 관리, 평가 작성, 업무일지 작성 등<br />
                  레슨 관리에 필요한 모든 기능을 사용할 수 있습니다.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/teacher/students"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-medium text-white transition-colors hover:bg-[color:var(--primary-hover)]"
                  >
                    내 학생 보기
                  </Link>
                  <Link
                    href="/teacher/evaluations/new"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    학생 평가 작성
                  </Link>
                  <Link
                    href="/teacher/work-log"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    업무일지
                  </Link>
                </div>
              </>
            )}

            {role === "staff" && (
              <>
                <h2 className="text-xl font-semibold">직원 페이지</h2>
                <p className="mt-2 text-muted">
                  모의고사 영상 관리, 업무일지 확인 등<br />
                  학원 운영 보조 업무를 수행할 수 있습니다.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/admin/mock-tests"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-medium text-white transition-colors hover:bg-[color:var(--primary-hover)]"
                  >
                    모의고사 관리
                  </Link>
                  <Link
                    href="/teacher/work-log"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    업무일지
                  </Link>
                  <Link
                    href="/guidebook"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    가이드북
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Common Links */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/guidebook"
              className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="text-2xl font-semibold group-hover:text-primary">
                <IconFileList />
              </div>
              <h3 className="mt-2 font-semibold">가이드북</h3>
              <p className="mt-1 text-sm text-muted">학원 운영 가이드 및 매뉴얼</p>
            </Link>

            <Link
              href="/admin/mock-tests"
              className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="text-2xl font-semibold group-hover:text-primary">
                <IconVideo />
              </div>
              <h3 className="mt-2 font-semibold">모의고사</h3>
              <p className="mt-1 text-sm text-muted">모의고사 영상 관리</p>
            </Link>

            <Link
              href="/teacher/work-log"
              className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="text-2xl font-semibold group-hover:text-primary">
                <IconCalendar />
              </div>
              <h3 className="mt-2 font-semibold">업무일지</h3>
              <p className="mt-1 text-sm text-muted">레슨 일지 및 출석 관리</p>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 rounded-2xl border border-border bg-surface/50 p-6 text-center text-sm text-muted">
          <p>에스더 실용음악학원 관리 시스템 v1.0</p>
        </div>
      </div>
    </main>
  );
}
