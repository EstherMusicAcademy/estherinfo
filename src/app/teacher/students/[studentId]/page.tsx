"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Subject } from "@/lib/subjectStore";
import type { MockTest } from "@/lib/mockTestStore";
import type { Evaluation } from "@/lib/evaluationStore";
import { extractYouTubeId } from "@/lib/youtube";
import { IconVideo } from "@/components/icons/UiIcons";
import { useRole } from "@/components/role/RoleProvider";

type ApiError = { error: string };

type Student = { id: string; name: string; birthYear: number; major?: string; sharedMemo?: string; adminMemo?: string };

type MockTestGroup = { id: string; year: number; session: number; major: string; examDate?: string };

function calcKoreanAge(birthYear: number) {
  return new Date().getFullYear() - birthYear + 1;
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? "";
  const { teacherId: ctxTeacherId, role } = useRole();
  const teacherId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("teacherId") ?? ctxTeacherId ?? "";
  }, []);

  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [mockTestGroups, setMockTestGroups] = useState<MockTestGroup[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [mtTitle, setMtTitle] = useState("");
  const [mtUrl, setMtUrl] = useState("");
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState<"eval" | "mock">("eval");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [stRes, subRes, mtRes, evRes] = await Promise.all([
        fetch(`/api/students/${studentId}`, { cache: "no-store" }),
        fetch("/api/subjects", { cache: "no-store" }),
        fetch(`/api/students/${studentId}/mock-tests`, { cache: "no-store" }),
        fetch(`/api/students/${studentId}/evaluations`, { cache: "no-store" }),
      ]);
      const stData = (await stRes.json()) as { student: Student } | ApiError;
      const subData = (await subRes.json()) as { subjects: Subject[] } | ApiError;
      const mtData = (await mtRes.json()) as { mockTests: MockTest[]; groups?: MockTestGroup[] } | ApiError;
      const evData = (await evRes.json()) as { evaluations: Evaluation[] } | ApiError;
      if (!stRes.ok) throw new Error("error" in stData ? stData.error : "학생 정보를 불러오지 못했습니다.");
      if (!subRes.ok) throw new Error("error" in subData ? subData.error : "과목을 불러오지 못했습니다.");
      if (!mtRes.ok) throw new Error("error" in mtData ? mtData.error : "모의고사를 불러오지 못했습니다.");
      if (!evRes.ok) throw new Error("error" in evData ? evData.error : "평가를 불러오지 못했습니다.");
      setStudent((stData as { student: Student }).student);
      setSubjects((subData as { subjects: Subject[] }).subjects);
      setMockTests((mtData as { mockTests: MockTest[] }).mockTests);
      setMockTestGroups((mtData as { mockTests: MockTest[]; groups?: MockTestGroup[] }).groups || []);
      setEvaluations((evData as { evaluations: Evaluation[] }).evaluations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!studentId) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function addMockTest() {
    setError(null);
    try {
      if (!teacherId) throw new Error("teacherId가 없습니다.");
      const res = await fetch(`/api/students/${studentId}/mock-tests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: mtTitle, youtubeUrl: mtUrl, createdById: teacherId }),
      });
      const data = (await res.json()) as { mockTest: MockTest } | ApiError;
      if (!res.ok) throw new Error("error" in data ? data.error : "추가 실패");
      setMtTitle("");
      setMtUrl("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    }
  }

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const groupMap = useMemo(() => new Map(mockTestGroups.map((g) => [g.id, g])), [mockTestGroups]);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">학생 상세</h1>
        <p className="mt-2 text-sm text-muted">
          teacherId: <span className="font-mono">{teacherId || "(없음)"}</span>
        </p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          {loading ? (
            <p className="text-sm text-muted">불러오는 중…</p>
          ) : student ? (
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-muted">이름</span>: <span className="font-medium">{student.name}</span>
              </div>
              <div>
                <span className="text-muted">전공</span>: {student.major ?? "-"}
              </div>
              <div>
                <span className="text-muted">나이(한국식)</span>: {calcKoreanAge(student.birthYear)}
              </div>
              <div className="mt-2 rounded-xl border border-border bg-background p-4">
                <div className="text-xs font-semibold text-muted">공유 메모</div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{student.sharedMemo?.trim() ? student.sharedMemo : "없음"}</p>
              </div>
              {role === "admin" ? (
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="text-xs font-semibold text-muted">관리자 전용 메모</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{student.adminMemo?.trim() ? student.adminMemo : "없음"}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">학생을 찾을 수 없습니다.</p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 mt-6 flex gap-2 border-b border-border bg-background/80 pb-3 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("eval")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "eval"
                ? "bg-primary text-white shadow-md"
                : "bg-surface text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            학생 평가 ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab("mock")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "mock"
                ? "bg-primary text-white shadow-md"
                : "bg-surface text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            모의고사 영상 ({mockTests.length})
          </button>
        </div>

        {/* 학생 평가 Tab */}
        {activeTab === "eval" && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">학생 평가</h2>
            <p className="mt-1 text-sm text-muted">담당 선생님들의 모든 평가를 확인할 수 있습니다</p>

            {evaluations.length === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-background/50 py-12 text-center">
                <div className="text-4xl">📝</div>
                <p className="mt-2 text-muted">등록된 평가가 없습니다</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {evaluations
                  .sort((a, b) => new Date(b.evalDate).getTime() - new Date(a.evalDate).getTime())
                  .map((e) => {
                    const subj = subjectMap.get(e.subjectId);
                    const label = subj ? `${subj.name}(${subj.category === "major" ? "전공" : "이론"})` : "과목";
                    return (
                      <div key={e.id} className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-[color:var(--primary)]">
                              {label}
                            </span>
                            <span className="text-xs text-muted">{e.evalDate}</span>
                          </div>
                          <span className="text-xs text-muted">작성자: {e.teacherName || e.teacherId} 선생님</span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{e.content}</p>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* 모의고사 영상 Tab */}
        {activeTab === "mock" && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">모의고사 영상</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr_120px]">
              <input
                className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                placeholder="제목(필수)"
                value={mtTitle}
                onChange={(e) => setMtTitle(e.target.value)}
              />
              <input
                className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                placeholder="YouTube 링크(필수)"
                value={mtUrl}
                onChange={(e) => setMtUrl(e.target.value)}
              />
              <button
                className="h-11 rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
                onClick={() => void addMockTest()}
                disabled={!mtTitle.trim() || !mtUrl.trim() || !teacherId}
              >
                추가
              </button>
            </div>

            {mockTests.length === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-background/50 py-12 text-center">
                <div className="text-4xl">
                  <IconVideo className="h-10 w-10" />
                </div>
                <p className="mt-2 text-muted">등록된 모의고사가 없습니다</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {mockTests.map((m) => {
                  const id = extractYouTubeId(m.youtubeUrl);
                  const group = groupMap.get(m.groupId);
                  return (
                    <div key={m.id} className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md">
                      {/* 그룹 정보 배지 */}
                      {group && (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
                            {group.year}년 {group.session}차 모의고사
                          </span>
                          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                            {group.major}
                          </span>
                          {group.examDate && (
                            <span className="text-xs text-muted">
                              시행일: {new Date(group.examDate).toLocaleDateString("ko-KR")}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium">{m.songTitle}</div>
                          {m.artist && <div className="text-sm text-muted">{m.artist}</div>}
                          <a className="text-sm text-[color:var(--primary)] hover:underline" href={m.youtubeUrl} target="_blank" rel="noopener noreferrer">
                            YouTube에서 보기
                          </a>
                        </div>
                        <div className="text-xs text-muted">{m.createdAt.slice(0, 10)}</div>
                      </div>
                      {id ? (
                        <div className="mt-3 overflow-hidden rounded-lg border border-border">
                          <iframe
                            className="aspect-video w-full"
                            src={`https://www.youtube.com/embed/${id}`}
                            title={m.songTitle}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

