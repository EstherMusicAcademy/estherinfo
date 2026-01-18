"use client";

import { useRole } from "@/components/role/RoleProvider";
import { useEffect, useState } from "react";

type PracticeRoom = {
  id: string;
  name: string;
  description?: string;
  roomType?: string; // 연습실 종류 추가
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ReservationSettings = {
  studentReservationOpenTime: string;
  vipAdvanceDays: number;
  teacherAdvanceDays: number;
  operatingStartTime: string;
  operatingEndTime: string;
  slotDurationMinutes: number;
};

// 연습실 종류 옵션
const ROOM_TYPES = [
  { value: "piano", label: "피아노실" },
  { value: "vocal", label: "보컬실" },
  { value: "drum", label: "드럼/타악기실" },
  { value: "guitar", label: "기타/베이스실" },
  { value: "ensemble", label: "합주실" },
  { value: "recording", label: "녹음실" },
  { value: "general", label: "일반 연습실" },
];

export default function PracticeRoomsAdminPage() {
  const { role } = useRole();

  const [rooms, setRooms] = useState<PracticeRoom[]>([]);
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [editingRoom, setEditingRoom] = useState<PracticeRoom | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    roomType: "general",
    capacity: 1,
  });
  const [settingsFormData, setSettingsFormData] = useState<ReservationSettings>({
    studentReservationOpenTime: "21:00",
    vipAdvanceDays: 7,
    teacherAdvanceDays: 30,
    operatingStartTime: "09:00",
    operatingEndTime: "22:00",
    slotDurationMinutes: 30,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [roomsRes, settingsRes] = await Promise.all([
        fetch("/api/practice-rooms"),
        fetch("/api/practice-rooms?type=settings"),
      ]);
      const roomsData = await roomsRes.json();
      const settingsData = await settingsRes.json();
      
      setRooms(roomsData.rooms || []);
      if (settingsData.settings) {
        setSettings(settingsData.settings);
        setSettingsFormData(settingsData.settings);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "admin") return;
    void fetchRooms();
  }, [role]);

  const resetForm = () => {
    setFormData({ name: "", description: "", roomType: "general", capacity: 1 });
    setEditingRoom(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("연습실 이름을 입력해주세요.");
      return;
    }
    
    try {
      if (editingRoom) {
        // 수정
        const res = await fetch(`/api/practice-rooms/${editingRoom.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        
        if (res.ok) {
          alert("연습실이 수정되었습니다.");
          resetForm();
          await fetchRooms();
        } else {
          const data = await res.json();
          alert(data.error || "수정에 실패했습니다.");
        }
      } else {
        // 생성
        const res = await fetch("/api/practice-rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, role }),
        });
        
        if (res.ok) {
          alert("연습실이 추가되었습니다.");
          resetForm();
          await fetchRooms();
        } else {
          const data = await res.json();
          alert(data.error || "추가에 실패했습니다.");
        }
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const handleEdit = (room: PracticeRoom) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      roomType: room.roomType || "general",
      capacity: room.capacity,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (room: PracticeRoom) => {
    const action = room.isActive ? "비활성화" : "활성화";
    if (!confirm(`${room.name}을(를) ${action}하시겠습니까?`)) return;
    
    try {
      const res = await fetch(`/api/practice-rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !room.isActive }),
      });
      
      if (res.ok) {
        await fetchRooms();
      } else {
        const data = await res.json();
        alert(data.error || "변경에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (room: PracticeRoom) => {
    if (!confirm(`${room.name}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    
    try {
      const res = await fetch(`/api/practice-rooms/${room.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        alert("연습실이 삭제되었습니다.");
        await fetchRooms();
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    
    try {
      const res = await fetch("/api/practice-rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "settings", settings: settingsFormData }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        alert("설정이 저장되었습니다.");
      } else {
        const data = await res.json();
        alert(data.error || "설정 저장에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setSavingSettings(false);
    }
  };

  const getRoomTypeLabel = (type?: string) => {
    return ROOM_TYPES.find((t) => t.value === type)?.label || "일반 연습실";
  };

  if (role !== "admin") {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">관리자만 연습실을 관리할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">연습실 관리</h1>
            <p className="text-muted">연습실을 추가, 수정, 삭제하고 예약 설정을 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showSettingsPanel
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "border border-border bg-surface hover:bg-muted/20"
              }`}
            >
              ⚙️ 예약 설정
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
            >
              + 연습실 추가
            </button>
          </div>
        </div>

        {/* 예약 설정 패널 */}
        {showSettingsPanel && (
          <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">예약 설정</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* 운영 시간 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100">연습실 오픈 시간</label>
                  <input
                    type="time"
                    value={settingsFormData.operatingStartTime}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, operatingStartTime: e.target.value })}
                    className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100">연습실 마감 시간</label>
                  <input
                    type="time"
                    value={settingsFormData.operatingEndTime}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, operatingEndTime: e.target.value })}
                    className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* 예약 단위 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100">예약 단위 (분)</label>
                  <select
                    value={settingsFormData.slotDurationMinutes}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, slotDurationMinutes: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm"
                  >
                    <option value={30}>30분</option>
                    <option value={60}>60분 (1시간)</option>
                  </select>
                </div>
                
                {/* 일반 학생 예약 오픈 시간 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100">
                    일반 학생 예약 오픈 시간
                    <span className="font-normal text-xs ml-1">(다음날 예약 오픈)</span>
                  </label>
                  <input
                    type="time"
                    value={settingsFormData.studentReservationOpenTime}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, studentReservationOpenTime: e.target.value })}
                    className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* 깍두기 학생 사전 예약 일수 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100">
                    깍두기 학생 사전 예약 가능 일수
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={settingsFormData.vipAdvanceDays}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, vipAdvanceDays: Number(e.target.value) })}
                      className="w-24 h-10 px-3 border border-border rounded-lg bg-background text-sm"
                    />
                    <span className="text-sm text-muted">일 전부터</span>
                  </div>
                </div>
                
                {/* 선생님 사전 예약 일수 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100">
                    선생님 사전 예약 가능 일수
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={settingsFormData.teacherAdvanceDays}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, teacherAdvanceDays: Number(e.target.value) })}
                      className="w-24 h-10 px-3 border border-border rounded-lg bg-background text-sm"
                    />
                    <span className="text-sm text-muted">일 전부터</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingSettings ? "저장 중..." : "설정 저장"}
                </button>
              </div>
            </form>

            {/* 현재 설정 안내 */}
            {settings && (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>현재 설정:</strong> 운영시간 {settings.operatingStartTime}~{settings.operatingEndTime}, 
                  일반 학생 예약오픈 {settings.studentReservationOpenTime}, 
                  깍두기 {settings.vipAdvanceDays}일, 선생님 {settings.teacherAdvanceDays}일 전 예약 가능
                </p>
              </div>
            )}
          </div>
        )}

        {/* 연습실 추가/수정 폼 */}
        {showForm && (
          <div className="mb-6 p-4 bg-surface border border-border rounded-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingRoom ? "연습실 수정" : "새 연습실 추가"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">연습실 이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                    placeholder="예: A연습실"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">연습실 종류</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="예: 그랜드 피아노 보유, 방음 완비"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">수용 인원</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-32 h-10 px-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
                >
                  {editingRoom ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 연습실 목록 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-surface rounded-xl" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-border">
            <p className="text-muted">등록된 연습실이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`bg-surface border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  room.isActive ? "border-border" : "border-red-300 dark:border-red-800 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-lg">{room.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      {getRoomTypeLabel(room.roomType)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {room.capacity}인
                    </span>
                    {!room.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        비활성
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted">{room.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-background"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleToggleActive(room)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                      room.isActive
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {room.isActive ? "비활성화" : "활성화"}
                  </button>
                  <button
                    onClick={() => handleDelete(room)}
                    className="px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
