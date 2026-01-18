// 연습실 관련 타입 및 스토어

export type PracticeRoom = {
  id: string;
  name: string;
  description?: string;
  roomType?: string; // 연습실 종류 (piano, vocal, drum, etc.)
  isActive: boolean;
  order: number; // 정렬 순서
  capacity?: number;
};

export type TimeSlot = {
  startTime: string; // "09:00"
  endTime: string; // "10:00"
};

export type Reservation = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userRole: string;
  date: string; // "2024-01-17"
  timeSlot: TimeSlot;
  createdAt: string;
  note?: string;
};

export type ClosedDay = {
  id: string;
  date: string; // "2024-01-17"
  reason?: string;
  createdAt: string;
};

export type ReservationSettings = {
  // 일반 학생이 예약 가능한 시간 (기본: 매일 21:00부터 다음날 예약 가능)
  studentReservationOpenTime: string; // "21:00"
  // VIP 학생(깍두기)은 며칠 전부터 예약 가능한지 (기본: 7일)
  vipAdvanceDays: number;
  // 선생님은 며칠 전부터 예약 가능한지 (기본: 30일)
  teacherAdvanceDays: number;
  // 연습실 운영 시간
  operatingStartTime: string; // "09:00"
  operatingEndTime: string; // "22:00"
  // 타임 슬롯 단위 (분)
  slotDurationMinutes: number; // 60
};

type Store = {
  rooms: PracticeRoom[];
  reservations: Reservation[];
  closedDays: ClosedDay[];
  settings: ReservationSettings;
};

function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  
  let currentH = startH;
  let currentM = startM;
  
  while (currentH < endH || (currentH === endH && currentM < endM)) {
    const slotStart = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
    
    currentM += durationMinutes;
    if (currentM >= 60) {
      currentH += Math.floor(currentM / 60);
      currentM = currentM % 60;
    }
    
    const slotEnd = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
    
    if (currentH < endH || (currentH === endH && currentM <= endM)) {
      slots.push({ startTime: slotStart, endTime: slotEnd });
    }
  }
  
  return slots;
}

function seed(): Store {
  const now = new Date().toISOString();
  
  return {
    rooms: [
      { id: "room-1", name: "A연습실", description: "그랜드 피아노", roomType: "piano", isActive: true, order: 1, capacity: 2 },
      { id: "room-2", name: "B연습실", description: "업라이트 피아노", roomType: "piano", isActive: true, order: 2, capacity: 2 },
      { id: "room-3", name: "C연습실", description: "드럼/합주", roomType: "drum", isActive: true, order: 3, capacity: 4 },
      { id: "room-4", name: "D연습실", description: "보컬 녹음", roomType: "recording", isActive: true, order: 4, capacity: 2 },
      { id: "room-5", name: "E연습실", description: "자유 연습", roomType: "general", isActive: true, order: 5, capacity: 3 },
    ],
    reservations: [
      // 오늘 예약 예시
      {
        id: "res-1",
        roomId: "room-1",
        userId: "stu-1",
        userName: "김민준",
        userRole: "student",
        date: new Date().toISOString().slice(0, 10),
        timeSlot: { startTime: "14:00", endTime: "15:00" },
        createdAt: now,
      },
      {
        id: "res-2",
        roomId: "room-2",
        userId: "stu-2",
        userName: "이서준",
        userRole: "student_vip",
        date: new Date().toISOString().slice(0, 10),
        timeSlot: { startTime: "15:00", endTime: "16:00" },
        createdAt: now,
      },
    ],
    closedDays: [],
    settings: {
      studentReservationOpenTime: "21:00",
      vipAdvanceDays: 7,
      teacherAdvanceDays: 30,
      operatingStartTime: "09:00",
      operatingEndTime: "22:00",
      slotDurationMinutes: 60,
    },
  };
}

function getStore(): Store {
  const g = globalThis as unknown as { __estherPracticeRoomStore?: Store };
  if (!g.__estherPracticeRoomStore) g.__estherPracticeRoomStore = seed();
  return g.__estherPracticeRoomStore;
}

// === 연습실 관리 ===

