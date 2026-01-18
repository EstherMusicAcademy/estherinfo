import { NextResponse } from "next/server";
import { getReservationById, cancelReservation } from "@/lib/practiceRoomStore";

type RouteContext = { params: Promise<{ id: string }> };

// GET: 특정 예약 조회
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const reservation = getReservationById(id);
  
  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  
  return NextResponse.json(reservation);
}

// DELETE: 예약 취소
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");
    
    if (!userId) {
      return NextResponse.json({ error: "사용자 정보가 필요합니다." }, { status: 400 });
    }
    
    const isAdmin = role === "admin" || role === "master" || role === "staff";
    cancelReservation(id, userId, isAdmin);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "예약 취소에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
