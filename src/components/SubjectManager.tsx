"use client";

import { useEffect, useMemo, useState } from "react";
import type { Subject, SubjectCategory } from "@/lib/subjectStore";

type ApiList = { subjects: Subject[] };
type ApiError = { error: string };

function categoryLabel(c: SubjectCategory) {
  return c === "major" ? "전공" : "이론";
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SubjectCategory>("major");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategory, setEditingCategory] = useState<SubjectCategory>("major");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subjects", { cache: "no-store" });
      const data = (await res.json()) as ApiList | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "목록을 불러오지 못했습니다.");
      setSubjects((data as ApiList).subjects);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const grouped = useMemo(() => {
    const active = subjects.filter((s) => s.isActive);
    const inactive = subjects.filter((s) => !s.isActive);
    return { active, inactive };
  }, [subjects]);

  async function create() {
    setError(null);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName, category: newCategory }),
      });
      const data = (await res.json()) as { subject: Subject } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "추가 실패");
      setNewName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    }
  }

  function startEdit(s: Subject) {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingCategory(s.category);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingCategory("major");
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      const res = await fetch("/api/subjects", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editingName, category: editingCategory }),
      });
      const data = (await res.json()) as { subject: Subject } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "수정 실패");
      cancelEdit();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정 실패");
    }
  }

  async function toggleActive(s: Subject) {
    setError(null);
    try {
      const res = await fetch("/api/subjects", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
      });
      const data = (await res.json()) as { subject: Subject } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "변경 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경 실패");
    }
  }

  async function remove(s: Subject) {
    if (!confirm(`과목 “${s.name}”을(를) 삭제할까요?`)) return;
    setError(null);
    try {
      const res = await fetch("/api/subjects", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: s.id }),
      });
      const data = (await res.json()) as { ok: true } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "삭제 실패");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  return (
    <section id="subjects" className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">과목 관리</h2>
        <p className="text-sm text-muted">과목명/분류(전공·이론) 수정 가능, 비활성화/삭제 가능</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_120px]">
        <label className="grid gap-1">
          <span className="text-sm text-muted">과목명</span>
          <input
            className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="예: 보컬"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-muted">분류</span>
          <select
            className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as SubjectCategory)}
          >
            <option value="major">전공</option>
            <option value="theory">이론</option>
          </select>
        </label>
        <div className="grid gap-1">
          <span className="text-sm text-muted">&nbsp;</span>
          <button
            className="h-11 rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void create()}
            disabled={!newName.trim()}
          >
            추가
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 grid gap-6">
        <div>
          <div className="mb-2 text-sm font-semibold">활성 과목</div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left text-muted">
                  <th className="px-4 py-3">과목</th>
                  <th className="px-4 py-3">분류</th>
                  <th className="px-4 py-3">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-muted" colSpan={3}>
                      불러오는 중…
                    </td>
                  </tr>
                ) : grouped.active.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted" colSpan={3}>
                      활성 과목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  grouped.active.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <input
                            className="h-9 w-full rounded-md border border-border bg-background px-2 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                          />
                        ) : (
                          <span className="font-medium">
                            {s.name} <span className="text-muted">({categoryLabel(s.category)})</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <select
                            className="h-9 rounded-md border border-border bg-background px-2 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                            value={editingCategory}
                            onChange={(e) => setEditingCategory(e.target.value as SubjectCategory)}
                          >
                            <option value="major">전공</option>
                            <option value="theory">이론</option>
                          </select>
                        ) : (
                          <span className="text-muted">{categoryLabel(s.category)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {editingId === s.id ? (
                            <>
                              <button
                                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-[color:var(--primary-hover)]"
                                onClick={() => void saveEdit()}
                              >
                                저장
                              </button>
                              <button
                                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-surface"
                                onClick={cancelEdit}
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-surface"
                                onClick={() => startEdit(s)}
                              >
                                수정
                              </button>
                              <button
                                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-surface"
                                onClick={() => void toggleActive(s)}
                              >
                                비활성화
                              </button>
                              <button
                                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-red-600 hover:bg-surface"
                                onClick={() => void remove(s)}
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">비활성 과목</div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left text-muted">
                  <th className="px-4 py-3">과목</th>
                  <th className="px-4 py-3">분류</th>
                  <th className="px-4 py-3">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grouped.inactive.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted" colSpan={3}>
                      비활성 과목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  grouped.inactive.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium">
                        {s.name} <span className="text-muted">({categoryLabel(s.category)})</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{categoryLabel(s.category)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-surface"
                            onClick={() => void toggleActive(s)}
                          >
                            활성화
                          </button>
                          <button
                            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-red-600 hover:bg-surface"
                            onClick={() => void remove(s)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

