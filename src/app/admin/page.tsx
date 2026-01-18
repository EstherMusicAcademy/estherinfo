"use client";

import { useState, useEffect } from "react";
import { SubjectManager } from "@/components/SubjectManager";
import { AdminTeacherStudentManager } from "@/components/AdminTeacherStudentManager";
import { AdminStudentManager } from "@/components/AdminStudentManager";
import { AdminAsTeacherPanel } from "@/components/AdminAsTeacherPanel";
import { useRole } from "@/components/role/RoleProvider";
import { IconLightbulb } from "@/components/icons/UiIcons";

type Tab = "teacher" | "student" | "subject" | "studentApproval";

type StudentUser = {
  id: string;
  email: string;
  displayName: string;
  major: string;
  role: string;
  isActive: boolean;
  birthYear?: number;
  phone?: string;
  createdAt: string;
};

function calcKoreanAge(birthYear?: number): string {
  if (!birthYear) return "-";
  const currentYear = new Date().getFullYear();
  return `${currentYear - birthYear + 1}세`;
}

function roleLabel(role: string): string {
  if (role === "student_pending") return "승인 대기";
  if (role === "student") return "일반 학생";
  if (role === "student_vip") return "깍두기";
  return role;
}

function roleBadgeClass(role: string): string {
  if (role === "student_pending") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (role === "student_vip") return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
}

function StudentApprovalSection() {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [pendingStudents, setPendingStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "all">("pending");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([
        fetch("/api/student-users"),
        fetch("/api/student-users/pending"),
      ]);
      const allData = await allRes.json();
      const pendingData = await pendingRes.json();
      setStudents(allData.students || []);
      setPendingStudents(pendingData.students || []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleApprove = async (studentId: string) => {
    if (!confirm("이 학생의 가입을 승인하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/student-users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        await fetchData();
        alert("승인되었습니다.");
      } else {
        const data = await res.json();
        alert(data.error || "승인 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const handleSetVip = async (studentId: string, isVip: boolean) => {
    const action = isVip ? "setVip" : "removeVip";
    const message = isVip ? "깍두기로 설정하시겠습니까?" : "일반 학생으로 변경하시겠습니까?";
    if (!confirm(message)) return;
    try {
      const res = await fetch(`/api/student-users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchData();
        alert("변경되었습니다.");
      } else {
        const data = await res.json();
        alert(data.error || "변경 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const handleReject = async (studentId: string) => {
    if (!confirm("이 학생의 가입 요청을 거절(삭제)하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/student-users/${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
        alert("거절(삭제)되었습니다.");
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const displayStudents = activeSubTab === "pending" ? pendingStudents : students;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-bold mb-2">학생 가입 승인 관리</h2>
        <p className="text-sm text-muted mb-4">학생들의 가입 요청을 승인하거나 깍두기 권한을 관리합니다.</p>

        {/* 서브 탭 */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveSubTab("pending")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "pending"
                ? "border-[color:var(--primary)] text-[color:var(--primary)]"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            승인 대기 ({pendingStudents.length})
          </button>
          <button
            onClick={() => setActiveSubTab("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "all"
                ? "border-[color:var(--primary)] text-[color:var(--primary)]"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            전체 학생 ({students.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-background rounded-xl" />
            ))}
          </div>
        ) : displayStudents.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-xl border border-border">
            <p className="text-muted">
              {activeSubTab === "pending" ? "승인 대기 중인 학생이 없습니다." : "등록된 학생이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayStudents.map((student) => (
              <div
                key={student.id}
                className="bg-background border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{student.displayName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass(student.role)}`}>
                      {roleLabel(student.role)}
                    </span>
                    {!student.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        비활성
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted space-x-3">
                    <span>전공: {student.major}</span>
                    <span>나이: {calcKoreanAge(student.birthYear)}</span>
                    {student.phone && <span>연락처: {student.phone}</span>}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    이메일: {student.email} | 가입일: {new Date(student.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {student.role === "student_pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(student.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(student.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        거절
                      </button>
                    </>
                  )}
                  {student.role === "student" && (
                    <button
                      onClick={() => handleSetVip(student.id, true)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      깍두기 설정
                    </button>
                  )}
                  {student.role === "student_vip" && (
                    <button
                      onClick={() => handleSetVip(student.id, false)}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      깍두기 해제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 카드 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h3 className="inline-flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300 mb-2">
            <IconLightbulb className="h-4 w-4" />
            깍두기 안내
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            깍두기 학생은 일반 학생보다 먼저 연습실을 예약할 수 있습니다.
            관리자가 설정한 일반 예약 오픈 시간 이전에도 예약이 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>("teacher");

  if (role !== "admin") {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">관리자 모드에서만 관리자 대시보드를 사용할 수 있습니다.</p>
          <p className="mt-2 text-sm text-muted">오른쪽 하단 "모드"에서 관리자로 전환하세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* 헤더 */}
        <header>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="mt-2 text-sm text-muted">
            교사 승인/학생 배정/과목 관리/공유 링크 발급
          </p>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="rounded-2xl border border-border bg-surface p-1.5 shadow-sm">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => setActiveTab("teacher")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === "teacher"
                  ? "bg-[color:var(--primary)] text-white shadow-md"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              교사 관리
            </button>
            <button
              onClick={() => setActiveTab("student")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === "student"
                  ? "bg-[color:var(--primary)] text-white shadow-md"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              학생 관리
            </button>
            <button
              onClick={() => setActiveTab("studentApproval")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === "studentApproval"
                  ? "bg-[color:var(--primary)] text-white shadow-md"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              학생 승인
            </button>
            <button
              onClick={() => setActiveTab("subject")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === "subject"
                  ? "bg-[color:var(--primary)] text-white shadow-md"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              과목 관리
            </button>
          </div>
        </nav>

        {/* 관리자 선생님 기능 */}
        <AdminAsTeacherPanel />

        {/* 탭 컨텐츠 */}
        <div>
          {activeTab === "teacher" && <AdminTeacherStudentManager />}
          {activeTab === "student" && <AdminStudentManager />}
          {activeTab === "studentApproval" && <StudentApprovalSection />}
          {activeTab === "subject" && <SubjectManager />}
        </div>
      </div>
    </main>
  );
}
