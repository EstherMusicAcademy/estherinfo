"use client";

import { useRole } from "@/components/role/RoleProvider";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

type ClosedDay = {
  id: string;
  date: string;
  reason?: string;
  createdAt: string;
};

function formatDateKorean(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

export default function ClosedDaysAdminPage() {
  const { role } = useRole();
  
  if (role !== "admin") {
    redirect("/");
  }
  
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
  });

  const fetchClosedDays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/closed-days");
      const data = await res.json();
      setClosedDays(data.closedDays || []);
    } catch (err) {
      console.error("Failed to fetch closed days:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchClosedDays();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date) {
      alert("날짜를 선택해주세요.");
      return;
    }
    
    try {
      const res = await fetch("/api/closed-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });
      
      if (res.ok) {
        alert("휴무일이 추가되었습니다.");
        setFormData({ date: "", reason: "" });
        setShowForm(false);
        await fetchClosedDays();
      } else {
        const data = await res.json();
        alert(data.error || "추가에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`${formatDateKorean(date)} 휴무일을 삭제하시겠습니까?`)) return;
    
    try {
      const res = await fetch(`/api/closed-days?id=${id}&role=${role}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        alert("휴무일이 삭제되었습니다.");
        await fetchClosedDays();
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  // 오늘 이후 휴무일만 표시
  const upcomingClosedDays = closedDays
    .filter((cd) => new Date(cd.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const pastClosedDays = closedDays
    .filter((cd) => new Date(cd.date) < new Date(new Date().toDateString()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="min-h-screen bg-background p-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">휴무일 관리</h1>
            <p className="text-muted">학원 휴무일을 설정하여 연습실 예약을 차단합니다.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
          >
            + 휴무일 추가
          </button>
        </div>

        {/* 휴무일 추가 폼 */}
        {showForm && (
          <div className="mb-6 p-4 bg-surface border border-border rounded-xl">
            <h2 className="text-lg font-semibold mb-4">새 휴무일 추가</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">날짜 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">사유 (선택)</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="예: 설날 연휴"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 예정된 휴무일 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">예정된 휴무일 ({upcomingClosedDays.length})</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-surface rounded-xl" />
              ))}
            </div>
          ) : upcomingClosedDays.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-xl border border-border">
              <p className="text-muted">예정된 휴무일이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingClosedDays.map((cd) => (
                <div
                  key={cd.id}
                  className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{formatDateKorean(cd.date)}</div>
                    {cd.reason && <p className="text-sm text-muted mt-1">{cd.reason}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(cd.id, cd.date)}
                    className="px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 지난 휴무일 */}
        {pastClosedDays.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-muted">지난 휴무일 ({pastClosedDays.length})</h2>
            <div className="space-y-2 opacity-60">
              {pastClosedDays.slice(0, 10).map((cd) => (
                <div
                  key={cd.id}
                  className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm">{formatDateKorean(cd.date)}</div>
                    {cd.reason && <p className="text-xs text-muted">{cd.reason}</p>}
                  </div>
                </div>
              ))}
              {pastClosedDays.length > 10 && (
                <p className="text-xs text-muted text-center">... 외 {pastClosedDays.length - 10}개</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
