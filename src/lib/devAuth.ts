export type AuthRole = "teacher" | "staff" | "admin" | "student" | "student_pending";

export type AuthUser = {
  id: string;
  role: AuthRole;
  name: string;
  email: string;
  password: string; // dev-only (plain)
  majorSubjectId?: string; // teacher or student
  birthYear?: number; // student only
  phone?: string;
  status: "active" | "pending";
  createdAt: string;
};

type Store = {
  users: AuthUser[];
  // “인증형” 코드(개발용: 실제 발송 대신 화면에 노출)
  emailChange?: { userId: string; newEmail: string; code: string; expiresAt: number };
  passwordReset?: { email: string; code: string; expiresAt: number };
};

const USERS_KEY = "dev-auth-users";
const SESSION_KEY = "dev-auth-session-userId";

function nowIso() {
  return new Date().toISOString();
}

function randCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function loadUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuthUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStore(): Store {
  const g = globalThis as unknown as { __devAuthStore?: Store };
  if (!g.__devAuthStore) {
    g.__devAuthStore = { users: [] };
  }
  return g.__devAuthStore;
}

export function initDevAuthStore() {
  const store = getStore();
  // localStorage → memory sync (client only)
  store.users = loadUsers();

  // seed admin if empty
  if (store.users.length === 0) {
    store.users = [
      {
        id: "admin-1",
        role: "admin",
        name: "관리자",
        email: "voidindx@gmail.com",
        password: "admin1234!",
        status: "active",
        createdAt: nowIso(),
      },
    ];
    saveUsers(store.users);
  }
}

export function getCurrentUser(): AuthUser | null {
  const store = getStore();
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  return store.users.find((u) => u.id === userId) ?? null;
}

export function login(email: string, password: string): AuthUser {
  const store = getStore();
  const u = store.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) throw new Error("아이디(이메일)를 확인해주세요.");
  if (u.password !== password) throw new Error("비밀번호를 확인해주세요.");
  localStorage.setItem(SESSION_KEY, u.id);
  return u;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function signup(input: { 
  role: Exclude<AuthRole, "admin">; 
  name: string; 
  email: string; 
  password: string; 
  majorSubjectId?: string;
  birthYear?: number;
  phone?: string;
}): AuthUser {
  const store = getStore();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!name) throw new Error("실명을 입력해주세요.");
  if (!email || !email.includes("@")) throw new Error("이메일을 확인해주세요.");
  if (store.users.some((u) => u.email.toLowerCase() === email)) throw new Error("이미 가입된 이메일입니다.");
  if (!password || password.length < 6) throw new Error("비밀번호는 6자 이상으로 입력해주세요.");
  if (input.role === "teacher" && !input.majorSubjectId) throw new Error("전공(담당 분야)을 선택해주세요.");
  if ((input.role === "student" || input.role === "student_pending") && !input.majorSubjectId) throw new Error("전공을 선택해주세요.");
  if ((input.role === "student" || input.role === "student_pending") && !input.birthYear) throw new Error("출생년도를 입력해주세요.");

  // 학생 가입은 student_pending 상태로 시작
  const finalRole = (input.role === "student" || input.role === "student_pending") ? "student_pending" : input.role;

  const user: AuthUser = {
    id: `u-${Date.now()}`,
    role: finalRole,
    name,
    email,
    password,
    majorSubjectId: input.majorSubjectId,
    birthYear: input.birthYear,
    phone: input.phone,
    status: "pending",
    createdAt: nowIso(),
  };
  store.users.unshift(user);
  saveUsers(store.users);
  return user;
}

export function findIdByName(name: string) {
  const store = getStore();
  const n = name.trim();
  if (!n) throw new Error("이름을 입력해주세요.");
  const hits = store.users.filter((u) => u.name === n).map((u) => u.email);
  return hits.map((email) => {
    const [a, b] = email.split("@");
    const masked = a.length <= 2 ? `${a[0]}*` : `${a.slice(0, 2)}***`;
    return `${masked}@${b}`;
  });
}

export function requestPasswordReset(email: string) {
  const store = getStore();
  const e = email.trim().toLowerCase();
  const u = store.users.find((x) => x.email.toLowerCase() === e);
  if (!u) throw new Error("해당 이메일로 가입된 계정이 없습니다.");
  const code = randCode();
  store.passwordReset = { email: e, code, expiresAt: Date.now() + 10 * 60 * 1000 };
  return code;
}

export function confirmPasswordReset(email: string, code: string, newPassword: string) {
  const store = getStore();
  const e = email.trim().toLowerCase();
  if (!store.passwordReset || store.passwordReset.email !== e) throw new Error("비밀번호 재설정을 다시 요청해주세요.");
  if (Date.now() > store.passwordReset.expiresAt) throw new Error("인증 코드가 만료되었습니다.");
  if (store.passwordReset.code !== code.trim()) throw new Error("인증 코드가 올바르지 않습니다.");
  if (!newPassword || newPassword.length < 6) throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
  const idx = store.users.findIndex((u) => u.email.toLowerCase() === e);
  if (idx < 0) throw new Error("계정을 찾을 수 없습니다.");
  store.users[idx] = { ...store.users[idx], password: newPassword };
  saveUsers(store.users);
  store.passwordReset = undefined;
}

export function changePassword(userId: string, current: string, next: string) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("사용자를 찾을 수 없습니다.");
  if (store.users[idx].password !== current) throw new Error("현재 비밀번호가 올바르지 않습니다.");
  if (!next || next.length < 6) throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
  store.users[idx] = { ...store.users[idx], password: next };
  saveUsers(store.users);
}

export function requestEmailChange(userId: string, newEmail: string) {
  const store = getStore();
  const email = newEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("새 이메일을 확인해주세요.");
  if (store.users.some((u) => u.email.toLowerCase() === email)) throw new Error("이미 사용 중인 이메일입니다.");
  const code = randCode();
  store.emailChange = { userId, newEmail: email, code, expiresAt: Date.now() + 10 * 60 * 1000 };
  return code;
}

export function confirmEmailChange(userId: string, code: string) {
  const store = getStore();
  if (!store.emailChange || store.emailChange.userId !== userId) throw new Error("이메일 변경을 다시 요청해주세요.");
  if (Date.now() > store.emailChange.expiresAt) throw new Error("인증 코드가 만료되었습니다.");
  if (store.emailChange.code !== code.trim()) throw new Error("인증 코드가 올바르지 않습니다.");
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("사용자를 찾을 수 없습니다.");
  store.users[idx] = { ...store.users[idx], email: store.emailChange.newEmail };
  saveUsers(store.users);
  store.emailChange = undefined;
}

