"use client";

import { useEffect, useMemo, useState } from "react";
import type { Subject } from "@/lib/subjectStore";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  buildAuthDetails,
  buildCognitoUser,
  buildSignupAttributes,
  getUserPool,
} from "@/lib/cognitoClient";

type Tab = "login" | "signup";
type SignupRole = "teacher" | "staff" | "student";
type ApiError = { error: string };

function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.replace(/\s/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) return `+82${trimmed.slice(1)}`;
  return trimmed;
}

export default function AuthPage() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // signup
  const [signupRole, setSignupRole] = useState<SignupRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [majorSubjectId, setMajorSubjectId] = useState<string>("");
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear() - 18);
  const [phone, setPhone] = useState("");

  // confirm
  const [confirmCode, setConfirmCode] = useState("");

  useEffect(() => {
    async function run() {
      const res = await fetch("/api/subjects", { cache: "no-store" });
      const data = (await res.json()) as { subjects: Subject[] } | ApiError;
      if (!res.ok) return;
      const majors = (data as { subjects: Subject[] }).subjects.filter((s) => s.isActive && s.category === "major");
      setSubjects(majors);
      if (!majorSubjectId && majors.length) setMajorSubjectId(majors[0].id);
    }
    void run();
  }, [majorSubjectId]);

  const title = useMemo(() => {
    if (tab === "login") return "로그인";
    return "가입";
  }, [tab]);

  async function doLogin() {
    setError(null);
    const user = buildCognitoUser(loginEmail);
    const details = buildAuthDetails(loginEmail, loginPw);
    user.authenticateUser(details, {
      onSuccess: () => {
        auth.refresh();
        window.location.href = "/";
      },
      onFailure: (err) => {
        setError(err.message ?? "로그인 실패");
      },
    });
  }

  async function doSignup() {
    setError(null);
    if (pw !== pwConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    const role = signupRole === "student" ? "student_pending" : signupRole;
    const attributes = buildSignupAttributes({
      name,
      email,
      phone: signupRole === "student" ? normalizePhoneNumber(phone) : undefined,
      role,
      major: signupRole === "teacher" || signupRole === "student" ? majorSubjectId : undefined,
      birthYear: signupRole === "student" ? birthYear : undefined,
      majorSubjectId: signupRole === "teacher" || signupRole === "student" ? majorSubjectId : undefined,
    });

    getUserPool().signUp(email, pw, attributes, [], (err) => {
      if (err) {
        setError(err.message ?? "가입 실패");
        return;
      }
      setPendingEmail(email);
      setConfirmCode("");
      setShowEmailConfirm(true);
    });
  }

  async function doConfirm() {
    setError(null);
    const targetEmail = pendingEmail || email;
    if (!targetEmail) {
      setError("이메일을 입력해주세요.");
      return;
    }
    const user = buildCognitoUser(targetEmail);
    user.confirmRegistration(confirmCode, true, (err) => {
      if (err) {
        setError(err.message ?? "인증 실패");
        return;
      }
      setTab("login");
      setLoginEmail(targetEmail);
      setLoginPw("");
    });
  }

  async function resendCode() {
    setError(null);
    const targetEmail = pendingEmail || email;
    if (!targetEmail) {
      setError("이메일을 입력해주세요.");
      return;
    }
    const user = buildCognitoUser(targetEmail);
    user.resendConfirmationCode((err) => {
      if (err) {
        setError(err.message ?? "코드 재전송 실패");
        return;
      }
      setError("인증 코드를 다시 보냈습니다.");
    });
  }

  if (auth.isLoading) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">로그인</h1>
          <p className="mt-2 text-sm text-muted">로그인 정보를 확인하는 중입니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">회원가입 후 이메일 인증이 필요합니다.</p>

        <div className="mt-6 flex gap-2">
          <button
            className={`h-10 rounded-lg border px-4 text-sm font-medium ${
              tab === "login" ? "border-[color:var(--primary)] bg-surface" : "border-border bg-background hover:bg-surface"
            }`}
            onClick={() => setTab("login")}
          >
            로그인
          </button>
          <button
            className={`h-10 rounded-lg border px-4 text-sm font-medium ${
              tab === "signup" ? "border-[color:var(--primary)] bg-surface" : "border-border bg-background hover:bg-surface"
            }`}
            onClick={() => setTab("signup")}
          >
            가입
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

          {tab === "login" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                />
              </div>
              <button
                onClick={doLogin}
                className="h-10 rounded-lg bg-[color:var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                로그인
              </button>
            </div>
          )}

          {tab === "signup" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">가입 유형</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as SignupRole)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                >
                  <option value="student">학생</option>
                  <option value="teacher">선생님</option>
                  <option value="staff">직원</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                    aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPw ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M3 3l18 18M10.6 10.6a3 3 0 004.24 4.24M9.9 5.1A10.7 10.7 0 0112 5c5.05 0 9.14 3.13 10.5 7.5a11.7 11.7 0 01-5.16 6.3M6.1 6.1A11.9 11.9 0 001.5 12.5c1.3 4.3 5.2 7.5 10.5 7.5 1.4 0 2.7-.2 4-.7"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M1.5 12.5C2.8 8.2 6.7 5 12 5s9.2 3.2 10.5 7.5C21.2 16.8 17.3 20 12 20s-9.2-3.2-10.5-7.5z"
                        />
                        <circle cx="12" cy="12.5" r="3.2" strokeWidth={1.6} />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPwConfirm ? "text" : "password"}
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwConfirm((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                    aria-label={showPwConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
                  >
                    {showPwConfirm ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M3 3l18 18M10.6 10.6a3 3 0 004.24 4.24M9.9 5.1A10.7 10.7 0 0112 5c5.05 0 9.14 3.13 10.5 7.5a11.7 11.7 0 01-5.16 6.3M6.1 6.1A11.9 11.9 0 001.5 12.5c1.3 4.3 5.2 7.5 10.5 7.5 1.4 0 2.7-.2 4-.7"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M1.5 12.5C2.8 8.2 6.7 5 12 5s9.2 3.2 10.5 7.5C21.2 16.8 17.3 20 12 20s-9.2-3.2-10.5-7.5z"
                        />
                        <circle cx="12" cy="12.5" r="3.2" strokeWidth={1.6} />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {(signupRole === "teacher" || signupRole === "student") && (
                <div>
                  <label className="block text-sm font-medium mb-1">전공</label>
                  <select
                    value={majorSubjectId}
                    onChange={(e) => setMajorSubjectId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {signupRole === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">출생연도</label>
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(Number(e.target.value))}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">연락처</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full h-10 rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                </>
              )}
              <button
                onClick={doSignup}
                className="h-10 rounded-lg bg-[color:var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                가입 요청
              </button>
            </div>
          )}

          {tab === "signup" && showEmailConfirm && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  type="email"
                  value={pendingEmail || email}
                  onChange={(e) => setPendingEmail(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">인증 코드</label>
                <input
                  type="text"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={doConfirm}
                  className="h-10 rounded-lg bg-[color:var(--primary)] px-4 text-sm font-medium text-white hover:opacity-90"
                >
                  이메일 인증
                </button>
                <button
                  onClick={resendCode}
                  className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-surface"
                >
                  코드 재전송
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
