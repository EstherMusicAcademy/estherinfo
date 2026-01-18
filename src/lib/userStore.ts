// 교사/직원 역할
export type StaffRole = "master" | "admin" | "teacher" | "pending" | "staff";

// 학생 역할
export type StudentRole = "student_pending" | "student" | "student_vip"; // student_vip = 깍두기 (미리 예약 가능)

export type UserRole = StaffRole | StudentRole;

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  major: string; // 교사 전공(담당 분야) 또는 학생 전공
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // 학생 전용 필드
  birthYear?: number;
  phone?: string;
};

type Store = {
  users: AppUser[];
};

function seed(): AppUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: "u-master",
      email: "chaedamflow@gmail.com",
      displayName: "마스터",
      major: "",
      role: "master",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "u-admin",
      email: "voidindx@gmail.com",
      displayName: "관리자",
      major: "",
      role: "admin",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // demo teachers
    {
      id: "t-1",
      email: "teacher1@example.com",
      displayName: "손서율",
      major: "보컬",
      role: "teacher",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "t-2",
      email: "teacher2@example.com",
      displayName: "박성우",
      major: "작곡",
      role: "pending",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // demo students (학생 계정)
    {
      id: "stu-1",
      email: "student1@example.com",
      displayName: "김민준",
      major: "보컬",
      role: "student",
      isActive: true,
      createdAt: now,
      updatedAt: now,
      birthYear: 2008,
      phone: "010-1234-5678",
    },
    {
      id: "stu-2",
      email: "student2@example.com",
      displayName: "이서준",
      major: "피아노",
      role: "student_vip", // 깍두기 - 미리 예약 가능
      isActive: true,
      createdAt: now,
      updatedAt: now,
      birthYear: 2007,
      phone: "010-2345-6789",
    },
    {
      id: "stu-3",
      email: "student3@example.com",
      displayName: "박지호",
      major: "드럼",
      role: "student_pending", // 승인 대기
      isActive: true,
      createdAt: now,
      updatedAt: now,
      birthYear: 2009,
      phone: "010-3456-7890",
    },
  ];
}

function getStore(): Store {
  const g = globalThis as unknown as { __estherUserStore?: Store };
  if (!g.__estherUserStore) g.__estherUserStore = { users: seed() };
  return g.__estherUserStore;
}

export function listTeachers() {
  return getStore()
    .users.filter((u) => u.role === "teacher" || u.role === "pending")
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
}

export function getUserById(id: string) {
  return getStore().users.find((u) => u.id === id) ?? null;
}

export function listPendingTeachers() {
  return listTeachers().filter((u) => u.role === "pending");
}

export function listActiveTeachers() {
  return listTeachers().filter((u) => u.role === "teacher" && u.isActive);
}

export function approveTeacher(id: string) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("사용자를 찾을 수 없습니다.");
  const u = store.users[idx];
  if (u.role !== "pending") throw new Error("승인 대상이 아닙니다.");
  const next: AppUser = { ...u, role: "teacher", updatedAt: new Date().toISOString() };
  store.users[idx] = next;
  return next;
}

// === 학생 관련 함수 ===

export function listStudentUsers() {
  return getStore()
    .users.filter((u) => u.role === "student" || u.role === "student_vip" || u.role === "student_pending")
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
}

export function listPendingStudents() {
  return listStudentUsers().filter((u) => u.role === "student_pending");
}

export function listActiveStudents() {
  return listStudentUsers().filter((u) => (u.role === "student" || u.role === "student_vip") && u.isActive);
}

export function listVipStudents() {
  return listStudentUsers().filter((u) => u.role === "student_vip" && u.isActive);
}

export function approveStudent(id: string) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("사용자를 찾을 수 없습니다.");
  const u = store.users[idx];
  if (u.role !== "student_pending") throw new Error("승인 대상이 아닙니다.");
  const next: AppUser = { ...u, role: "student", updatedAt: new Date().toISOString() };
  store.users[idx] = next;
  return next;
}

export function setStudentVip(id: string, isVip: boolean) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("사용자를 찾을 수 없습니다.");
  const u = store.users[idx];
  if (u.role !== "student" && u.role !== "student_vip") throw new Error("학생이 아닙니다.");
  const next: AppUser = { ...u, role: isVip ? "student_vip" : "student", updatedAt: new Date().toISOString() };
  store.users[idx] = next;
  return next;
}export function createStudentUser(data: {
  email: string;
  displayName: string;
  major: string;
  birthYear?: number;
  phone?: string;
}) {
  const store = getStore();
  const now = new Date().toISOString();
  const newUser: AppUser = {
    id: `stu-${Date.now()}`,
    email: data.email,
    displayName: data.displayName,
    major: data.major,
    role: "student_pending",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    birthYear: data.birthYear,
    phone: data.phone,
  };
  store.users.push(newUser);
  return newUser;
}

export function updateUser(id: string, data: Partial<Pick<AppUser, "displayName" | "major" | "email" | "phone" | "birthYear" | "isActive" | "role">>) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("사용자를 찾을 수 없습니다.");
  const next: AppUser = {
    ...store.users[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  store.users[idx] = next;
  return next;
}

// 역할 확인 헬퍼 함수
export function isStudentRole(role: UserRole): boolean {
  return role === "student" || role === "student_vip" || role === "student_pending";
}

export function isStaffRole(role: UserRole): boolean {
  return role === "master" || role === "admin" || role === "teacher" || role === "pending" || role === "staff";
}

export function canAccessPracticeRoom(role: UserRole): boolean {
  return role === "student" || role === "student_vip" || role === "teacher" || role === "admin" || role === "master" || role === "staff";
}export function canReserveEarly(role: UserRole): boolean {
  // 선생님, 관리자, 깍두기 학생은 미리 예약 가능
  return role === "student_vip" || role === "teacher" || role === "admin" || role === "master" || role === "staff";
}
