"use client";

import { useRole } from "@/components/role/RoleProvider";
import { IconBan, IconLightbulb, IconStar, IconTool } from "@/components/icons/UiIcons";
import { redirect } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

type PracticeRoom = {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  isActive: boolean;
};

type Reservation = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
};

type ClosedDay = {
  id: string;
  date: string;
  reason?: string;
};

type User = {
  id: string;
  displayName: string;
  role: string;
  major?: string;
};

// 시간 슬롯 (9시 ~ 22시까지, 30분 단위)
const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const nextHour = minute === 30 ? hour + 1 : hour;
  const nextMinute = minute === 30 ? 0 : 30;
  return {
    start: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    end: `${nextHour.toString().padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`,
    label: `${hour}:${minute.toString().padStart(2, "0")}`,
  };
});

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDayLabel(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[date.getDay()];
}

function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getNextWeekday(date: Date): Date {
  const result = new Date(date);
  while (isWeekendDate(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

// 시간 문자열을 분으로 변환
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function PracticeRoomPage() {
  const { role, teacherId, studentId, studentName, teacherName } = useRole();
  
  // 학생 대기 상태면 접근 불가
  if (role === "student_pending") {
    redirect("/");
  }
  
  const [rooms, setRooms] = useState<PracticeRoom[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => getNextWeekday(new Date()));
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getNextWeekday(new Date()));
  
  // 다중 선택 상태: { roomId: string, startTime: string }[]
  const [selectedSlots, setSelectedSlots] = useState<{ roomId: string; startTime: string }[]>([]);
  
  // 예약 모달 상태
  const [showModal, setShowModal] = useState(false);
  
  // 관리자 설정 (실제로는 API에서 가져옴)
  const [reservationOpenTime] = useState("21:00");

  // 대리 예약용 유저 목록 (관리자/직원 전용)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // 현재 사용자 정보
  const isStudent = role === "student" || role === "student_vip";
  const isVip = role === "student_vip";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const canProxyReserve = isAdmin || isStaff; // 대리 예약 가능 여부
  
  const currentUserId = isStudent ? studentId : teacherId;
  const currentUserName = isStudent ? (studentName || "학생") : (teacherName || "선생님");

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = formatDate(selectedDate);
      const requests = [
        fetch("/api/practice-rooms"),
        fetch(`/api/reservations?date=${dateStr}`),
        fetch("/api/closed-days"),
      ];
      
      // 관리자/직원은 유저 목록도 가져옴
      if (canProxyReserve) {
        requests.push(fetch("/api/teachers"));
        requests.push(fetch("/api/student-users"));
      }
      
      const responses = await Promise.all(requests);
      
      const roomsData = await responses[0].json();
      const reservationsData = await responses[1].json();
      const closedDaysData = await responses[2].json();
      
      setRooms(roomsData.rooms || []);
      setReservations(reservationsData.reservations || []);
      setClosedDays(closedDaysData.closedDays || []);
      
      // 유저 목록 병합
      if (canProxyReserve && responses[3] && responses[4]) {
        const teachersData = await responses[3].json();
        const studentsData = await responses[4].json();
        
        const teachers = (teachersData.teachers || teachersData || []).map((t: any) => ({
          id: t.id,
          displayName: t.displayName || t.name,
          role: "teacher",
          major: t.major,
        }));
        
        const students = (studentsData.students || studentsData || [])
          .filter((s: any) => s.role === "student" || s.role === "student_vip")
          .map((s: any) => ({
            id: s.id,
            displayName: s.displayName || s.name,
            role: s.role,
            major: s.major,
          }));
        
        setAllUsers([...teachers, ...students]);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    setSelectedSlots([]); // 날짜 변경 시 선택 초기화
    setSelectedUserId("");
    setSelectedUserName("");
    setUserSearchQuery("");
  }, [selectedDate]);

  // 검색된 유저 목록
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers;
    const query = userSearchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.displayName.toLowerCase().includes(query) ||
        (u.major && u.major.toLowerCase().includes(query))
    );
  }, [allUsers, userSearchQuery]);

  // 선택한 날짜가 휴무일인지 확인
  const isClosedDay = useMemo(() => {
    const dateStr = formatDate(selectedDate);
    return closedDays.some((cd) => cd.date === dateStr);
  }, [selectedDate, closedDays]);

  const isWeekend = useMemo(() => isWeekendDate(selectedDate), [selectedDate]);
  
  const closedDayInfo = useMemo(() => {
    const dateStr = formatDate(selectedDate);
    return closedDays.find((cd) => cd.date === dateStr);
  }, [selectedDate, closedDays]);

  // 예약 가능 여부 확인
  const canReserve = useMemo(() => {
    if (isWeekend) return false;
    if (isAdmin || isStaff || isTeacher) return true;
    if (isVip) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    
    const targetDate = formatDate(selectedDate);
    const tomorrow = formatDate(addDays(new Date(), 1));
    
    if (targetDate === tomorrow) {
      return currentTimeStr >= reservationOpenTime;
    }
    
    return false;
  }, [selectedDate, isAdmin, isStaff, isTeacher, isVip, reservationOpenTime, isWeekend]);

  // 특정 시간대의 예약 정보 가져오기
  const getReservationForSlot = (roomId: string, startTime: string): Reservation | undefined => {
    const dateStr = formatDate(selectedDate);
    return reservations.find(
      (r) => r.roomId === roomId && r.date === dateStr && r.startTime === startTime
    );
  };

  // 해당 시간대에 사용자가 다른 방에 예약이 있는지 확인
  const hasConflictingReservation = (startTime: string, excludeRoomId?: string): Reservation | undefined => {
    const dateStr = formatDate(selectedDate);
    // 대리 예약 시 선택된 유저로, 아니면 현재 유저로 체크
    const checkUserId = canProxyReserve && selectedUserId ? selectedUserId : currentUserId;
    return reservations.find(
      (r) => r.date === dateStr && 
             r.startTime === startTime && 
             r.userId === checkUserId &&
             (excludeRoomId ? r.roomId !== excludeRoomId : true)
    );
  };

  // 슬롯 선택 토글
  const toggleSlotSelection = (roomId: string, startTime: string) => {
    if (isClosedDay || isWeekend) {
      alert(isWeekend ? "주말은 예약이 불가능합니다." : "휴무일에는 예약이 불가능합니다.");
      return;
    }
    const existing = selectedSlots.find(s => s.roomId === roomId && s.startTime === startTime);
    
    if (existing) {
      // 선택 해제
      setSelectedSlots(prev => prev.filter(s => !(s.roomId === roomId && s.startTime === startTime)));
    } else {
      // 같은 시간에 다른 방 선택 불가
      const sameTimeOtherRoom = selectedSlots.find(s => s.startTime === startTime && s.roomId !== roomId);
      if (sameTimeOtherRoom) {
        alert("같은 시간대에 다른 연습실을 선택할 수 없습니다.");
        return;
      }
      
      // 이미 예약된 시간 선택 불가
      const hasConflict = hasConflictingReservation(startTime, roomId);
      if (hasConflict) {
        alert("이미 다른 연습실에 예약이 있는 시간대입니다.");
        return;
      }
      
      setSelectedSlots(prev => [...prev, { roomId, startTime }]);
    }
  };

  // 선택된 슬롯인지 확인
  const isSlotSelected = (roomId: string, startTime: string): boolean => {
    return selectedSlots.some(s => s.roomId === roomId && s.startTime === startTime);
  };

  // 선택된 슬롯들을 방별로 그룹화하고 연속 시간대로 병합
  const groupedSelectedSlots = useMemo(() => {
    if (selectedSlots.length === 0) return [];
    
    // 방별로 그룹화
    const byRoom = new Map<string, string[]>();
    selectedSlots.forEach(s => {
      const arr = byRoom.get(s.roomId) || [];
      arr.push(s.startTime);
      byRoom.set(s.roomId, arr);
    });
    
    const result: { roomId: string; roomName: string; startTime: string; endTime: string; slots: string[] }[] = [];
    
    byRoom.forEach((times, roomId) => {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;
      
      // 시간 정렬
      const sorted = times.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      
      // 연속된 시간대 그룹화
      let groupStart = sorted[0];
      let groupSlots = [sorted[0]];
      
      for (let i = 1; i < sorted.length; i++) {
        const prevMinutes = timeToMinutes(sorted[i - 1]);
        const currMinutes = timeToMinutes(sorted[i]);
        
        if (currMinutes - prevMinutes === 30) {
          // 연속
          groupSlots.push(sorted[i]);
        } else {
          // 불연속 - 이전 그룹 저장
          const lastSlot = TIME_SLOTS.find(t => t.start === groupSlots[groupSlots.length - 1]);
          result.push({
            roomId,
            roomName: room.name,
            startTime: groupStart,
            endTime: lastSlot?.end || groupSlots[groupSlots.length - 1],
            slots: [...groupSlots],
          });
          groupStart = sorted[i];
          groupSlots = [sorted[i]];
        }
      }
      
      // 마지막 그룹 저장
      const lastSlot = TIME_SLOTS.find(t => t.start === groupSlots[groupSlots.length - 1]);
      result.push({
        roomId,
        roomName: room.name,
        startTime: groupStart,
        endTime: lastSlot?.end || groupSlots[groupSlots.length - 1],
        slots: [...groupSlots],
      });
    });
    
    return result.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [selectedSlots, rooms]);

  // 실제 예약자 정보 결정
  const reserveUserId = canProxyReserve && selectedUserId ? selectedUserId : currentUserId;
  const reserveUserName = canProxyReserve && selectedUserName ? selectedUserName : currentUserName;

  // 예약 확정
  const confirmReservation = async () => {
    if (selectedSlots.length === 0 || !reserveUserId) return;
    if (isWeekend || isClosedDay) return;
    
    try {
      // 각 슬롯별로 예약 생성
      const dateStr = formatDate(selectedDate);
      
      for (const slot of selectedSlots) {
        const slotInfo = TIME_SLOTS.find(t => t.start === slot.startTime);
        if (!slotInfo) continue;
        
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: slot.roomId,
            userId: reserveUserId,
            userName: reserveUserName,
            userRole: role,
            date: dateStr,
            timeSlot: {
              startTime: slotInfo.start,
              endTime: slotInfo.end,
            },
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "예약 실패");
        }
      }
      
      const proxyMsg = canProxyReserve && selectedUserId ? ` (${reserveUserName}님 대리 예약)` : "";
      alert(`${selectedSlots.length}개 시간대 예약이 완료되었습니다.${proxyMsg}`);
      setShowModal(false);
      setSelectedSlots([]);
      setSelectedUserId("");
      setSelectedUserName("");
      setUserSearchQuery("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  // 예약 취소 (본인만 가능)
  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("예약을 취소하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, role }),
      });
      
      if (res.ok) {
        alert("예약이 취소되었습니다.");
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "취소에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  // 선택 전체 취소
  const clearSelection = () => {
    setSelectedSlots([]);
  };

  // 주간 날짜 배열
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  }, [weekStartDate]);

  const monthLabel = useMemo(() => {
    return `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`;
  }, [selectedDate]);

  const activeRooms = rooms.filter((r) => r.isActive);

  // 선택된 시간 총합 계산
  const totalMinutes = selectedSlots.length * 30;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // 유저 선택
  const selectUser = (user: User) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.displayName);
    setUserSearchQuery(user.displayName);
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold mb-2">연습실 예약</h1>
        <p className="text-gray-700 dark:text-muted mb-6">
          원하는 시간대를 클릭하여 선택 후 예약하세요. (30분 단위)
        </p>

        {/* 역할별 안내 */}
        {isStudent && !isVip && (
          <div className="mb-4 p-4 bg-yellow-100/70 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-xl">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <span className="inline-flex items-center gap-2">
                <IconLightbulb className="h-4 w-4" />
                일반 학생은 매일 <strong>{reservationOpenTime}</strong> 이후에 다음날 연습실만 예약할 수 있습니다.
              </span>
            </p>
          </div>
        )}
        
        {isVip && (
          <div className="mb-4 p-4 bg-purple-100/70 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-800 rounded-xl">
            <p className="text-sm text-purple-900 dark:text-purple-300">
              <span className="inline-flex items-center gap-2">
                <IconStar className="h-4 w-4" />
                깍두기 학생은 언제든지 연습실을 예약할 수 있습니다.
              </span>
            </p>
          </div>
        )}

        {/* 관리자/직원 전용: 대리 예약 */}
        {canProxyReserve && (
          <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-900/30 border-2 border-slate-300 dark:border-slate-700 rounded-xl">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3">
              <span className="inline-flex items-center gap-2">
                <IconTool className="h-4 w-4" />
                관리자/직원 전용: 대리 예약
              </span>
            </p>
            <div className="relative">
              <input
                type="text"
                placeholder="이름으로 검색 (선생님/학생)..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  if (!e.target.value) {
                    setSelectedUserId("");
                    setSelectedUserName("");
                  }
                }}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              />
              {userSearchQuery && !selectedUserId && filteredUsers.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface border border-border rounded-lg shadow-lg">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted/20 flex justify-between items-center"
                    >
                      <span>{user.displayName}</span>
                      <span className="text-xs text-gray-700 dark:text-muted">
                        {user.role === "teacher" ? "선생님" : "학생"} {user.major ? `(${user.major})` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedUserId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-slate-900 dark:text-slate-200">
                  선택됨: <strong>{selectedUserName}</strong>님 대리 예약
                </span>
                <button
                  onClick={() => {
                    setSelectedUserId("");
                    setSelectedUserName("");
                    setUserSearchQuery("");
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  취소
                </button>
              </div>
            )}
            {!selectedUserId && (
              <p className="mt-2 text-xs text-gray-700 dark:text-muted">
                * 검색하지 않으면 본인({currentUserName}) 이름으로 예약됩니다.
              </p>
            )}
          </div>
        )}

        {/* 날짜 선택 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-muted">날짜 선택</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const prevWeek = addDays(weekStartDate, -7);
                  setWeekStartDate(prevWeek);
                  setSelectedDate(prevWeek);
                }}
                className="h-8 w-8 rounded-lg border border-border bg-surface text-sm font-medium text-gray-700 dark:text-muted hover:bg-background"
                aria-label="이전 주"
              >
                ←
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-muted">{monthLabel}</span>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = addDays(weekStartDate, 7);
                  setWeekStartDate(nextWeek);
                  setSelectedDate(nextWeek);
                }}
                className="h-8 w-8 rounded-lg border border-border bg-surface text-sm font-medium text-gray-700 dark:text-muted hover:bg-background"
                aria-label="다음 주"
              >
                →
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {weekDates.map((date) => {
              const dateStr = formatDate(date);
              const isSelected = formatDate(selectedDate) === dateStr;
              const isClosed = closedDays.some((cd) => cd.date === dateStr);
              const isWeekendDateValue = isWeekendDate(date);
              const isToday = formatDate(new Date()) === dateStr;
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(date)}
                  disabled={isClosed || isWeekendDateValue}
                  className={`flex-shrink-0 w-16 py-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                      : isWeekendDateValue
                      ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                      : isClosed
                      ? "border-red-300 bg-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 cursor-not-allowed"
                      : "border-border bg-surface hover:border-[color:var(--primary)] text-gray-800 dark:text-foreground"
                  }`}
                >
                  <div className="text-xs font-medium">
                    {getDayLabel(date)}
                    {isToday && <span className="ml-1 text-[10px]">(오늘)</span>}
                  </div>
                  <div className="text-lg font-bold">{date.getDate()}</div>
                  {isWeekendDateValue && <div className="text-[10px]">주말</div>}
                  {isClosed && !isWeekendDateValue && <div className="text-[10px]">휴무</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 휴무/주말 알림 */}
        {isWeekend && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-700 rounded-xl">
            <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">
              <span className="inline-flex items-center gap-2">
                <IconBan className="h-4 w-4" />
                주말에는 연습실 예약이 불가능합니다.
              </span>
            </p>
          </div>
        )}
        {isClosedDay && !isWeekend && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              <span className="inline-flex items-center gap-2">
                <IconBan className="h-4 w-4" />
                {formatDate(selectedDate)} 은(는) 휴무일입니다.
              </span>
              {closedDayInfo?.reason && ` (사유: ${closedDayInfo.reason})`}
            </p>
          </div>
        )}

        {/* 선택된 슬롯 표시 바 */}
        {selectedSlots.length > 0 && (
          <div className="mb-4 p-4 bg-blue-100/70 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  선택된 시간: {selectedSlots.length}개 슬롯 
                  ({totalHours > 0 ? `${totalHours}시간 ` : ""}{remainingMinutes > 0 ? `${remainingMinutes}분` : ""})
                  {canProxyReserve && selectedUserId && (
                    <span className="ml-2 text-amber-700 dark:text-amber-400">
                      → {selectedUserName}님 대리 예약
                    </span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {groupedSelectedSlots.map((g, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-blue-200/80 dark:bg-blue-800 rounded text-xs text-blue-900 dark:text-blue-100">
                      {g.roomName}: {g.startTime} ~ {g.endTime}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600"
                >
                  선택 취소
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
                >
                  예약하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 전체 연습실 예약 현황 테이블 */}
        {!isClosedDay && !isWeekend && (
          <>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-muted mb-3">
                {formatDate(selectedDate)} 예약 현황 
                <span className="ml-2 font-normal text-gray-700 dark:text-muted">({activeRooms.length}개 연습실)</span>
              </h2>
              
              {/* 색상 범례 */}
              <div className="mb-3 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-dashed border-gray-300 dark:border-gray-600" />
                  <span className="text-gray-700 dark:text-muted">예약 가능</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span className="text-gray-700 dark:text-muted">선택됨</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
                  <span className="text-gray-700 dark:text-muted">내 예약</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
                  <span className="text-gray-700 dark:text-muted">다른 사람 예약</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-700 dark:text-muted">
                <span className="inline-flex items-center gap-2">
                  <IconLightbulb className="h-4 w-4" />
                  빈 칸을 클릭하여 여러 시간대를 선택할 수 있습니다. 같은 시간에는 하나의 연습실만 선택 가능합니다.
                </span>
              </p>
            </div>

            {loading ? (
              <div className="animate-pulse h-96 bg-surface rounded-xl" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="sticky left-0 bg-surface p-2 text-left text-xs font-semibold w-16 border-r border-border">
                        시간
                      </th>
                      {activeRooms.map((room) => (
                        <th key={room.id} className="p-2 text-center text-xs font-semibold min-w-[120px]">
                          <div>{room.name}</div>
                          <div className="text-[10px] font-normal text-muted">({room.capacity}인)</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot.start} className="border-b border-border last:border-b-0 hover:bg-muted/5">
                        <td className="sticky left-0 bg-surface p-2 text-xs font-medium border-r border-border">
                          {slot.label}
                        </td>
                        {activeRooms.map((room) => {
                          const reservation = getReservationForSlot(room.id, slot.start);
                          const isMine = reservation?.userId === currentUserId;
                          const isSelected = isSlotSelected(room.id, slot.start);
                          const hasOtherReservation = hasConflictingReservation(slot.start, room.id);
                          
                          // 같은 시간 다른 방이 선택되어 있는지
                          const sameTimeOtherRoomSelected = selectedSlots.some(
                            s => s.startTime === slot.start && s.roomId !== room.id
                          );
                          
                          return (
                            <td key={room.id} className="p-1 text-center">
                              {reservation ? (
                                <div
                                  className={`rounded-lg p-2 text-xs transition-all ${
                                    isMine
                                      ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                  }`}
                                >
                                  <div className="font-medium truncate text-[11px]">
                                    {reservation.userName}
                                    {isMine && <span className="ml-1 text-green-600 dark:text-green-400">(나)</span>}
                                  </div>
                                  {/* 본인 예약만 취소 가능 */}
                                  {isMine && (
                                    <button
                                      onClick={() => handleCancelReservation(reservation.id)}
                                      className="mt-1 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded hover:bg-red-700"
                                    >
                                      취소
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!canReserve && isStudent && !isVip) {
                                      alert(`일반 학생은 ${reservationOpenTime} 이후에 다음날 연습실만 예약할 수 있습니다.`);
                                      return;
                                    }
                                    toggleSlotSelection(room.id, slot.start);
                                  }}
                                  disabled={(!canReserve && isStudent && !isVip) || sameTimeOtherRoomSelected || !!hasOtherReservation}
                                  className={`w-full h-10 rounded-lg border transition-all text-[10px] ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-500 text-white"
                                      : sameTimeOtherRoomSelected || hasOtherReservation
                                      ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50"
                                      : canReserve || !isStudent || isVip
                                      ? "border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                      : "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
                                  }`}
                                >
                                  {isSelected ? "✓ 선택됨" : hasOtherReservation ? "예약있음" : ""}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 범례 */}
          </>
        )}

        {/* 관리자 전용: 연습실 관리 링크 */}
        {isAdmin && (
          <div className="mt-8 p-4 bg-surface border border-border rounded-xl">
            <h3 className="font-semibold mb-2">관리자 도구</h3>
            <div className="flex gap-2">
              <a
                href="/admin/practice-rooms"
                className="px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                연습실 관리
              </a>
              <a
                href="/admin/closed-days"
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
              >
                휴무일 관리
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 예약 확인 모달 */}
      {showModal && selectedSlots.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-border p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">예약 확인</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted">날짜</span>
                <span className="font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">예약자</span>
                <span className="font-medium">
                  {reserveUserName}
                  {canProxyReserve && selectedUserId && (
                    <span className="ml-2 text-slate-700 dark:text-slate-300 text-sm">(대리 예약)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">총 시간</span>
                <span className="font-medium">
                  {totalHours > 0 ? `${totalHours}시간 ` : ""}{remainingMinutes > 0 ? `${remainingMinutes}분` : ""}
                  ({selectedSlots.length}개 슬롯)
                </span>
              </div>
              
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-2">예약 내역</p>
                <div className="space-y-2">
                  {groupedSelectedSlots.map((g, idx) => (
                    <div key={idx} className="p-3 bg-background rounded-lg border border-border">
                      <div className="font-medium">{g.roomName}</div>
                      <div className="text-sm text-muted">{g.startTime} ~ {g.endTime}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmReservation}
                className="flex-1 px-4 py-3 bg-[color:var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
              >
                예약 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
