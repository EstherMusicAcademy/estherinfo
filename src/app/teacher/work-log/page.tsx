"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/role/RoleProvider";

type AttendanceStatus = "출석" | "지각" | "무단결석" | "병결" | "기타결석";

type StudentAttendance = {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  reason?: string; // 기타결석일 경우 사유 입력
};

type WorkLog = {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  schedule: string;
  notes: string;
  students: StudentAttendance[];
  createdAt: string;
  updatedAt?: string;
};

type Student = { id: string; name: string; birthYear: number; major?: string };

export default function WorkLogPage() {
  const { role, teacherId } = useRole();
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingLog, setViewingLog] = useState<WorkLog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    schedule: "",
    notes: "",
    selectedStudents: [] as string[],
    attendanceStatus: {} as Record<string, AttendanceStatus>,
    attendanceReason: {} as Record<string, string>, // 기타결석 사유
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (role !== "teacher" && role !== "admin" && role !== "staff") return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, currentMonth]);

  async function fetchData() {
    try {
      setLoading(true);
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      const [workLogsRes, studentsRes] = await Promise.all([
        fetch(`/api/work-logs?startDate=${year}-${String(month).padStart(2, "0")}-01&endDate=${year}-${String(month).padStart(2, "0")}-31`),
        role === "teacher" || role === "admin" ? fetch(`/api/teacher/students?teacherId=${teacherId}`) : Promise.resolve({ json: () => [] }),
      ]);

      const workLogsData = await workLogsRes.json();
      const logs = workLogsData?.workLogs || workLogsData || [];
      setWorkLogs(Array.isArray(logs) ? logs : []);

      if (role === "teacher" || role === "admin") {
        const studentsData = await studentsRes.json();
        setMyStudents(studentsData?.students || studentsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setViewingLog(null);
    setIsEditing(true);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      schedule: "",
      notes: "",
      selectedStudents: [],
      attendanceStatus: {},
      attendanceReason: {},
    });
    setShowModal(true);
  }

  function openViewModal(log: WorkLog) {
    setViewingLog(log);
    setIsEditing(false);
    const attendanceStatus: Record<string, AttendanceStatus> = {};
    const attendanceReason: Record<string, string> = {};
    log.students.forEach((s) => {
      attendanceStatus[s.studentId] = s.status;
      if (s.reason) attendanceReason[s.studentId] = s.reason;
    });
    setFormData({
      date: log.date,
      schedule: log.schedule,
      notes: log.notes,
      selectedStudents: log.students.map((s) => s.studentId),
      attendanceStatus,
      attendanceReason,
    });
    setShowModal(true);
  }

  function startEditing() {
    setIsEditing(true);
  }

  function cancelEditing() {
    if (viewingLog) {
      // 수정 취소 시 원래 데이터로 복원
      const attendanceStatus: Record<string, AttendanceStatus> = {};
      const attendanceReason: Record<string, string> = {};
      viewingLog.students.forEach((s) => {
        attendanceStatus[s.studentId] = s.status;
        if (s.reason) attendanceReason[s.studentId] = s.reason;
      });
      setFormData({
        date: viewingLog.date,
        schedule: viewingLog.schedule,
        notes: viewingLog.notes,
        selectedStudents: viewingLog.students.map((s) => s.studentId),
        attendanceStatus,
        attendanceReason,
      });
      setIsEditing(false);
    } else {
      setShowModal(false);
    }
  }

  async function handleSubmit() {
    if (!formData.schedule.trim()) {
      alert("레슨 시간표를 입력해주세요.");
      return;
    }

    const students: StudentAttendance[] = formData.selectedStudents.map((sid) => {
      const student = myStudents.find((s) => s.id === sid);
      const status = formData.attendanceStatus[sid] || "출석";
      const result: StudentAttendance = {
        studentId: sid,
        studentName: student?.name || "",
        status,
      };
      // 기타결석인 경우 사유 추가
      if (status === "기타결석" && formData.attendanceReason[sid]) {
        result.reason = formData.attendanceReason[sid];
      }
      return result;
    });

    try {
      const url = viewingLog ? `/api/work-logs/${viewingLog.id}` : "/api/work-logs";
      const method = viewingLog ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacherId || "admin",
          date: formData.date,
          schedule: formData.schedule,
          notes: formData.notes,
          students,
        }),
      });

      if (res.ok) {
        await fetchData();
        setShowModal(false);
        setIsEditing(false);
        alert(viewingLog ? "업무일지가 수정되었습니다." : "업무일지가 등록되었습니다.");
      }
    } catch (error) {
      console.error("Error submitting work log:", error);
      alert("업무일지 저장에 실패했습니다.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/work-logs/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        alert("업무일지가 삭제되었습니다.");
      }
    } catch (error) {
      console.error("Error deleting work log:", error);
      alert("삭제에 실패했습니다.");
    }
  }

  function toggleStudent(studentId: string) {
    setFormData((prev) => {
      const selected = prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter((id) => id !== studentId)
        : [...prev.selectedStudents, studentId];
      return { ...prev, selectedStudents: selected };
    });
  }

  function setAttendanceStatus(studentId: string, status: AttendanceStatus) {
    setFormData((prev) => ({
      ...prev,
      attendanceStatus: { ...prev.attendanceStatus, [studentId]: status },
    }));
  }

  function setAttendanceReason(studentId: string, reason: string) {
    setFormData((prev) => ({
      ...prev,
      attendanceReason: { ...prev.attendanceReason, [studentId]: reason },
    }));
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  if (role !== "teacher" && role !== "admin" && role !== "staff") {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">선생님, 관리자, 직원만 업무일지를 사용할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  // 직원은 열람만 가능
  const canWrite = role === "teacher" || role === "admin";

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
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">업무일지</h1>
              <p className="mt-1 text-sm text-muted">
                레슨 일지 및 출석 관리
                {role === "staff" && <span className="ml-2 text-xs text-yellow-600">(열람 전용)</span>}
              </p>
            </div>
            {canWrite && (
              <button
                onClick={openCreateModal}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-6 font-medium text-white hover:bg-[color:var(--primary-hover)]"
              >
                일지 작성
              </button>
            )}
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <button onClick={previousMonth} className="rounded-lg px-4 py-2 hover:bg-background">
            ← 이전 달
          </button>
          <h2 className="text-lg font-semibold">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </h2>
          <button onClick={nextMonth} className="rounded-lg px-4 py-2 hover:bg-background">
            다음 달 →
          </button>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted">
            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const logsForDay = workLogs.filter((log) => log.date === dateStr);

              return (
                <div
                  key={day}
                  className="min-h-24 rounded-lg border border-border bg-background p-2 hover:bg-surface"
                >
                  <div className="mb-1 text-sm font-medium">{day}</div>
                  <div className="space-y-1">
                    {logsForDay.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => openViewModal(log)}
                        className="cursor-pointer rounded bg-primary/10 p-1 text-xs hover:bg-primary/20"
                      >
                        <div className="font-medium text-primary">{log.teacherName}</div>
                        {log.students.length > 0 && (
                          <div className="mt-0.5 text-muted">
                            {log.students.map((s) => {
                              const mark = s.status === "출석" ? "O" : s.status === "지각" ? "△" : s.status === "무단결석" ? "X" : s.status === "병결" ? "병" : "기";
                              return `${s.studentName}(${mark})`;
                            }).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {!viewingLog ? "일지 작성" : isEditing ? "일지 수정" : "업무일지"}
                  </h2>
                  {viewingLog && !isEditing && (
                    <div className="mt-1 space-y-0.5 text-sm text-muted">
                      <p>작성자: <span className="font-medium text-foreground">{viewingLog.teacherName}</span> 선생님</p>
                      <p>저장일시: {new Date(viewingLog.createdAt).toLocaleString("ko-KR")}</p>
                      {viewingLog.updatedAt && viewingLog.updatedAt !== viewingLog.createdAt && (
                        <p>수정일시: {new Date(viewingLog.updatedAt).toLocaleString("ko-KR")}</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setShowModal(false); setIsEditing(false); }}
                  className="rounded-lg px-3 py-1 hover:bg-background"
                >
                  ✕
                </button>
              </div>

              {/* 보기 모드 */}
              {viewingLog && !isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">날짜</label>
                    <p className="text-foreground">{viewingLog.date}</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">레슨 시간표</label>
                    <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm">
                      {viewingLog.schedule || "-"}
                    </p>
                  </div>

                  {viewingLog.students.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted">레슨 학생 출석</label>
                      <div className="space-y-2">
                        {viewingLog.students.map((s) => (
                          <div key={s.studentId} className="rounded-lg border border-border bg-background p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{s.studentName}</span>
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                s.status === "출석" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                s.status === "지각" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                s.status === "무단결석" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                s.status === "병결" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              }`}>
                                {s.status}
                              </span>
                            </div>
                            {s.status === "기타결석" && s.reason && (
                              <p className="mt-2 text-sm text-muted">사유: {s.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">특이사항</label>
                    <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm">
                      {viewingLog.notes || "-"}
                    </p>
                  </div>

                  {/* 보기 모드 버튼 */}
                  <div className="mt-6 flex gap-3">
                    {canWrite && (viewingLog.teacherId === teacherId || role === "admin") && (
                      <button
                        onClick={startEditing}
                        className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                      >
                        수정
                      </button>
                    )}
                    {canWrite && (viewingLog.teacherId === teacherId || role === "admin") && (
                      <button
                        onClick={() => {
                          handleDelete(viewingLog.id);
                          setShowModal(false);
                        }}
                        className="rounded-lg border border-red-500 bg-background px-4 py-2 font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        삭제
                      </button>
                    )}
                    <button
                      onClick={() => { setShowModal(false); setIsEditing(false); }}
                      className="rounded-lg border border-border bg-background px-4 py-2 font-medium hover:bg-surface"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : (
                /* 작성/수정 모드 */
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">날짜</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">오늘 레슨 시간표 (서술형)</label>
                      <textarea
                        value={formData.schedule}
                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                        placeholder="14:00-15:00 김민준 보컬 레슨&#10;15:00-16:00 이서준 피아노 레슨"
                        className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {(role === "teacher" || role === "admin") && myStudents.length > 0 && (
                      <div>
                        <label className="mb-2 block text-sm font-medium">레슨한 학생 선택 ({formData.selectedStudents.length}명 선택됨)</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {myStudents.map((student) => {
                            const isSelected = formData.selectedStudents.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => toggleStudent(student.id)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-surface border border-border text-foreground hover:bg-background hover:border-primary/50"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : "bg-muted"}`}></span>
                                {student.name}
                                <span className="text-xs opacity-75">({student.major || "미정"})</span>
                              </button>
                            );
                          })}
                        </div>
                        {/* 선택된 학생 출석 체크 */}
                        <div className="space-y-2">
                          {formData.selectedStudents.map((studentId) => {
                            const student = myStudents.find((s) => s.id === studentId);
                            if (!student) return null;
                            const isSelected = true;
                            return (
                              <div key={student.id} className="rounded-lg border border-border bg-background p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{student.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudent(student.id)}
                                    className="text-xs text-muted hover:text-red-500"
                                  >
                                    ✕ 제외
                                  </button>
                                </div>
                                {isSelected && (
                                  <div className="space-y-2">
                                    {/* 출석/지각 행 */}
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceStatus(student.id, "출석")}
                                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                                          formData.attendanceStatus[student.id] === "출석"
                                            ? "bg-green-500 text-white"
                                            : "border border-border bg-background hover:bg-surface"
                                        }`}
                                      >
                                        출석
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceStatus(student.id, "지각")}
                                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                                          formData.attendanceStatus[student.id] === "지각"
                                            ? "bg-yellow-500 text-white"
                                            : "border border-border bg-background hover:bg-surface"
                                        }`}
                                      >
                                        지각
                                      </button>
                                    </div>
                                    {/* 결석 행 */}
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceStatus(student.id, "무단결석")}
                                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                                          formData.attendanceStatus[student.id] === "무단결석"
                                            ? "bg-red-500 text-white"
                                            : "border border-border bg-background hover:bg-surface"
                                        }`}
                                      >
                                        무단결석
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceStatus(student.id, "병결")}
                                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                                          formData.attendanceStatus[student.id] === "병결"
                                            ? "bg-orange-500 text-white"
                                            : "border border-border bg-background hover:bg-surface"
                                        }`}
                                      >
                                        병결
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceStatus(student.id, "기타결석")}
                                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                                          formData.attendanceStatus[student.id] === "기타결석"
                                            ? "bg-purple-500 text-white"
                                            : "border border-border bg-background hover:bg-surface"
                                        }`}
                                      >
                                        기타결석
                                      </button>
                                    </div>
                                    {/* 기타결석 사유 입력 */}
                                    {formData.attendanceStatus[student.id] === "기타결석" && (
                                      <input
                                        type="text"
                                        placeholder="결석 사유를 입력하세요"
                                        value={formData.attendanceReason[student.id] || ""}
                                        onChange={(e) => setAttendanceReason(student.id, e.target.value)}
                                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium">오늘 레슨 특이사항</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="레슨 중 특별히 기록할 내용을 작성해주세요."
                        className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="rounded-lg border border-border bg-background px-4 py-2 font-medium hover:bg-surface"
                    >
                      취소
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