export function listRooms() {
  return getStore().rooms.filter((r) => r.isActive).sort((a, b) => a.order - b.order);
}

export function listAllRooms() {
  return getStore().rooms.sort((a, b) => a.order - b.order);
}

export function getRoomById(id: string) {
  return getStore().rooms.find((r) => r.id === id) ?? null;
}

export function createRoom(data: { name: string; description?: string; roomType?: string; capacity?: number }) {
  const store = getStore();
  const maxOrder = Math.max(0, ...store.rooms.map((r) => r.order));
  const newRoom: PracticeRoom = {
    id: `room-${Date.now()}`,
    name: data.name,
    description: data.description,
    roomType: data.roomType || "general",
    isActive: true,
    order: maxOrder + 1,
    capacity: data.capacity || 1,
  };
  store.rooms.push(newRoom);
  return newRoom;
}

export function updateRoom(id: string, data: Partial<Pick<PracticeRoom, "name" | "description" | "roomType" | "isActive" | "order" | "capacity">>) {
  const store = getStore();
  const idx = store.rooms.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("연습실을 찾을 수 없습니다.");
  store.rooms[idx] = { ...store.rooms[idx], ...data };
  return store.rooms[idx];
}

export function deleteRoom(id: string) {
  const store = getStore();
  const idx = store.rooms.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  store.rooms.splice(idx, 1);
  return true;
}

// === 예약 관리 ===

export function listReservations(date?: string) {
  const store = getStore();
  if (date) {
    return store.reservations.filter((r) => r.date === date);
  }
  return store.reservations;
}

export function listReservationsForRoom(roomId: string, date: string) {
  return listReservations(date).filter((r) => r.roomId === roomId);
}

export function listReservationsForUser(userId: string) {
  return getStore().reservations.filter((r) => r.userId === userId);
}

export function getReservationById(id: string) {
  return getStore().reservations.find((r) => r.id === id) ?? null;
}

export function createReservation(data: {
  roomId: string;
  userId: string;
  userName: string;
  userRole: string;
  date: string;
  timeSlot: TimeSlot;
  note?: string;
}) {
  const store = getStore();
  
  // 중복 예약 확인
  const existing = store.reservations.find(
    (r) =>
      r.roomId === data.roomId &&
      r.date === data.date &&
      r.timeSlot.startTime === data.timeSlot.startTime
  );
  if (existing) throw new Error("이미 예약된 시간입니다.");
  
  // 휴무일 확인
  if (isClosedDay(data.date)) {
    throw new Error("휴무일에는 예약할 수 없습니다.");
  }
  
  const reservation: Reservation = {
    id: `res-${Date.now()}`,
    roomId: data.roomId,
    userId: data.userId,
    userName: data.userName,
    userRole: data.userRole,
    date: data.date,
    timeSlot: data.timeSlot,
    createdAt: new Date().toISOString(),
    note: data.note,
  };
  
  store.reservations.push(reservation);
  return reservation;
}

export function cancelReservation(id: string, userId: string, isAdmin: boolean) {
  const store = getStore();
  const idx = store.reservations.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("예약을 찾을 수 없습니다.");
  
  const reservation = store.reservations[idx];
  if (!isAdmin && reservation.userId !== userId) {
    throw new Error("본인의 예약만 취소할 수 있습니다.");
  }
  
  store.reservations.splice(idx, 1);
  return true;
}

// === 휴무일 관리 ===

export function listClosedDays() {
  return getStore().closedDays.sort((a, b) => a.date.localeCompare(b.date));
}

export function isClosedDay(date: string) {
  return getStore().closedDays.some((c) => c.date === date);
}

