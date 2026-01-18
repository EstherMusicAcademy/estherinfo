"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppUser } from "@/lib/userStore";
import type { Student, TeacherStudent } from "@/lib/studentStore";

type ApiError = { error: string };

export function AdminTeacherStudentManager() {
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teacherId, setTeacherId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [tRes, sRes, aRes] = await Promise.all([
        fetch("/api/teachers", { cache: "no-store" }),
        fetch("/api/students", { cache: "no-store" }),
        fetch("/api/admin/assignments", { cache: "no-store" }),
      ]);
      const tData = (await tRes.json()) as { teachers: AppUser[] } | ApiError;
      const sData = (await sRes.json()) as { students: Student[] } | ApiError;
      const aData = (await aRes.json()) as { assignments: TeacherStudent[] } | ApiError;
      if (!tRes.ok) throw new Error("error" in tData ? tData.error : "선생님 목록 실패");
      if (!sRes.ok) throw new Error("error" in sData ? sData.error : "학생 목록 실패");
      if (!aRes.ok) throw new Error("error" in aData ? aData.error : "배정 목록 실패");
      setTeachers((tData as { teachers: AppUser[] }).teachers);
      setStudents((sData as { students: Student[] }).students);
      setAssignments((aData as { assignments: TeacherStudent[] }).assignments);
      if (!teacherId && (tData as { teachers: AppUser[] }).teachers.length > 0) {
        setTeacherId((tData as { teachers: AppUser[] }).teachers[0].id);
      }
      if (!studentId && (sData as { students: Student[] }).students.length > 0) {
        setStudentId((sData as { students: Student[] }).students[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingTeachers = useMemo(() => teachers.filter((t) => t.role === "pending"), [teachers]);
  const activeTeachers = useMemo(() => teachers.filter((t) => t.role === "teacher" && t.isActive), [teachers]);
  const filteredTeachers = useMemo(() => {
    const keyword = teacherSearch.trim().toLowerCase();
    if (!keyword) return activeTeachers;
    return activeTeachers.filter((t) => {
      const name = t.displayName?.toLowerCase() ?? "";
      const major = t.major?.toLowerCase() ?? "";
      return name.includes(keyword) || major.includes(keyword);
    });
  }, [activeTeachers, teacherSearch]);
  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase();
    if (!keyword) return students;
    return students.filter((s) => {
      const name = s.name?.toLowerCase() ?? "";
      const major = s.major?.toLowerCase() ?? "";
      return name.includes(keyword) || major.includes(keyword);
    });
  }, [students, studentSearch]);

  const assignmentRows = useMemo(() => {
    const tMap = new Map(teachers.map((t) => [t.id, t]));
    const sMap = new Map(students.map((s) => [s.id, s]));
    return assignments
      .map((a) => ({ a, teacher: tMap.get(a.teacherId), student: sMap.get(a.studentId) }))
      .filter((x) => x.teacher && x.student);
  }, [assignments, teachers, students]);

  async function approve(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/teachers/${id}/approve`, { method: "POST" });
      const data = (await res.json()) as { teacher: AppUser } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "승인 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "승인 실패");
    }
  }

  async function assign() {
    setError(null);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teacherId, studentId }),
      });
      const data = (await res.json()) as { ok: true } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "배정 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "배정 실패");
    }
  }

  async function unassign(tId: string, sId: string) {
    setError(null);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teacherId: tId, studentId: sId }),
      });
      const data = (await res.json()) as { ok: true } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "해제 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "해제 실패");
    }
  }

  return (
    <section id="approve" className="mt-8 grid scroll-mt-24 gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">교사 승인</h2>
        <p className="mt-1 text-sm text-muted">pending 상태 교사를 승인하면 teacher로 전환됩니다.</p>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left text-muted">
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">전공</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={5}>
                    불러오는 중…
                  </td>
                </tr>
              ) : pendingTeachers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={5}>
                    pending 교사가 없습니다.
                  </td>
                </tr>
              ) : (
                pendingTeachers.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium">{t.displayName}</td>
                    <td className="px-4 py-3 text-muted">{t.major}</td>
                    <td className="px-4 py-3 text-muted">{t.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-background px-2 py-1 text-xs text-muted">pending</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-[color:var(--primary-hover)]"
                        onClick={() => void approve(t.id)}
                      >
                        승인
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">선생님 ↔ 학생 배정</h2>
        <p className="mt-1 text-sm text-muted">배정된 학생이 해당 선생님의 “내 학생”이 됩니다.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_120px]">
          <label className="grid gap-1">
            <span className="text-sm text-muted">선생님</span>
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="이름/전공 검색"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
            <select
              className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              {filteredTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName} ({t.major})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-muted">학생</span>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="이름/전공 검색"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
            <select
              className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.major ? `(${s.major})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1">
            <span className="text-sm text-muted">&nbsp;</span>
            <button
              className="h-11 rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
              onClick={() => void assign()}
              disabled={!teacherId || !studentId}
            >
              배정
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left text-muted">
                <th className="px-4 py-3">선생님</th>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignmentRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={3}>
                    배정이 없습니다.
                  </td>
                </tr>
              ) : (
                assignmentRows.map(({ a, teacher, student }) => (
                  <tr key={`${a.teacherId}:${a.studentId}`}>
                    <td className="px-4 py-3 font-medium">
                      {teacher!.displayName} <span className="text-muted">({teacher!.major})</span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {student!.name} <span className="text-muted">{student!.major ? `(${student!.major})` : ""}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-red-600 hover:bg-surface"
                        onClick={() => void unassign(a.teacherId, a.studentId)}
                      >
                        해제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

