"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppUser } from "@/lib/userStore";

type ApiError = { error: string };

export function AdminAsTeacherPanel() {
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [teacherId, setTeacherId] = useState<string>("t-1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/teachers", { cache: "no-store" });
        const data = (await res.json()) as { teachers: AppUser[] } | ApiError;
        if (!res.ok) throw new Error("error" in data ? data.error : "선생님 목록을 불러오지 못했습니다.");
        const active = (data as { teachers: AppUser[] }).teachers.filter((t) => t.role === "teacher" && t.isActive);
        setTeachers(active);
        if (active.length && !active.some((t) => t.id === teacherId)) setTeacherId(active[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "불러오기 실패");
      }
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => teachers.find((t) => t.id === teacherId) ?? null, [teachers, teacherId]);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">선생님 기능(관리자용)</h2>
      <p className="mt-1 text-sm text-muted">관리자는 선생님 기능을 그대로 사용할 수 있습니다. (대리 작성/대리 조회)</p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          <span className="text-sm text-muted">선생님 선택</span>
          <select
            className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName} {t.major ? `(${t.major})` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-1">
          <span className="text-sm text-muted">&nbsp;</span>
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-surface"
              href={`/teacher/students?teacherId=${encodeURIComponent(teacherId)}`}
            >
              내 학생
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-surface"
              href={`/teacher/evaluations/new?teacherId=${encodeURIComponent(teacherId)}`}
            >
              평가 작성
            </a>
          </div>
        </div>
      </div>

      {selected ? (
        <p className="mt-3 text-xs text-muted">
          현재 선택: <span className="font-medium">{selected.displayName}</span>
          {selected.major ? ` · ${selected.major}` : ""}
        </p>
      ) : null}
    </section>
  );
}

