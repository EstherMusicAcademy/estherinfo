import { NextRequest, NextResponse } from "next/server";
import { getWorkLog, updateWorkLog, deleteWorkLog } from "@/lib/workLogStore";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const workLog = getWorkLog(id);
    
    if (!workLog) {
      return NextResponse.json({ error: "업무일지를 찾을 수 없습니다" }, { status: 404 });
    }
    
    return NextResponse.json({ workLog });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 실패" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, schedule, notes, students } = body;
    
    const workLog = updateWorkLog(id, { date, schedule, notes, students });
    
    return NextResponse.json({ workLog });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    deleteWorkLog(id);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "삭제 실패" }, { status: 500 });
  }
}
