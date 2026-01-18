"use client";

import { useEffect, useState, useMemo } from "react";
import { useRole } from "@/components/role/RoleProvider";
import { extractYouTubeId, formatKoreanAge } from "@/lib/utils";

type Student = {
  id: string;
  name: string;
  birthYear: number;
  major?: string;
};

type Subject = {
  id: string;
  label: string;
  isMajor: boolean;
};

type Evaluation = {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  subjectLabel: string;
  evalDate: string;
  content: string;
  createdAt: string;
};

type MockTestGroup = {
  id: string;
  year: number;
  session: number;
  major: string;
  examDate?: string;
};

type MockTest = {
  id: string;
  groupId: string;
  songTitle: string;
  artist?: string;
  youtubeUrl: string;
  createdAt: string;
  group?: MockTestGroup;
};

type Teacher = {
  id: string;
  displayName: string;
  major?: string;
};

type ShareLink = {
  id: string;
  studentId: string;
  shareToken: string;
  expiresAt: string | null;
  isRevoked: boolean;
  viewCount: number;
  createdAt: string;
};

export default function StudentManagementPage() {
  const { role, teacherId, teacherName } = useRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"eval" | "mock">("eval");
  
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  
  // 활성 공유 링크가 있는 학생 ID 목록 (관리자 전용)
  const [activeShareStudentIds, setActiveShareStudentIds] = useState<string[]>([]);
  
  // 공유 링크 토글 상태
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareExpiryOption, setShareExpiryOption] = useState<"3" | "5" | "7" | "custom" | "never">("7");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  
  // 평가 작성 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: "",
    evalDate: new Date().toISOString().slice(0, 10),
    content: "",
    selectedTeacherId: "", // 관리자가 선생님 선택용
    selectedTeacherName: "", // 관리자가 선생님 선택용
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 관리자용 평가 수정/삭제 상태
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [editFormData, setEditFormData] = useState({
    subjectId: "",
    evalDate: "",
    content: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // 검색된 학생 목록
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.major && s.major.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  useEffect(() => {
    if (role !== "teacher" && role !== "admin") return;
    fetchData();
  }, [role, teacherId]);

  async function fetchData() {
    try {
      setLoading(true);
      // 관리자는 모든 학생, 선생님은 담당 학생만
      const requests: Promise<Response>[] = [
        fetch(role === "admin" ? "/api/students" : `/api/teacher/students?teacherId=${teacherId}`),
        fetch("/api/subjects"),
      ];
      
      // 관리자일 경우 선생님 목록과 활성 공유 링크 목록도 가져옴
      if (role === "admin") {
        requests.push(fetch("/api/teachers"));
        requests.push(fetch("/api/share-links?activeOnly=true"));
      }
      
      const responses = await Promise.all(requests);
      const studentsData = await responses[0].json();
      const subjectsData = await responses[1].json();
      
      setStudents(studentsData?.students || studentsData || []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []));
      
      if (role === "admin") {
        if (responses[2]) {
          const teachersData = await responses[2].json();
          setTeachers(teachersData?.teachers || teachersData || []);
        }
        if (responses[3]) {
          const shareData = await responses[3].json();
          setActiveShareStudentIds(shareData?.activeStudentIds || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvaluations(studentId: string) {
    try {
      const res = await fetch(`/api/students/${studentId}/evaluations`);
      const data = await res.json();
      setEvaluations(Array.isArray(data) ? data : (data?.evaluations || []));
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  }

  async function fetchShareLinks(studentId: string) {
    try {
      setShareLoading(true);
      const res = await fetch(`/api/share-links/${studentId}`);
      const data = await res.json();
      setShareLinks(data?.links || []);
    } catch (error) {
      console.error("Error fetching share links:", error);
    } finally {
      setShareLoading(false);
    }
  }

  // 활성 공유 링크 목록 새로고침
  async function refreshActiveShareLinks() {
    if (role !== "admin") return;
    try {
      const res = await fetch("/api/share-links?activeOnly=true");
      const data = await res.json();
      setActiveShareStudentIds(data?.activeStudentIds || []);
    } catch (error) {
      console.error("Error refreshing active share links:", error);
    }
  }

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setShowForm(false);
    setShowSharePanel(false);
    setActiveTab("eval");
    setFormData({ 
      subjectId: "", 
      evalDate: new Date().toISOString().slice(0, 10), 
      content: "",
      selectedTeacherId: "",
      selectedTeacherName: "",
    });
    fetchEvaluations(student.id);
    fetchMockTests(student.id);
    if (role === "admin") {
      fetchShareLinks(student.id);
    }
  }

  async function fetchMockTests(studentId: string) {
    try {
      const res = await fetch(`/api/students/${studentId}/mock-tests`);
      const data = await res.json();
      const groupsMap = new Map((data?.groups || []).map((g: MockTestGroup) => [g.id, g]));
      setMockTests(
        (data?.mockTests || []).map((mt: MockTest) => ({
          ...mt,
          group: groupsMap.get(mt.groupId),
        }))
      );
    } catch (error) {
      console.error("Error fetching mock tests:", error);
    }
  }

  async function handleSubmitEvaluation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !formData.subjectId || !formData.content.trim()) return;
    
    // 관리자가 선생님을 선택하지 않은 경우 체크
    if (role === "admin" && !formData.selectedTeacherId) {
      alert("평가를 작성할 선생님을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedSubject = subjects.find((s) => s.id === formData.subjectId);
      
      // 관리자일 경우 선택한 선생님 정보 사용, 아니면 본인 정보 사용
      const evalTeacherId = role === "admin" ? formData.selectedTeacherId : teacherId;
      const evalTeacherName = role === "admin" ? formData.selectedTeacherName : teacherName;
      
      const res = await fetch(`/api/students/${selectedStudent.id}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          createdById: evalTeacherId,
          teacherName: evalTeacherName,
          subjectId: formData.subjectId,
          subjectLabel: selectedSubject?.label || "기타",
          evalDate: formData.evalDate,
          content: formData.content,
        }),
      });

      if (!res.ok) throw new Error("평가 저장 실패");

      // 성공 시 폼 초기화 및 목록 새로고침
      setFormData({ 
        subjectId: "", 
        evalDate: new Date().toISOString().slice(0, 10), 
        content: "",
        selectedTeacherId: "",
        selectedTeacherName: "",
      });
      setShowForm(false);
      fetchEvaluations(selectedStudent.id);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert("평가 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 관리자: 평가 수정 시작
  function startEditEvaluation(evaluation: Evaluation) {
    const subject = subjects.find((s) => s.label === evaluation.subjectLabel);
    setEditingEvaluation(evaluation);
    setEditFormData({
      subjectId: subject?.id || "",
      evalDate: evaluation.evalDate,
      content: evaluation.content,
    });
  }

  // 관리자: 평가 수정 제출
  async function handleUpdateEvaluation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvaluation || !editFormData.content.trim()) return;

    setSubmitting(true);
    try {
      const selectedSubject = subjects.find((s) => s.id === editFormData.subjectId);
      
      const res = await fetch(`/api/evaluations/${editingEvaluation.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-dev-role": role,
        },
        body: JSON.stringify({
          subjectId: editFormData.subjectId,
          evalDate: editFormData.evalDate,
          content: editFormData.content,
          teacherName: selectedSubject ? selectedSubject.label : editingEvaluation.subjectLabel,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "평가 수정 실패");
      }

      setEditingEvaluation(null);
      if (selectedStudent) fetchEvaluations(selectedStudent.id);
      alert("평가가 수정되었습니다.");
    } catch (error) {
      console.error("Error updating evaluation:", error);
      alert(error instanceof Error ? error.message : "평가 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 관리자: 평가 삭제
  async function handleDeleteEvaluation(evaluationId: string) {
    if (!confirm("정말로 이 평가를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/evaluations/${evaluationId}`, {
        method: "DELETE",
        headers: { 
          "x-dev-role": role,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "평가 삭제 실패");
      }

      if (selectedStudent) fetchEvaluations(selectedStudent.id);
      alert("평가가 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      alert(error instanceof Error ? error.message : "평가 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  // 공유 링크 생성
  async function handleCreateShareLink() {
    if (!selectedStudent) return;

    let expiresAt: string | null = null;
    
    if (shareExpiryOption !== "never") {
      if (shareExpiryOption === "custom" && customExpiryDate) {
        expiresAt = new Date(customExpiryDate).toISOString();
      } else {
        const days = parseInt(shareExpiryOption);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    try {
      setShareLoading(true);
      const res = await fetch(`/api/share-links/${selectedStudent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "링크 생성 실패");
      }

      await fetchShareLinks(selectedStudent.id);
      await refreshActiveShareLinks();
      alert("공유 링크가 생성되었습니다.");
    } catch (error) {
      console.error("Error creating share link:", error);
      alert(error instanceof Error ? error.message : "링크 생성에 실패했습니다.");
    } finally {
      setShareLoading(false);
    }
  }

  // 공유 링크 폐기
  async function handleRevokeShareLink(linkId: string) {
    if (!confirm("이 공유 링크를 폐기하시겠습니까? 더 이상 접근할 수 없게 됩니다.")) return;
    
    if (!selectedStudent) return;

    try {
      const res = await fetch(`/api/admin/share-links/${linkId}/revoke`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "링크 폐기 실패");
      }

      await fetchShareLinks(selectedStudent.id);
      await refreshActiveShareLinks();
    } catch (error) {
      console.error("Error revoking share link:", error);
      alert(error instanceof Error ? error.message : "링크 폐기에 실패했습니다.");
    }
  }

  function copyShareLink(token: string) {
    const url = `${window.location.origin}/public/student/${token}`;
    navigator.clipboard.writeText(url);
    alert("링크가 복사되었습니다.");
  }

  if (role !== "teacher" && role !== "admin") {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">선생님 또는 관리자만 학생 관리 페이지에 접근할 수 있습니다.</p>
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl">
        {/* Student List Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 flex-shrink-0 overflow-y-auto border-r border-border bg-surface p-6 lg:block">
          <h2 className="mb-4 text-lg font-semibold">
            학생 목록 <span className="text-sm font-normal text-muted">({filteredStudents.length}명)</span>
          </h2>
          
          {/* 검색 입력 */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름 또는 전공 검색..."
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
          </div>
          
          <div className="space-y-2">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">검색 결과가 없습니다.</p>
            ) : (
              filteredStudents.map((student) => {
                const isSharing = role === "admin" && activeShareStudentIds.includes(student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => selectStudent(student)}
                    className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
                      selectedStudent?.id === student.id
                        ? "bg-primary text-white"
                        : "bg-background hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.name}</span>
                      {isSharing && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          selectedStudent?.id === student.id 
                            ? "bg-white/20 text-white" 
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          공유중
                        </span>
                      )}
                    </div>
                    <div className="text-sm opacity-80">
                      {student.major || "전공 미정"} · {formatKoreanAge(student.birthYear)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h1 className="text-2xl font-bold">학생 관리</h1>
              <p className="mt-1 text-sm text-muted">
                {role === "admin" ? "전체" : "담당"} 학생 <span className="font-semibold text-foreground">{students.length}명</span>의 평가를 작성하고, 모의고사 영상을 확인할 수 있습니다.
              </p>
            </div>

            {/* Mobile Student Selector */}
            <div className="lg:hidden space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="학생 이름 또는 전공 검색..."
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm"
              />
              <select
                value={selectedStudent?.id || ""}
                onChange={(e) => {
                  const student = students.find((s) => s.id === e.target.value);
                  if (student) selectStudent(student);
                }}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="">학생 선택 ({filteredStudents.length}명)</option>
                {filteredStudents.map((student) => {
                  const isSharing = role === "admin" && activeShareStudentIds.includes(student.id);
                  return (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.major || "전공 미정"}) - {formatKoreanAge(student.birthYear)}{isSharing ? " (공유중)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Student Detail & Evaluations */}
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Student Info with Share Toggle (Admin Only) */}
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedStudent.name}</h2>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                        <span>전공: {selectedStudent.major || "미정"}</span>
                        <span>나이: {formatKoreanAge(selectedStudent.birthYear)}</span>
                      </div>
                    </div>
                    
                    {/* 관리자 전용: 공유 버튼 (토글) */}
                    {role === "admin" && (
                      <button
                        onClick={() => setShowSharePanel(!showSharePanel)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          showSharePanel
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "border border-border bg-surface hover:bg-muted/20"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        공유
                      </button>
                    )}
                  </div>
                  
                  {/* 공유 패널 (노션 스타일 토글) */}
                  {role === "admin" && showSharePanel && (
                    <div className="mt-4 border-t border-border pt-4">
                      <h3 className="text-sm font-semibold mb-3">피드백 공유 링크</h3>
                      
                      {/* 새 링크 생성 */}
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="text-sm font-medium mb-2">새 공유 링크 생성</div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-sm text-muted">만료 기간:</span>
                          {(["3", "5", "7"] as const).map((d) => (
                            <button
                              key={d}
                              onClick={() => setShareExpiryOption(d)}
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                shareExpiryOption === d
                                  ? "bg-blue-600 text-white"
                                  : "bg-surface border border-border hover:bg-muted/20"
                              }`}
                            >
                              {d}일
                            </button>
                          ))}
                          <button
                            onClick={() => setShareExpiryOption("never")}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              shareExpiryOption === "never"
                                ? "bg-blue-600 text-white"
                                : "bg-surface border border-border hover:bg-muted/20"
                            }`}
                          >
                            무기한
                          </button>
                          <button
                            onClick={() => setShareExpiryOption("custom")}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              shareExpiryOption === "custom"
                                ? "bg-blue-600 text-white"
                                : "bg-surface border border-border hover:bg-muted/20"
                            }`}
                          >
                            직접 설정
                          </button>
                        </div>
                        
                        {shareExpiryOption === "custom" && (
                          <div className="mb-3">
                            <input
                              type="date"
                              value={customExpiryDate}
                              onChange={(e) => setCustomExpiryDate(e.target.value)}
                              min={new Date().toISOString().slice(0, 10)}
                              className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
                            />
                          </div>
                        )}
                        
                        <button
                          onClick={handleCreateShareLink}
                          disabled={shareLoading || (shareExpiryOption === "custom" && !customExpiryDate)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {shareLoading ? "생성 중..." : "링크 생성"}
                        </button>
                      </div>
                      
                      {/* 기존 링크 목록 */}
                      {shareLinks.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted">활성 링크</div>
                          {shareLinks
                            .filter((l) => !l.isRevoked)
                            .map((link) => {
                              const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                              return (
                                <div
                                  key={link.id}
                                  className={`p-3 rounded-lg border ${
                                    isExpired
                                      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                                      : "border-border bg-background"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-mono truncate text-muted">
                                        ...{link.shareToken.slice(-12)}
                                      </div>
                                      <div className="text-xs text-muted mt-1">
                                        {link.expiresAt
                                          ? isExpired
                                            ? "만료됨"
                                            : `만료: ${new Date(link.expiresAt).toLocaleDateString("ko-KR")}`
                                          : "무기한"}
                                        {" · "}조회 {link.viewCount}회
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => copyShareLink(link.shareToken)}
                                        className="px-2 py-1 text-xs bg-surface border border-border rounded hover:bg-muted/20"
                                      >
                                        복사
                                      </button>
                                      <button
                                        onClick={() => handleRevokeShareLink(link.id)}
                                        className="px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800"
                                      >
                                        폐기
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">아직 생성된 공유 링크가 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex gap-2 rounded-xl bg-surface p-1 border border-border">
                  <button
                    onClick={() => setActiveTab("eval")}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "eval" ? "bg-primary text-white" : "hover:bg-muted/20"
                    }`}
                  >
                    학생 평가 차트
                  </button>
                  <button
                    onClick={() => setActiveTab("mock")}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "mock" ? "bg-primary text-white" : "hover:bg-muted/20"
                    }`}
                  >
                    모의고사 영상 ({mockTests.length})
                  </button>
                </div>

                {/* 모의고사 영상 탭 */}
                {activeTab === "mock" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">모의고사 영상</h3>
                    {mockTests.length === 0 ? (
                      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                        <p className="text-muted">등록된 모의고사 영상이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {mockTests.map((mt) => (
                          <div key={mt.id} className="rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
                            {mt.group && (
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                                <span className="font-semibold text-foreground">
                                  {mt.group.year}년 {mt.group.session}차 모의고사
                                </span>
                                <span className="rounded-full bg-muted/20 px-2 py-0.5">
                                  {mt.group.major}
                                </span>
                                {mt.group.examDate && (
                                  <span className="text-muted">
                                    (시행일: {mt.group.examDate})
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                              <iframe
                                src={`https://www.youtube.com/embed/${extractYouTubeId(mt.youtubeUrl)}`}
                                className="h-full w-full"
                                allowFullScreen
                              />
                            </div>
                            <div className="mt-3">
                              <h4 className="font-medium">{mt.songTitle}</h4>
                              {mt.artist && <p className="text-sm text-muted">{mt.artist}</p>}
                              <p className="mt-1 text-xs text-muted">
                                {new Date(mt.createdAt).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 평가 탭 */}
                {activeTab === "eval" && (
                  <>
                    {/* 평가 작성 버튼 */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        {showForm ? "작성 취소" : "새 평가 작성"}
                      </button>
                    </div>

                    {/* 평가 작성 폼 */}
                    {showForm && (
                      <form onSubmit={handleSubmitEvaluation} className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4">
                        <h3 className="text-lg font-semibold">평가 작성</h3>
                        
                        {/* 관리자 전용: 선생님 선택 */}
                        {role === "admin" && (
                          <div className="rounded-lg border-2 border-amber-500 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-950/40">
                            <label className="mb-2 block text-sm font-medium text-amber-900 dark:text-amber-100">
                              작성 선생님 선택 * <span className="font-normal">(관리자 전용)</span>
                            </label>
                            <select
                              value={formData.selectedTeacherId}
                              onChange={(e) => {
                                const teacher = teachers.find((t) => t.id === e.target.value);
                                setFormData({ 
                                  ...formData, 
                                  selectedTeacherId: e.target.value,
                                  selectedTeacherName: teacher?.displayName || "",
                                });
                              }}
                              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                              required
                            >
                              <option value="">선생님 선택</option>
                              {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.displayName} {teacher.major ? `(${teacher.major})` : ""}
                                </option>
                              ))}
                            </select>
                            <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                              선택한 선생님이 작성한 것처럼 평가가 기록됩니다.
                            </p>
                          </div>
                        )}
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium">수업 과목 *</label>
                            <select
                              value={formData.subjectId}
                              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                              required
                            >
                              <option value="">과목 선택</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.label} {subject.isMajor ? "(전공)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium">평가 날짜 *</label>
                            <input
                              type="date"
                              value={formData.evalDate}
                              onChange={(e) => setFormData({ ...formData, evalDate: e.target.value })}
                              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium">평가 내용 *</label>
                          <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="학생의 수업 진행 상황, 발전 사항, 개선점 등을 작성해주세요."
                            rows={5}
                            className="w-full rounded-lg border border-border bg-surface p-3 text-sm resize-none"
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/20"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || !formData.subjectId || !formData.content.trim()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                          >
                            {submitting ? "저장 중..." : "평가 저장"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Evaluations */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">학생 평가 차트</h3>
                      {evaluations.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                          <p className="text-muted">아직 작성된 평가가 없습니다.</p>
                          <p className="mt-2 text-sm text-muted">
                            위의 &quot;새 평가 작성&quot; 버튼을 눌러 평가를 작성해주세요.
                          </p>
                        </div>
                      ) : (
                        evaluations
                          .sort((a, b) => new Date(b.evalDate).getTime() - new Date(a.evalDate).getTime())
                          .map((evaluation) => (
                            <div
                              key={evaluation.id}
                              className="rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-md"
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                      {evaluation.subjectLabel}
                                    </span>
                                    <span className="text-sm text-muted">
                                      {new Date(evaluation.evalDate).toLocaleDateString("ko-KR")}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-sm text-muted">
                                    작성자: <span className="font-medium text-foreground">{evaluation.teacherName}</span> 선생님
                                  </div>
                                </div>
                                {/* 관리자 전용: 수정/삭제 버튼 */}
                                {role === "admin" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditEvaluation(evaluation)}
                                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/20"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEvaluation(evaluation.id)}
                                      disabled={isDeleting}
                                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/50"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{evaluation.content}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="text-muted">학생을 선택하여 평가를 확인하세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 관리자 전용: 평가 수정 모달 */}
      {editingEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">평가 수정 (관리자 전용)</h3>
            
            <div className="mb-4 rounded-lg bg-amber-100 border-2 border-amber-500 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100">
              <strong>주의:</strong> 관리자 권한으로 평가를 수정하고 있습니다.
            </div>
            
            <form onSubmit={handleUpdateEvaluation} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">작성자</label>
                <input
                  type="text"
                  value={editingEvaluation.teacherName + " 선생님"}
                  disabled
                  className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm"
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">수업 과목 *</label>
                  <select
                    value={editFormData.subjectId}
                    onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                    required
                  >
                    <option value="">과목 선택</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.label} {subject.isMajor ? "(전공)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">평가 날짜 *</label>
                  <input
                    type="date"
                    value={editFormData.evalDate}
                    onChange={(e) => setEditFormData({ ...editFormData, evalDate: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">평가 내용 *</label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  placeholder="학생의 수업 진행 상황, 발전 사항, 개선점 등을 작성해주세요."
                  rows={5}
                  className="w-full rounded-lg border border-border bg-surface p-3 text-sm resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvaluation(null)}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/20"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !editFormData.content.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "저장 중..." : "수정 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
