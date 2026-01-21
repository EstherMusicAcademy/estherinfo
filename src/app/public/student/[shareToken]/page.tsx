"use client";

import { useState, useEffect, use } from "react";
import { useRole } from "@/components/role/RoleProvider";
import { IconVideo, IconWarning } from "@/components/icons/UiIcons";
import { extractYouTubeId } from "@/lib/youtube";

type Props = {
  params: Promise<{ shareToken: string }>;
};

type MockTestData = {
  id: string;
  youtubeUrl: string;
  title: string;
  createdAt: string;
  groupId?: string;
  groupYear?: number;
  groupSession?: number;
  groupMajor?: string;
  groupExamDate?: string;
  songTitle?: string;
  artist?: string;
};

type MockTestGroup = {
  id: string;
  year: number;
  session: number;
  major: string;
  examDate?: string;
};

type TeacherData = {
  id: string;
  displayName: string;
  subjectType?: string;
  subjectLabel?: string;
};

type EvaluationData = {
  id: string;
  evalDate: string;
  subjectLabel: string;
  teacherName: string;
  content: string;
};

type StudentPageData = {
  student: {
    id: string;
    name: string;
    major?: string;
  };
  teachers: TeacherData[];
  evaluations: EvaluationData[];
  mockTests: MockTestData[];
  lessonSubject?: string;
  expiresAt?: string;
  error?: string;
};

type ErrorData = {
  error: string;
};

