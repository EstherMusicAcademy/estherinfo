export type Student = {
  id: string;
  name: string;
  birthYear: number;
  major?: string;
  sharedMemo?: string; // 선생님과 공유되는 메모
  adminMemo?: string; // 관리자 전용 메모
  createdAt: string;
  updatedAt: string;
};

export type TeacherStudent = {
  teacherId: string;
  studentId: string;
  subjectType: "major" | "theory" | "other"; // 전공수업, 이론수업, 기타
  subjectLabel?: string; // 과목명 (예: 보컬, 화성학)
  assignedAt: string;
};

type Store = {
  students: Student[];
  teacherStudents: TeacherStudent[];
};

function seed(): Store {
  const now = new Date().toISOString();
  return {
    students: [
      {
        id: "s-1",
        name: "김민준",
        birthYear: 2008,
        major: "보컬",
        sharedMemo: "수업 후 과제: 발성 연결 연습 10분.",
        adminMemo: "등록 서류 확인 완료.",
        createdAt: now,
        updatedAt: now,
      },
      { id: "s-2", name: "이서연", birthYear: 2006, major: "피아노", createdAt: now, updatedAt: now },
      { id: "s-3", name: "박지후", birthYear: 2007, major: "작곡", createdAt: now, updatedAt: now },
    ],
    teacherStudents: [
      { teacherId: "t-1", studentId: "s-1", subjectType: "major", subjectLabel: "보컬", assignedAt: now },
      { teacherId: "t-3", studentId: "s-1", subjectType: "theory", subjectLabel: "화성학", assignedAt: now },
    ],
  };
}

function getStore(): Store {
  const g = globalThis as unknown as { __estherStudentStore?: Store };
  if (!g.__estherStudentStore) g.__estherStudentStore = seed();
  return g.__estherStudentStore;
}

export function listStudents(): Student[] {
  return [...getStore().students].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function getStudentById(id: string) {
  return getStore().students.find((s) => s.id === id) ?? null;
}

export function createStudent(input: { name: string; birthYear: number; major?: string }): Student {
  const store = getStore();
  const name = input.name.trim();
  if (!name) throw new Error("학생 이름을 입력해주세요.");
  if (!Number.isFinite(input.birthYear) || input.birthYear < 1900 || input.birthYear > 2100) {
    throw new Error("출생년도를 확인해주세요.");
  }
  const now = new Date().toISOString();
  const student: Student = {
    id: `s-${Date.now()}`,
    name,
    birthYear: input.birthYear,
    major: input.major?.trim() || undefined,
    sharedMemo: "",
    adminMemo: "",
    createdAt: now,
    updatedAt: now,
  };
  store.students.unshift(student);
  return student;
}

export function updateStudent(
  id: string,
  patch: Partial<Pick<Student, "name" | "birthYear" | "major" | "sharedMemo" | "adminMemo">>,
): Student {
  const store = getStore();
  const idx = store.students.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("학생을 찾을 수 없습니다.");
  const current = store.students[idx];
  const nextName = patch.name !== undefined ? patch.name.trim() : current.name;
  if (!nextName) throw new Error("학생 이름을 입력해주세요.");
  const nextBirthYear = patch.birthYear !== undefined ? patch.birthYear : current.birthYear;
  if (!Number.isFinite(nextBirthYear) || nextBirthYear < 1900 || nextBirthYear > 2100) {
    throw new Error("출생년도를 확인해주세요.");
  }
  const next: Student = {
    ...current,
    ...patch,
    name: nextName,
    birthYear: nextBirthYear,
    major: patch.major !== undefined ? patch.major.trim() || undefined : current.major,
    sharedMemo: patch.sharedMemo !== undefined ? patch.sharedMemo : current.sharedMemo,
    adminMemo: patch.adminMemo !== undefined ? patch.adminMemo : current.adminMemo,
    updatedAt: new Date().toISOString(),
  };
  store.students[idx] = next;
  return next;
}

export function listAssignments(): TeacherStudent[] {
  return [...getStore().teacherStudents];
}

export function assignStudent(teacherId: string, studentId: string, subjectType: "major" | "theory" | "other" = "major", subjectLabel?: string) {
  const store = getStore();
  if (!teacherId || !studentId) throw new Error("teacherId/studentId가 필요합니다.");
  if (store.teacherStudents.some((ts) => ts.teacherId === teacherId && ts.studentId === studentId)) {
    return;
  }
  store.teacherStudents.push({ teacherId, studentId, subjectType, subjectLabel, assignedAt: new Date().toISOString() });
}

export function unassignStudent(teacherId: string, studentId: string) {
  const store = getStore();
  store.teacherStudents = store.teacherStudents.filter(
    (ts) => !(ts.teacherId === teacherId && ts.studentId === studentId),
  );
}

export function listStudentsForTeacher(teacherId: string): Student[] {
  const store = getStore();
  const ids = new Set(store.teacherStudents.filter((ts) => ts.teacherId === teacherId).map((ts) => ts.studentId));
  return store.students.filter((s) => ids.has(s.id)).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function listTeacherIdsForStudent(studentId: string): string[] {
  const store = getStore();
  return store.teacherStudents
    .filter((ts) => ts.studentId === studentId)
    .map((ts) => ts.teacherId);
}

export function listAssignmentsForStudent(studentId: string): TeacherStudent[] {
  const store = getStore();
  return store.teacherStudents.filter((ts) => ts.studentId === studentId);
}