export function addClosedDay(date: string, reason?: string) {
  const store = getStore();
  if (isClosedDay(date)) throw new Error("이미 휴무일로 지정되어 있습니다.");
  
  const closedDay: ClosedDay = {
    id: `closed-${Date.now()}`,
    date,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.closedDays.push(closedDay);
  
  // 해당 날짜의 모든 예약 취소
  store.reservations = store.reservations.filter((r) => r.date !== date);
  
  return closedDay;
}

export function removeClosedDay(date: string) {
  const store = getStore();
  const idx = store.closedDays.findIndex((c) => c.date === date);
  if (idx < 0) return false;
  store.closedDays.splice(idx, 1);
  return true;
}

// === 설정 관리 ===

export function getSettings() {
  return getStore().settings;
}

export function updateSettings(data: Partial<ReservationSettings>) {
  const store = getStore();
  store.settings = { ...store.settings, ...data };
  return store.settings;
}

// === 예약 가능 여부 확인 ===

export function canUserReserve(
  userRole: string,
  targetDate: string,
  currentTime: Date = new Date()
): { canReserve: boolean; reason?: string } {
  const settings = getSettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // 휴무일 확인
  if (isClosedDay(targetDate)) {
    return { canReserve: false, reason: "휴무일입니다." };
  }
  
  // 과거 날짜 확인
  if (diffDays < 0) {
    return { canReserve: false, reason: "과거 날짜는 예약할 수 없습니다." };
  }
  
  // 선생님/관리자는 항상 예약 가능 (설정된 일수 내)
  if (userRole === "teacher" || userRole === "admin" || userRole === "master" || userRole === "staff") {
    if (diffDays > settings.teacherAdvanceDays) {
      return { canReserve: false, reason: `최대 ${settings.teacherAdvanceDays}일 전까지만 예약 가능합니다.` };
    }
    return { canReserve: true };
  }
  
  // VIP 학생(깍두기)은 설정된 일수 전부터 예약 가능
  if (userRole === "student_vip") {
    if (diffDays > settings.vipAdvanceDays) {
      return { canReserve: false, reason: `최대 ${settings.vipAdvanceDays}일 전까지만 예약 가능합니다.` };
    }
    return { canReserve: true };
  }
  
  // 일반 학생은 당일 또는 다음날만 예약 가능 (설정된 시간 이후)
  if (userRole === "student") {
    // 당일 예약은 항상 가능
    if (diffDays === 0) {
      return { canReserve: true };
    }
    
    // 다음날 예약은 설정된 시간 이후에만 가능
    if (diffDays === 1) {
      const [openH, openM] = settings.studentReservationOpenTime.split(":").map(Number);
      const openTime = new Date(currentTime);
      openTime.setHours(openH, openM, 0, 0);
      
      if (currentTime >= openTime) {
        return { canReserve: true };
      }
      return { canReserve: false, reason: `다음날 예약은 ${settings.studentReservationOpenTime}부터 가능합니다.` };
    }
    
    return { canReserve: false, reason: "일반 학생은 당일 또는 다음날만 예약할 수 있습니다." };
  }
  
  // 승인 대기 학생은 예약 불가
  if (userRole === "student_pending") {
    return { canReserve: false, reason: "계정 승인 후 예약할 수 있습니다." };
  }
  
  return { canReserve: false, reason: "예약 권한이 없습니다." };
}

// === 타임 슬롯 조회 ===

export function getAvailableTimeSlots(roomId: string, date: string) {
  const settings = getSettings();
  const allSlots = generateTimeSlots(
    settings.operatingStartTime,
    settings.operatingEndTime,
    settings.slotDurationMinutes
  );
  
  const reservedSlots = listReservationsForRoom(roomId, date);
  const reservedStartTimes = new Set(reservedSlots.map((r) => r.timeSlot.startTime));
  
  return allSlots.map((slot) => ({
    ...slot,
    isReserved: reservedStartTimes.has(slot.startTime),
    reservation: reservedSlots.find((r) => r.timeSlot.startTime === slot.startTime) ?? null,
  }));
}

export function getAllTimeSlots() {
  const settings = getSettings();
  return generateTimeSlots(
    settings.operatingStartTime,
    settings.operatingEndTime,
    settings.slotDurationMinutes
  );
}

// 내보내기
export const practiceRoomStore = {
  listRooms,
  listAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  listReservations,
  listReservationsForRoom,
  listReservationsForUser,
  getReservationById,
  createReservation,
  cancelReservation,
  listClosedDays,
  isClosedDay,
  addClosedDay,
  removeClosedDay,
  getSettings,
  updateSettings,
  canUserReserve,
  getAvailableTimeSlots,
  getAllTimeSlots,
};
