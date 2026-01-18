import { NextResponse } from "next/server";
import {
  listReservations,
  listReservationsForUser,
  createReservation,
  getAvailableTimeSlots,
  canUserReserve,
  getAllTimeSlots,
} from "@/lib/practiceRoomStore";

// GET: 예약 목록 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");
  const roomId = searchParams.get("roomId");
  
  // 특정 사용자의 예약 목록
  if (userId) {
    const reservations = listReservationsForUser(userId);
    return NextResponse.json({ reservations });
  }
  
  // 특정 날짜 + 연습실의 타임 슬롯 (예약 포함)
  if (date && roomId) {
    const slots = getAvailableTimeSlots(roomId, date);
    return NextResponse.json({ slots, date, roomId });
  }
  
  // 특정 날짜의 모든 예약
  const reservations = listReservations(date || undefined);
  const allSlots = getAllTimeSlots();
  
  return NextResponse.json({ reservations, allSlots, date });
}

// POST: 새 예약 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, userId, userName, userRole, date, timeSlot, note } = body;
    
    // 필수 필드 검증
    if (!roomId || !userId || !userName || !userRole || !date || !timeSlot) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }
    
    // 예약 가능 여부 확인
    const canReserveResult = canUserReserve(userRole, date);
    if (!canReserveResult.canReserve) {
      return NextResponse.json({ error: canReserveResult.reason }, { status: 403 });
    }
    
    const reservation = createReservation({
      roomId,
      userId,
      userName,
      userRole,
      date,
      timeSlot,
      note,
    });
    
    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "예약 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
