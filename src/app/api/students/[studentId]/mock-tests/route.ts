import { NextResponse } from "next/server";
import { createMockTest, listMockTests, mockTestStore } from "@/lib/mockTestStore";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const mockTests = listMockTests({ studentId });
  const groups = mockTestStore.listGroups();
  return NextResponse.json({ mockTests, groups });
}

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const body = (await req.json()) as {
      groupId?: string;
      youtubeUrl?: string;
      songTitle?: string;
      artist?: string;
      studentName?: string;
      studentAge?: number;
    };
    
    const mockTest = createMockTest({
      studentId,
      groupId: body.groupId ?? "",
      youtubeUrl: body.youtubeUrl ?? "",
      songTitle: body.songTitle ?? "",
      artist: body.artist ?? "",
      studentName: body.studentName ?? "",
      studentAge: body.studentAge ?? 0,
    });
    return NextResponse.json({ mockTest }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