export default function PublicStudentPage({ params }: Props) {
  const { shareToken } = use(params);
  const { role, teacherId } = useRole();
  const [activeTab, setActiveTab] = useState<"mock" | "eval">("eval");
  const [data, setData] = useState<StudentPageData | ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTeacherOfStudent, setIsTeacherOfStudent] = useState(false);
  
  // 평가 작성 폼 상태
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalDate, setEvalDate] = useState(new Date().toISOString().slice(0, 10));
  const [evalContent, setEvalContent] = useState("");
  const [evalSubject, setEvalSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { getPublicStudentByToken } = await import("@/lib/publicStudentService");
        const result = getPublicStudentByToken(shareToken);
        
        // 학생의 모의고사 영상 가져오기
        const mockTestsRes = await fetch(`/api/mock-tests?studentId=${result.student.id}`);
        const mockTestsData = await mockTestsRes.json();
        
        // 그룹 정보를 모의고사에 추가
        const mockTestsWithGroup = ((mockTestsData.mockTests || []) as MockTestData[]).map((mt) => {
          const group = ((mockTestsData.groups || []) as MockTestGroup[]).find((g) => g.id === mt.groupId);
          return {
            ...mt,
            groupYear: group?.year,
            groupSession: group?.session,
            groupMajor: group?.major,
            groupExamDate: group?.examDate,
          };
        });
        
        setData({
          ...result,
          mockTests: mockTestsWithGroup,
        });
        
        // 선생님이 이 학생을 가르치는지 확인
        if (role === "teacher" && teacherId) {
          const isTeacher = result.teachers.some((t: TeacherData) => t.id === teacherId);
          setIsTeacherOfStudent(isTeacher);
        } else if (role === "admin") {
          setIsTeacherOfStudent(true); // 관리자는 항상 작성 가능
        }
      } catch (e) {
        setData({ error: e instanceof Error ? e.message : "페이지를 불러올 수 없습니다." });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [shareToken, role, teacherId]);

  const handleSubmitEvaluation = async () => {
    if (!evalContent.trim() || !evalSubject) {
      alert("평가 내용과 과목을 입력해주세요.");
      return;
    }

    if (!data || !("student" in data)) {
      alert("학생 정보를 불러올 수 없습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${data.student.id}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacherId || "t1",
          subjectId: evalSubject,
          evalDate,
          content: evalContent,
        }),
      });

      if (!res.ok) throw new Error("평가 작성 실패");

      // 데이터 새로고침
      const { getPublicStudentByToken } = await import("@/lib/publicStudentService");
      const result = getPublicStudentByToken(shareToken);
      setData(result);
      
      // 폼 초기화
      setEvalContent("");
      setShowEvalForm(false);
      setActiveTab("eval"); // 평가 탭으로 전환
      alert("평가가 등록되었습니다.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "평가 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse rounded-3xl border border-border bg-surface p-8 shadow-sm">
            <div className="h-6 w-48 rounded-lg bg-muted/30"></div>
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full rounded bg-muted/30"></div>
              <div className="h-4 w-3/4 rounded bg-muted/30"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl">
        {data && "error" in data ? (
          <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">에스더 피드백 공유</h1>
            <div className="mt-4 rounded-2xl border-2 border-red-400 bg-red-100 p-4 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">{data.error}</p>
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-background p-6">
              <div className="mb-3 text-sm font-semibold text-foreground">확인 방법</div>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-[color:var(--primary)]">•</span>
                  <span>링크가 회수되었거나 만료되면 열 수 없습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--primary)]">•</span>
                  <span>관리자 화면의 &quot;학생 관리 → 학부모 공개 링크(토큰)&quot;에서 새 링크를 발급하세요.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--primary)]">•</span>
                  <span>
                    개발용 데모 링크: <code className="rounded bg-muted/30 px-1.5 py-0.5 font-mono text-xs">/public/student/demo-token</code>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 학생 정보 헤더 */}
            <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">에스더 실용음악학원 피드백 공유 페이지</h1>
                {isTeacherOfStudent && (
                  <button
                    onClick={() => {
                      setShowEvalForm(!showEvalForm);
                      setActiveTab("eval");
                    }}
                    className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--primary-hover)]"
                  >
                    {showEvalForm ? "작성 취소" : "평가 작성"}
                  </button>
                )}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="group">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted">학생 이름</div>
                  <div className="mt-1 text-lg font-semibold">{(data as StudentPageData).student.name}</div>
                </div>
                <div className="group">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted">전공</div>
                  <div className="mt-1 text-lg font-semibold">{(data as StudentPageData).student.major ?? "-"}</div>
                </div>
                <div className="group">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted">레슨 과목</div>
                  <div className="mt-1 text-lg font-semibold">{(data as StudentPageData).lessonSubject ?? "-"}</div>
                </div>
                {(data as StudentPageData).teachers.length > 0 && (
                  <div className="col-span-full grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(data as StudentPageData).teachers.map((t) => (
                      <div key={t.id} className="group rounded-xl bg-muted/10 px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-wider text-muted">
                          {t.subjectType === "major" ? "전공수업" : t.subjectType === "theory" ? "이론수업" : "담당"} 선생님
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-semibold">{t.displayName}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {t.subjectLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* 만료일 안내 */}
            {(data as StudentPageData).expiresAt && (
              <div className="rounded-2xl border-2 border-amber-500 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">보안 안내</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      본 페이지는 <strong>{new Date((data as StudentPageData).expiresAt!).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</strong>까지 열람 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 평가 작성 폼 */}
            {showEvalForm && isTeacherOfStudent && (
              <div className="animate-in fade-in slide-in-from-top-4 rounded-3xl border-2 border-[color:var(--primary)] bg-surface p-6 shadow-lg duration-300 sm:p-8">
                <h2 className="text-xl font-bold">평가 작성</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted">평가 날짜</label>
                    <input
                      type="date"
                      value={evalDate}
                      onChange={(e) => setEvalDate(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">과목</label>
                    <select
                      value={evalSubject}
                      onChange={(e) => setEvalSubject(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20"
                    >
                      <option value="">선택하세요</option>
                      <option value="s1">보컬(전공)</option>
                      <option value="s2">피아노(이론)</option>
                      <option value="s3">기타(이론)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">평가 내용</label>
                    <textarea
                      value={evalContent}
                      onChange={(e) => setEvalContent(e.target.value)}
                      rows={6}
                      placeholder="학생의 연습 상황, 발전 사항, 개선할 점 등을 자세히 작성해주세요."
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitEvaluation}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--primary-hover)] disabled:opacity-50"
                    >
                      {submitting ? "등록 중..." : "평가 등록"}
                    </button>
                    <button
                      onClick={() => setShowEvalForm(false)}
                      className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 네비게이션 */}
            <nav className="sticky top-20 z-10 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setActiveTab("eval")}
                  className={`relative rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === "eval"
                      ? "bg-[color:var(--primary)] text-white shadow-md"
                      : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  {activeTab === "eval" && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                  )}
                  <span className="relative">학생 평가차트</span>
                </button>
                <button
                  onClick={() => setActiveTab("mock")}
                  className={`relative rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === "mock"
                      ? "bg-[color:var(--primary)] text-white shadow-md"
                      : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  {activeTab === "mock" && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                  )}
                  <span className="relative">모의고사 영상</span>
                </button>
              </div>
            </nav>

            {/* 모의고사 영상 탭 */}
            {activeTab === "mock" && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                  <h2 className="text-xl font-bold">모의고사 영상</h2>
                  
                  {/* 보안 경고 */}
                  <div className="mt-4 rounded-xl border-2 border-red-400 bg-red-100 p-4 dark:border-red-800 dark:bg-red-950/40">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        <IconWarning className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">보안 안내</p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          본 모의고사 영상은 <strong>학원생 및 보호자 전용</strong>입니다.
                          영상의 외부 공유 및 유출은 <strong>보안상 엄격히 금지</strong>됩니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  {(data as StudentPageData).mockTests.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/50 py-12">
                      <div className="text-4xl opacity-30">
                        <IconVideo className="h-10 w-10" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-muted">등록된 모의고사 영상이 없습니다</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-6">
                      {(data as StudentPageData).mockTests.map((m) => {
                        const id = extractYouTubeId(m.youtubeUrl);
                        return (
                          <div
                            key={m.id}
                            className="group rounded-2xl border border-border bg-background p-5 transition-all hover:border-[color:var(--primary)] hover:shadow-lg"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1">
                                {/* 그룹 정보 배지 */}
                                {m.groupYear && (
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
                                      {m.groupYear}년 {m.groupSession}차 모의고사
                                    </span>
                                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                                      {m.groupMajor}
                                    </span>
                                    {m.groupExamDate && (
                                      <span className="text-xs text-muted">
                                        시행일: {new Date(m.groupExamDate).toLocaleDateString("ko-KR")}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <h3 className="text-lg font-semibold group-hover:text-[color:var(--primary)]">
                                  {m.songTitle} - {m.artist}
                                </h3>
                                <a
                                  className="mt-1 inline-flex items-center gap-1 text-sm text-[color:var(--primary)] hover:underline"
                                  href={m.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span>YouTube에서 보기</span>
                                  <span>↗</span>
                                </a>
                              </div>
                              <div className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                                등록: {m.createdAt.slice(0, 10)}
                              </div>
                            </div>
                            {id ? (
                              <div className="mt-4 overflow-hidden rounded-xl border border-border shadow-sm">
                                <iframe
                                  className="aspect-video w-full"
                                  src={`https://www.youtube.com/embed/${id}`}
                                  title={`${m.songTitle} - ${m.artist}`}
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
                </div>
              </section>
            )}

            {/* 학생 평가차트 탭 */}
            {activeTab === "eval" && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                  <h2 className="text-xl font-bold">학생 평가차트</h2>
                  {(data as StudentPageData).evaluations.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/50 py-12">
                      <div className="text-4xl opacity-30">📝</div>
                      <p className="mt-4 text-sm font-medium text-muted">등록된 평가가 없습니다</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {(data as StudentPageData).evaluations.map((e) => (
                        <div
                          key={e.id}
                          className="group rounded-2xl border border-border bg-background p-5 transition-all hover:border-[color:var(--primary)] hover:shadow-lg"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="rounded-full bg-[color:var(--primary)]/10 px-3 py-1 font-semibold text-[color:var(--primary)]">
                                {e.evalDate}
                              </span>
                              <span className="rounded-full bg-surface px-3 py-1 font-medium text-muted">
                                {e.subjectLabel}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted">
                            작성자: <span className="font-medium text-foreground">{e.teacherName} 선생님</span>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {e.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
