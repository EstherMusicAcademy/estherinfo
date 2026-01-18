import { NextResponse } from "next/server";
import { getMockTestById, updateMockTest, deleteMockTest } from "@/lib/mockTestStore";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mockTest = getMockTestById(id);
  
  if (!mockTest) {
    return NextResponse.json({ error: "모의고사를 찾을 수 없습니다." }, { status: 404 });
  }
  
  return NextResponse.json({ mockTest });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const mockTest = updateMockTest(id, body);
    return NextResponse.json({ mockTest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "수정 실패" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteMockTest(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "삭제 실패" },
      { status: 400 }
    );
  }
}
