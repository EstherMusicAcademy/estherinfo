import { NextResponse } from "next/server";
import {
  listRooms,
  listAllRooms,
  createRoom,
  getSettings,
  updateSettings,
} from "@/lib/practiceRoomStore";

// GET: 연습실 목록 조회 또는 설정만 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const type = searchParams.get("type");
  
  // 설정만 조회
  if (type === "settings") {
    const settings = getSettings();
    return NextResponse.json({ settings });
  }
  
  const rooms = includeInactive ? listAllRooms() : listRooms();
  const settings = getSettings();
  
  return NextResponse.json({ rooms, settings });
}

// POST: 새 연습실 생성 (관리자 전용)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, roomType, capacity, role } = body;
    
    // 역할 검증
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "연습실 이름을 입력해주세요." }, { status: 400 });
    }
    
    const room = createRoom({ 
      name: name.trim(), 
      description: description?.trim(),
      roomType: roomType || "general",
      capacity: capacity || 1,
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "연습실 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PUT: 설정 업데이트 (관리자 전용)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, settings: newSettings } = body;
    
    if (type !== "settings") {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }
    
    const settings = updateSettings(newSettings);
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "설정 업데이트에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PATCH: 설정 업데이트 (관리자 전용) - 이전 버전 호환
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { role, settings: newSettings } = body;
    
    // 역할 검증
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    
    const settings = updateSettings(newSettings);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "설정 업데이트에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
