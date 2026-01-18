import { NextResponse } from "next/server";
import { getRoomById, updateRoom, deleteRoom } from "@/lib/practiceRoomStore";

type RouteContext = { params: Promise<{ roomId: string }> };

// GET: 특정 연습실 조회
export async function GET(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const room = getRoomById(roomId);
  
  if (!room) {
    return NextResponse.json({ error: "연습실을 찾을 수 없습니다." }, { status: 404 });
  }
  
  return NextResponse.json(room);
}

// PATCH: 연습실 수정 (관리자 전용)
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const body = await request.json();
    const { name, description, roomType, isActive, order, capacity } = body;
    
    // 수정할 데이터만 필터링
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (roomType !== undefined) updateData.roomType = roomType;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;
    if (capacity !== undefined) updateData.capacity = capacity;
    
    const room = updateRoom(roomId, updateData);
    return NextResponse.json(room);
  } catch (error) {
    const message = error instanceof Error ? error.message : "연습실 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE: 연습실 삭제 (관리자 전용)
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    
    // 역할 검증
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    
    const deleted = deleteRoom(roomId);
    if (!deleted) {
      return NextResponse.json({ error: "연습실을 찾을 수 없습니다." }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "연습실 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
