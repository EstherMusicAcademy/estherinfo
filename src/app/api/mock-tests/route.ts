import { mockTestStore } from "@/lib/mockTestStore";
import { NextRequest, NextResponse } from "next/server";

// GET: 모의고사 목록 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId") || undefined;
  const studentId = searchParams.get("studentId") || undefined;
  const search = searchParams.get("search") || undefined;

  const mockTests = mockTestStore.listMockTests({ groupId, studentId, search });
  const groups = mockTestStore.listGroups();

  return NextResponse.json({ mockTests, groups });
}

// POST: 새 모의고사 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { groupId, youtubeUrl, songTitle, artist, studentId, studentName, studentAge } = body;

    if (!groupId || !youtubeUrl || !songTitle || !artist || !studentId || !studentName || !studentAge) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newMockTest = mockTestStore.createMockTest({
      groupId,
      youtubeUrl,
      songTitle,
      artist,
      studentId,
      studentName,
      studentAge,
    });

    return NextResponse.json(newMockTest, { status: 201 });
  } catch (error) {
    console.error("Error creating mock test:", error);
    return NextResponse.json(
      { error: "Failed to create mock test" },
      { status: 500 }
    );
  }
}
