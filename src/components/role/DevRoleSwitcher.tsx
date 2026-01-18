"use client";

import { useEffect, useState } from "react";
import { useRole, type AppRole } from "@/components/role/RoleProvider";

type Teacher = { id: string; displayName: string; major: string; role: string; isActive: boolean };
type StudentUser = { id: string; displayName: string; major: string; role: string; isActive: boolean };

function roleLabel(r: AppRole) {
  if (r === "admin") return "관리자";
  if (r === "teacher") return "선생님";
  if (r === "staff") return "직원";
  if (r === "student") return "학생";
  if (r === "student_vip") return "학생(깍두기)";
  if (r === "student_pending") return "학생(대기)";
  return r;
}

export function DevRoleSwitcher() {
  const { role, setRole, teacherId, setTeacherId, studentId, setStudentId } = useRole();
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch("/api/teachers", { cache: "no-store" });
        const data = (await res.json()) as { teachers: Teacher[] };
        if (!res.ok) return;
        setTeachers(data.teachers.filter((t) => t.role === "teacher" && t.isActive));
      } catch {
        // ignore (dev tool)
      }
    }
    async function fetchStudents() {
      try {
        const res = await fetch("/api/student-users", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) return;
        setStudents(data.students || []);
      } catch {
        // ignore (dev tool)
      }
    }
    void fetchTeachers();
    void fetchStudents();
  }, []);

  const isStudentRole = role === "student" || role === "student_vip" || role === "student_pending";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[340px] rounded-2xl border border-border bg-surface p-4 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">임시 모드 전환</div>
            <button
              className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-surface"
              onClick={() => setOpen(false)}
            >
              닫기
            </button>
          </div>

          {/* 교직원 역할 */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted mb-2">교직원</div>
            <div className="grid gap-2">
              {(["admin", "teacher", "staff"] as const).map((r) => (
                <label key={r} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                  <span className="text-sm">{roleLabel(r)}</span>
                  <input
                    type="radio"
                    name="role"
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 학생 역할 */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted mb-2">학생</div>
            <div className="grid gap-2">
              {(["student", "student_vip", "student_pending"] as const).map((r) => (
                <label key={r} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                  <span className="text-sm">{roleLabel(r)}</span>
                  <input
                    type="radio"
                    name="role"
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 선생님 선택 */}
          {(role === "teacher" || role === "admin") && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted">선생님 선택(데모)</div>
              <select
                className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                {teachers.length === 0 ? <option value="t-1">t-1</option> : null}
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName} ({t.major})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 학생 선택 */}
          {isStudentRole && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted">학생 선택(데모)</div>
              <select
                className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">선택 안함</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({s.major}) - {roleLabel(s.role as AppRole)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            로그인/권한 붙이기 전까지 화면 확인용입니다. (나중에 제거)
          </p>
        </div>
      ) : (
        <button
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3 shadow-lg hover:bg-background"
          onClick={() => setOpen(true)}
        >
          <span className="text-sm font-semibold">모드</span>
          <span className="rounded-full bg-background px-2 py-1 text-xs text-muted">{roleLabel(role)}</span>
        </button>
      )}
    </div>
  );
}
