"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmPasswordReset, findIdByName, requestPasswordReset } from "@/lib/devAuth";

type Tab = "id" | "pw";

export default function ForgotPage() {
  const [tab, setTab] = useState<Tab>("pw");
  const [error, setError] = useState<string | null>(null);

  // id
  const [name, setName] = useState("");
  const [found, setFound] = useState<string[]>([]);

  // pw
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  function doFindId() {
    setError(null);
    try {
      const list = findIdByName(name);
      setFound(list);
      if (list.length === 0) setError("해당 이름으로 가입된 계정이 없습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    }
  }

  function doRequestReset() {
    setError(null);
    try {
      const c = requestPasswordReset(email);
      setIssuedCode(c); // 개발용: 실제로는 이메일 발송
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    }
  }

  function doConfirmReset() {
    setError(null);
    try {
      confirmPasswordReset(email, code, newPw);
      alert("비밀번호가 변경되었습니다.");
      window.location.href = "/auth?mode=login";
    } catch (e) {
      setError(e instanceof Error ? e.message : "실패");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">아이디/비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-muted">개발용 데모입니다. (실서비스에서는 이메일/SMS 인증으로 전환)</p>

        <div className="mt-6 flex gap-2">
          <button
            className={`h-10 rounded-lg border px-4 text-sm font-medium ${
              tab === "id" ? "border-[color:var(--primary)] bg-surface" : "border-border bg-background hover:bg-surface"
            }`}
            onClick={() => setTab("id")}
          >
            아이디 찾기
          </button>
          <button
            className={`h-10 rounded-lg border px-4 text-sm font-medium ${
              tab === "pw" ? "border-[color:var(--primary)] bg-surface" : "border-border bg-background hover:bg-surface"
            }`}
            onClick={() => setTab("pw")}
          >
            비밀번호 재설정
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 rounded-2xl border border-border bg-surface p-8">
          {tab === "id" ? (
            <div className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-muted">실명</span>
                <input
                  className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </label>
              <button
                className="h-11 rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                onClick={doFindId}
              >
                찾기
              </button>
              {found.length ? (
                <div className="rounded-xl border border-border bg-background p-4 text-sm">
                  <div className="font-medium">검색 결과</div>
                  <ul className="mt-2 list-disc pl-5 text-muted">
                    {found.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-muted">이메일</span>
                <input
                  className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </label>
              <button
                className="h-11 rounded-lg border border-border bg-background px-4 font-medium hover:bg-surface"
                onClick={doRequestReset}
              >
                인증 코드 발급
              </button>
              {issuedCode ? (
                <p className="text-xs text-muted">
                  개발용 인증 코드: <span className="font-mono">{issuedCode}</span> (실서비스에서는 이메일 발송)
                </p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-muted">인증 코드</span>
                  <input
                    className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6자리"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-muted">새 비밀번호</span>
                  <input
                    type="password"
                    className="h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="6자 이상"
                  />
                </label>
              </div>
              <button
                className="h-11 rounded-lg bg-primary px-4 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                onClick={doConfirmReset}
              >
                비밀번호 변경
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between text-sm">
          <Link className="text-[color:var(--primary)] hover:underline" href="/auth">
            로그인/가입으로
          </Link>
          <Link className="text-muted hover:text-foreground" href="/account">
            내 계정 설정
          </Link>
        </div>
      </div>
    </main>
  );
}

