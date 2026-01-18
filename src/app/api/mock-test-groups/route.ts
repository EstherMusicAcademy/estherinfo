import { mockTestStore } from "@/lib/mockTestStore";
import { NextRequest, NextResponse } from "next/server";

// GET: 그룹 목록 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const session = searchParams.get("session");
  const major = searchParams.get("major") || undefined;

  const groups = mockTestStore.listGroups({
    year: year ? parseInt(year) : undefined,
    session: session ? parseInt(session) : undefined,
    major,
  });

  return NextResponse.json(groups);
}

// POST: 새 그룹 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, session, major, examDate } = body;

    if (!year || !session || !major) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newGroup = mockTestStore.createGroup({ 
      year, 
      session, 
      major,
      examDate: examDate || undefined,
    });
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
