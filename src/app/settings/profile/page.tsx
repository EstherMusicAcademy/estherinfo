"use client";

import { useState } from "react";
import { useRole } from "@/components/role/RoleProvider";

export default function ProfileSettingsPage() {
  const { role, teacherName } = useRole();
  
  // 폼 상태
  const [form, setForm] = useState({
    name: teacherName || "홍길동",
    email: "demo@esther.com",
    major: "보컬",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const majors = ["보컬", "피아노", "드럼", "기타", "베이스", "작곡", "화성학", "시창청음"];

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    // 실제로는 API 호출
    await new Promise((r) => setTimeout(r, 1000));
    
    setMessage({ type: "success", text: "프로필이 저장되었습니다." });
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      setSaving(false);
      return;
    }

    if (form.newPassword.length < 8) {
      setMessage({ type: "error", text: "비밀번호는 8자 이상이어야 합니다." });
      setSaving(false);
      return;
    }

    // 실제로는 API 호출
    await new Promise((r) => setTimeout(r, 1000));
    
    setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });
    setForm({ ...form, currentPassword: "", newPassword: "", confirmPassword: "" });
    setSaving(false);
  }

  if (!role) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">로그인이 필요합니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h1 className="text-2xl font-bold">내 정보 설정</h1>
          <p className="mt-1 text-sm text-muted">
            개인 정보와 비밀번호를 관리합니다.
          </p>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 ${
              message.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : "border-red-500/30 bg-red-500/10 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 프로필 정보 */}
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">프로필 정보</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">이름</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
                required
              />
              <p className="mt-1 text-xs text-muted">이메일 변경 시 인증 메일이 발송됩니다.</p>
            </div>
            {(role === "teacher" || role === "staff") && (
              <div>
                <label className="mb-2 block text-sm font-medium">전공</label>
                <select
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3"
                >
                  {majors.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium">역할</label>
              <input
                type="text"
                value={role === "admin" ? "관리자" : role === "teacher" ? "선생님" : "직원"}
                disabled
                className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-muted"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-6 font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-50"
            >
              {saving ? "저장 중..." : "프로필 저장"}
            </button>
          </div>
        </form>

        {/* 비밀번호 변경 */}
        <form onSubmit={handleChangePassword} className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">비밀번호 변경</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">현재 비밀번호</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">새 비밀번호</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
                placeholder="8자 이상"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">새 비밀번호 확인</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3"
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-6 font-medium hover:bg-surface disabled:opacity-50"
            >
              {saving ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </form>

        {/* 계정 삭제 (참고용) */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-600">위험 구역</h2>
          <p className="mt-2 text-sm text-muted">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-6 font-medium text-red-600 hover:bg-red-500/20"
          >
            계정 삭제 요청
          </button>
        </div>
      </div>
    </main>
  );
}
