"use client";

import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/components/role/RoleProvider";
import Link from "next/link";
import { IconEye, IconFileList, IconLink } from "@/components/icons/UiIcons";

type Student = {
  id: string;
  name: string;
  major?: string;
  birthYear: number;
};

type ShareLink = {
  studentId: string;
  shareToken: string;
  expiresAt: string | null;
  createdAt: string;
  isRevoked?: boolean;
};

export default function ShareLinksPage() {
  const { role } = useRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "active" | "expired" | "none">("all");

  // 공유 링크 생성 폼
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState(""); // 학생 검색
  const [expiresOption, setExpiresOption] = useState<"3" | "5" | "7" | "30" | "none">("7");
  const [customExpires, setCustomExpires] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (role !== "admin") return;
    fetchData();
  }, [role]);

  async function fetchData() {
    try {
      setLoading(true);
      const [studentsRes, linksRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/share-links"),
      ]);

      const studentsData = await studentsRes.json();
      const linksData = await linksRes.json();

      setStudents(studentsData?.students || studentsData || []);
      const linksArray = linksData?.links || linksData || [];
      setShareLinks(Array.isArray(linksArray) ? linksArray : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLink() {
    if (!selectedStudentId) {
      alert("학생을 선택해주세요.");
      return;
    }

    setCreating(true);
    try {
      let expiresAt: string | null = null;
      if (expiresOption !== "none") {
        const days = parseInt(expiresOption);
        const date = new Date();
        date.setDate(date.getDate() + days);
        expiresAt = date.toISOString();
      }
      if (customExpires) {
        expiresAt = new Date(customExpires).toISOString();
      }

      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, expiresAt }),
      });

      if (res.ok) {
        await fetchData();
        setSelectedStudentId("");
        setCustomExpires("");
      }
    } catch (error) {
      console.error("Error creating link:", error);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteLink(studentId: string) {
    if (!confirm("이 공유 링크를 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/share-links/${studentId}`, { method: "DELETE" });
      await fetchData();
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  }

  function getPublicUrl(token: string) {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/public/student/${token}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("링크가 복사되었습니다.");
  }

  // 학생별 링크 매핑
  const linksByStudent = useMemo(() => {
    const map = new Map<string, ShareLink>();
    shareLinks.forEach((link) => {
      map.set(link.studentId, link);
    });
    return map;
  }, [shareLinks]);

  // 통계 계산
  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let noLink = 0;

    students.forEach((student) => {
      const link = linksByStudent.get(student.id);
      if (!link) {
        noLink++;
      } else if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        expired++;
      } else {
        active++;
      }
    });

    return { active, expired, noLink, total: students.length };
  }, [students, linksByStudent]);

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    let result = students;

    // 검색 필터
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          (s.major || "").toLowerCase().includes(searchLower)
      );
    }

    // 상태 필터
    if (viewMode !== "all") {
      result = result.filter((student) => {
        const link = linksByStudent.get(student.id);
        if (viewMode === "none") return !link;
        if (viewMode === "expired") {
          return link && link.expiresAt && new Date(link.expiresAt) < new Date();
        }
        if (viewMode === "active") {
          return link && (!link.expiresAt || new Date(link.expiresAt) >= new Date());
        }
        return true;
      });
    }

    return result;
  }, [students, search, viewMode, linksByStudent]);

  // 활성 링크만 (대시보드용)
  const activeLinks = useMemo(() => {
    return students
      .map((student) => {
        const link = linksByStudent.get(student.id);
        if (!link) return null;
        const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
        if (isExpired) return null;
        return { student, link };
      })
      .filter(Boolean) as { student: Student; link: ShareLink }[];
  }, [students, linksByStudent]);

  if (role !== "admin") {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">관리자만 피드백 공유 링크를 관리할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="text-center text-muted">로딩 중...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">피드백 공유 관리</h1>
            <p className="mt-1 text-sm text-muted">
              학부모에게 공유할 학생 피드백 링크를 생성하고 관리합니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface"
          >
            ← 대시보드
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setViewMode("all")}
            className={`rounded-xl border p-4 text-left transition-all ${
              viewMode === "all" ? "border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]" : "border-border"
            } bg-surface`}
          >
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="mt-1 text-sm text-muted">전체 학생</div>
          </button>
          <button
            onClick={() => setViewMode("active")}
            className={`rounded-xl border p-4 text-left transition-all ${
              viewMode === "active" ? "border-green-500 ring-2 ring-green-500" : "border-border"
            } bg-surface`}
          >
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="mt-1 text-sm text-muted">활성 링크</div>
          </button>
          <button
            onClick={() => setViewMode("expired")}
            className={`rounded-xl border p-4 text-left transition-all ${
              viewMode === "expired" ? "border-red-500 ring-2 ring-red-500" : "border-border"
            } bg-surface`}
          >
            <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
            <div className="mt-1 text-sm text-muted">만료된 링크</div>
          </button>
          <button
            onClick={() => setViewMode("none")}
            className={`rounded-xl border p-4 text-left transition-all ${
              viewMode === "none" ? "border-yellow-500 ring-2 ring-yellow-500" : "border-border"
            } bg-surface`}
          >
            <div className="text-3xl font-bold text-yellow-600">{stats.noLink}</div>
            <div className="mt-1 text-sm text-muted">링크 없음</div>
          </button>
        </div>

        {/* 현재 공개 중인 링크 요약 */}
        {activeLinks.length > 0 && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-green-700">
              <span className="text-xl">
                <IconLink className="h-5 w-5" />
              </span>
              현재 공개 중인 링크 ({activeLinks.length}개)
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeLinks.map(({ student, link }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border border-green-500/20 bg-background p-3"
                >
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs text-muted">
                      {link.expiresAt
                        ? `만료: ${new Date(link.expiresAt).toLocaleDateString("ko-KR")}`
                        : "만료 없음"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToClipboard(getPublicUrl(link.shareToken))}
                      className="rounded-md bg-green-500/10 p-2 text-green-700 hover:bg-green-500/20"
                      title="링크 복사"
                    >
                      <IconFileList className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/public/student/${link.shareToken}`}
                      target="_blank"
                      className="rounded-md bg-green-500/10 p-2 text-green-700 hover:bg-green-500/20"
                      title="미리보기"
                    >
                      <IconEye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 링크 생성 */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">새 공유 링크 생성</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium">학생 선택</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="학생 이름 검색..."
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                >
                  <option value="">학생 선택...</option>
                  {students
                    .filter((s) => {
                      if (!studentSearch.trim()) return true;
                      const searchLower = studentSearch.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(searchLower) ||
                        (s.major || "").toLowerCase().includes(searchLower)
                      );
                    })
                    .map((s) => {
                      const hasLink = linksByStudent.has(s.id);
                      const age = new Date().getFullYear() - s.birthYear + 1;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({age}세, {s.major || "전공 미정"}) {hasLink ? "- 링크 있음" : ""}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">만료 기간</label>
              <select
                value={expiresOption}
                onChange={(e) => {
                  setExpiresOption(e.target.value as "3" | "5" | "7" | "30" | "none");
                  setCustomExpires("");
                }}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              >
                <option value="3">3일 후</option>
                <option value="5">5일 후</option>
                <option value="7">7일 후</option>
                <option value="30">30일 후</option>
                <option value="none">만료 없음</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">직접 지정</label>
              <input
                type="date"
                value={customExpires}
                onChange={(e) => setCustomExpires(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateLink}
                disabled={creating || !selectedStudentId}
                className="h-10 w-full rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-50"
              >
                {creating ? "생성 중..." : "링크 생성"}
              </button>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학생 이름 또는 전공으로 검색..."
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3"
          />
          {viewMode !== "all" && (
            <button
              onClick={() => setViewMode("all")}
              className="h-10 rounded-lg border border-border bg-background px-4 text-sm hover:bg-surface"
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* 학생 목록 테이블 */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">학생</th>
                <th className="px-4 py-3 text-left text-sm font-medium">전공</th>
                <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">만료일</th>
                <th className="px-4 py-3 text-right text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    {search || viewMode !== "all"
                      ? "검색 결과가 없습니다"
                      : "등록된 학생이 없습니다"}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const link = linksByStudent.get(student.id);
                  const isExpired = link?.expiresAt && new Date(link.expiresAt) < new Date();

                  return (
                    <tr key={student.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted">
                          {new Date().getFullYear() - student.birthYear + 1}세
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{student.major || "미정"}</td>
                      <td className="px-4 py-3">
                        {link ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              isExpired
                                ? "bg-red-500/10 text-red-600"
                                : "bg-green-500/10 text-green-600"
                            }`}
                          >
                            {isExpired ? "만료됨" : "활성"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600">
                            링크 없음
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {link?.expiresAt
                          ? new Date(link.expiresAt).toLocaleDateString("ko-KR")
                          : link
                          ? "만료 없음"
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {link ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyToClipboard(getPublicUrl(link.shareToken))}
                              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface"
                            >
                              링크 복사
                            </button>
                            <Link
                              href={`/public/student/${link.shareToken}`}
                              target="_blank"
                              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface"
                            >
                              미리보기
                            </Link>
                            <button
                              onClick={() => handleDeleteLink(student.id)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20"
                            >
                              삭제
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-[color:var(--primary-hover)]"
                          >
                            링크 생성
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
