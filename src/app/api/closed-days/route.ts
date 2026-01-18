import { NextResponse } from "next/server";
import { listClosedDays, addClosedDay, removeClosedDay, isClosedDay } from "@/lib/practiceRoomStore";

// GET: 휴무일 목록 조회
export async function GET() {
  const closedDays = listClosedDays();
  return NextResponse.json({ closedDays });
}

// POST: 휴무일 추가 (관리자 전용)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, reason, role } = body;
    
    // 역할 검증
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    
    if (!date) {
      return NextResponse.json({ error: "날짜를 입력해주세요." }, { status: 400 });
    }
    
    const closedDay = addClosedDay(date, reason);
    return NextResponse.json(closedDay, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "휴무일 추가에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE: 휴무일 삭제 (관리자 전용)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const role = searchParams.get("role");
    
    // 역할 검증
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    
    if (!date) {
      return NextResponse.json({ error: "날짜를 입력해주세요." }, { status: 400 });
    }
    
    const removed = removeClosedDay(date);
    if (!removed) {
      return NextResponse.json({ error: "휴무일을 찾을 수 없습니다." }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "휴무일 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
