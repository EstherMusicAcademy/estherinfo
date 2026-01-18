export type AttendanceStatus = "출석" | "지각" | "무단결석" | "병결" | "기타결석";

export type StudentAttendance = {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  reason?: string; // 기타결석일 경우 사유 입력
};

export type WorkLog = {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  schedule: string; // 오늘 레슨 시간표 (서술형)
  notes: string; // 오늘 레슨 특이사항
  students: StudentAttendance[]; // 레슨한 학생 + 출석 여부
  createdAt: string;
  updatedAt?: string;
};

type Store = { workLogs: WorkLog[] };

function seed(): WorkLog[] {
  const now = new Date().toISOString();
  return [
    {
      id: "wl-1",
      teacherId: "t-1",
      teacherName: "손서율",
      date: "2026-01-15",
      schedule: "14:00-15:00 김민준 보컬 레슨\n15:00-16:00 이서준 피아노 레슨",
      notes: "김민준 학생 고음 발성 많이 개선됨. 다음 주 모의고사 준비 필요.",
      students: [
        { studentId: "s-1", studentName: "김민준", status: "출석" },
        { studentId: "s-2", studentName: "이서준", status: "지각" },
      ],
      createdAt: now,
    },
    {
      id: "wl-2",
      teacherId: "t-1",
      teacherName: "손서율",
      date: "2026-01-16",
      schedule: "14:00-15:00 이서준 피아노 레슨\n16:00-17:00 박하은 기타 레슨",
      notes: "이서준 학생 15분 지각. 박하은 학생 코드 전환 연습 집중.",
      students: [
        { studentId: "s-2", studentName: "이서준", status: "출석" },
        { studentId: "s-3", studentName: "박하은", status: "출석" },
      ],
      createdAt: now,
    },
    {
      id: "wl-3",
      teacherId: "t-2",
      teacherName: "김지훈",
      date: "2026-01-16",
      schedule: "13:00-14:00 최서윤 드럼 레슨\n14:00-15:00 정예은 베이스 레슨",
      notes: "최서윤 학생 결석으로 다음 주 보강 예정.",
      students: [
        { studentId: "s-4", studentName: "최서윤", status: "무단결석" },
        { studentId: "s-5", studentName: "정예은", status: "출석" },
      ],
      createdAt: now,
    },
  ];
}

const store: Store = { workLogs: seed() };

export function listWorkLogs(filter?: { startDate?: string; endDate?: string }) {
  let result = store.workLogs;
  if (filter?.startDate) {
    result = result.filter((w) => w.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    result = result.filter((w) => w.date <= filter.endDate!);
  }
  return result.sort((a, b) => b.date.localeCompare(a.date));
}

export function getWorkLog(id: string) {
  return store.workLogs.find((w) => w.id === id);
}

export function createWorkLog(data: {
  teacherId: string;
  teacherName: string;
  date: string;
  schedule: string;
  notes: string;
  students: StudentAttendance[];
}) {
  if (!data.teacherId || !data.teacherName || !data.date) {
    throw new Error("필수 필드 누락");
  }
  
  const now = new Date().toISOString();
  const workLog: WorkLog = {
    id: `wl-${Date.now()}`,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    date: data.date,
    schedule: data.schedule || "",
    notes: data.notes || "",
    students: data.students || [],
    createdAt: now,
  };
  
  store.workLogs.push(workLog);
  return workLog;
}

export function updateWorkLog(id: string, data: Partial<Pick<WorkLog, "date" | "schedule" | "notes" | "students">>) {
  const workLog = store.workLogs.find((w) => w.id === id);
  if (!workLog) {
    throw new Error("업무일지를 찾을 수 없습니다");
  }
  
  if (data.date !== undefined) workLog.date = data.date;
  if (data.schedule !== undefined) workLog.schedule = data.schedule;
  if (data.notes !== undefined) workLog.notes = data.notes;
  if (data.students !== undefined) workLog.students = data.students;
  workLog.updatedAt = new Date().toISOString();
  
  return workLog;
}

export function deleteWorkLog(id: string) {
  const idx = store.workLogs.findIndex((w) => w.id === id);
  if (idx === -1) {
    throw new Error("업무일지를 찾을 수 없습니다");
  }
  store.workLogs.splice(idx, 1);
}
