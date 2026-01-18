"use client";

import { useEffect, useMemo, useState } from "react";
import { IconLink, IconUser } from "@/components/icons/UiIcons";
import type { Student } from "@/lib/studentStore";
import { useRole } from "@/components/role/RoleProvider";
import type { Subject } from "@/lib/subjectStore";
import Link from "next/link";

type ApiError = { error: string };

export function AdminStudentManager() {
  const { role } = useRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [majorSubjects, setMajorSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 검색/필터
  const [search, setSearch] = useState("");
  const [filterMajor, setFilterMajor] = useState("");

  // 새 학생 등록 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState<number>(2008);
  const [major, setMajor] = useState("");

  // 메모 편집
  const [sharedMemo, setSharedMemo] = useState<string>("");
  const [adminMemo, setAdminMemo] = useState<string>("");

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    let result = students;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          (s.major || "").toLowerCase().includes(searchLower)
      );
    }
    if (filterMajor) {
      result = result.filter((s) => s.major === filterMajor);
    }
    return result;
  }, [students, search, filterMajor]);

  const age = useMemo(() => {
    if (!Number.isFinite(birthYear)) return null;
    return new Date().getFullYear() - birthYear + 1;
  }, [birthYear]);

  async function refreshStudents() {
    const res = await fetch("/api/admin/students", { cache: "no-store" });
    const data = (await res.json()) as { students: Student[] } | ApiError;
    if (!res.ok) throw new Error("error" in data ? data.error : "학생 목록을 불러오지 못했습니다.");
    setStudents((data as { students: Student[] }).students);
  }

  async function refreshMajors() {
    const res = await fetch("/api/subjects", { cache: "no-store" });
    const data = (await res.json()) as { subjects: Subject[] } | ApiError;
    if (!res.ok) throw new Error("error" in data ? data.error : "과목 목록을 불러오지 못했습니다.");
    setMajorSubjects((data as { subjects: Subject[] }).subjects.filter((s) => s.isActive && s.category === "major"));
  }

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      await refreshMajors();
      await refreshStudents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSharedMemo(selectedStudent?.sharedMemo ?? "");
    setAdminMemo(selectedStudent?.adminMemo ?? "");
  }, [selectedStudentId, selectedStudent?.sharedMemo, selectedStudent?.adminMemo]);

  async function createStudent() {
    setError(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, birthYear, major }),
      });
      const data = (await res.json()) as { student: Student } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "학생 등록 실패");
      setName("");
      setMajor("");
      setShowAddForm(false);
      await refreshStudents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "학생 등록 실패");
    }
  }

  async function saveMemos() {
    if (!selectedStudentId) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: selectedStudentId,
          sharedMemo,
          adminMemo: role === "admin" ? adminMemo : undefined,
        }),
      });
      const data = (await res.json()) as { student: Student } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "저장 실패");
      await refreshStudents();
      alert("메모가 저장되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    }
  }

  function calcAge(year: number) {
    return new Date().getFullYear() - year + 1;
  }

  return (
    <section id="students" className="grid scroll-mt-24 gap-6">
      {error ? <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</p> : null}

      {/* 상단: 통계 + 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="text-2xl font-bold text-[color:var(--primary)]">{students.length}</div>
            <div className="text-xs text-muted">전체 학생</div>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
            <div className="text-xs text-muted">검색 결과</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
          >
            {showAddForm ? "취소" : "+ 학생 등록"}
          </button>
          {role === "admin" && (
            <Link
              href="/admin/share-links"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 font-medium hover:bg-surface"
            >
              <IconLink className="h-4 w-4" />
              공유 링크 관리
            </Link>
          )}
        </div>
      </div>

      {/* 학생 등록 폼 (토글) */}
      {showAddForm && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold">새 학생 등록</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm text-muted">학생 이름</label>
              <input
                className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김민준"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">출생년도</label>
              <input
                type="number"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
              />
              <span className="mt-1 block text-xs text-muted">나이: {age ?? "-"}세</span>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">전공</label>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {majorSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="h-10 w-full rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
                onClick={() => void createStudent()}
                disabled={!name.trim() || loading}
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학생 이름 또는 전공으로 검색..."
            className="h-10 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
          />
          <select
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3"
          >
            <option value="">전체 전공</option>
            {majorSubjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {(search || filterMajor) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterMajor("");
              }}
              className="h-10 rounded-lg border border-border bg-background px-4 text-sm hover:bg-surface"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 학생 카드 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-border bg-surface p-8 text-center text-muted">
            불러오는 중...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-border bg-surface/50 p-8 text-center">
            <div className="text-4xl">
              <IconUser className="h-10 w-10" />
            </div>
            <p className="mt-2 text-muted">
              {search || filterMajor ? "검색 결과가 없습니다" : "등록된 학생이 없습니다"}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-lg ${
                selectedStudentId === student.id
                  ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-2 ring-[color:var(--primary)]"
                  : "border-border bg-surface hover:border-[color:var(--primary)]/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <p className="mt-1 text-sm text-muted">{calcAge(student.birthYear)}세 ({student.birthYear}년생)</p>
                </div>
                {selectedStudentId === student.id && (
                  <span className="rounded-full bg-[color:var(--primary)] px-2 py-0.5 text-xs text-white">
                    선택됨
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {student.major ? (
                  <span className="rounded-lg bg-[color:var(--primary)]/10 px-2 py-1 text-xs font-medium text-[color:var(--primary)]">
                    {student.major}
                  </span>
                ) : (
                  <span className="rounded-lg bg-muted/20 px-2 py-1 text-xs text-muted">
                    전공 미정
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 선택된 학생 상세 및 메모 편집 */}
      {selectedStudent && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
              <p className="text-sm text-muted">
                {calcAge(selectedStudent.birthYear)}세 · {selectedStudent.major || "전공 미정"}
              </p>
            </div>
            <button
              onClick={() => setSelectedStudentId("")}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-surface"
            >
              선택 해제
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                공유 메모 <span className="text-xs text-muted">(선생님과 공유)</span>
              </label>
              <textarea
                className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={sharedMemo}
                onChange={(e) => setSharedMemo(e.target.value)}
                placeholder="선생님과 공유되는 메모를 입력하세요."
              />
            </div>

            {role === "admin" && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  관리자 전용 메모 <span className="text-xs text-muted">(관리자만 열람 가능)</span>
                </label>
                <textarea
                  className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="관리자만 보는 메모를 입력하세요."
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
              onClick={() => void saveMemos()}
            >
              메모 저장
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
