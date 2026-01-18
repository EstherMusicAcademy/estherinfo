"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  changePassword,
  confirmEmailChange,
  getCurrentUser,
  initDevAuthStore,
  logout,
  requestEmailChange,
} from "@/lib/devAuth";

export default function AccountPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

  // password change
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");

  // email change
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [issuedEmailCode, setIssuedEmailCode] = useState<string | null>(null);

  useEffect(() => {
    initDevAuthStore();
    const u = getCurrentUser();
    if (!u) return;
    setUserId(u.id);
    setEmail(u.email);
    setName(u.name);
    setRole(u.role);
    setStatus(u.status);
  }, []);

  function doLogout() {
    logout();
    alert("로그아웃 되었습니다.");
    window.location.href = "/auth";
  }

  function doChangePassword() {
    setError(null);
    try {
      if (!userId) throw new Error("로그인이 필요합니다.");
      changePassword(userId, currentPw, nextPw);
      setCurrentPw("");
      setNextPw("");
      alert("비밀번호가 변경되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    }
  }

  function doRequestEmailChange() {
    setError(null);
    try {
      if (!userId) throw new Error("로그인이 필요합니다.");
      const code = requestEmailChange(userId, newEmail);
      setIssuedEmailCode(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    }
  }

  function doConfirmEmailChange() {
    setError(null);
    try {
      if (!userId) throw new Error("로그인이 필요합니다.");
      confirmEmailChange(userId, emailCode);
      const u = getCurrentUser();
      setEmail(u?.email ?? email);
      setIssuedEmailCode(null);
      setEmailCode("");
      setNewEmail("");
      alert("이메일이 변경되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    }
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">내 계정</h1>
          <p className="mt-2 text-sm text-muted">로그인이 필요합니다.</p>
          <Link className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-medium text-white" href="/auth">
            로그인/가입으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">내 계정</h1>
        <p className="mt-2 text-sm text-muted">
          {name} · {email} · {role} · {status}
        </p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 grid gap-6">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">비밀번호 변경</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm text-muted">현재 비밀번호</span>
                <input
                  type="password"
                  className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-muted">새 비밀번호</span>
                <input
                  type="password"
                  className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={nextPw}
                  onChange={(e) => setNextPw(e.target.value)}
                />
              </label>
            </div>
            <button
              className="mt-4 h-11 rounded-lg bg-primary px-5 font-medium text-white hover:bg-[color:var(--primary-hover)]"
              onClick={doChangePassword}
            >
              변경
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">이메일 변경(인증)</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px]">
              <label className="grid gap-1">
                <span className="text-sm text-muted">새 이메일</span>
                <input
                  className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                />
              </label>
              <div className="grid gap-1">
                <span className="text-sm text-muted">&nbsp;</span>
                <button
                  className="h-11 rounded-lg border border-border bg-background px-4 font-medium hover:bg-surface"
                  onClick={doRequestEmailChange}
                >
                  코드 발급
                </button>
              </div>
            </div>

            {issuedEmailCode ? (
              <p className="mt-2 text-xs text-muted">
                개발용 인증 코드: <span className="font-mono">{issuedEmailCode}</span>
              </p>
            ) : null}

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
              <label className="grid gap-1">
                <span className="text-sm text-muted">인증 코드</span>
                <input
                  className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="6자리"
                />
              </label>
              <div className="grid gap-1">
                <span className="text-sm text-muted">&nbsp;</span>
                <button
                  className="h-11 rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                  onClick={doConfirmEmailChange}
                >
                  변경 확정
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-between">
            <Link className="text-[color:var(--primary)] hover:underline" href="/auth">
              로그인/가입으로
            </Link>
            <button className="text-sm text-red-600 hover:underline" onClick={doLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

