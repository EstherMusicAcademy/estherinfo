import { NextRequest, NextResponse } from "next/server";
import { listWorkLogs, createWorkLog } from "@/lib/workLogStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    
    const workLogs = listWorkLogs({ startDate, endDate });
    
    return NextResponse.json({ workLogs });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, teacherName, date, schedule, notes, students } = body;
    
    if (!teacherId || !teacherName || !date) {
      return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
    }
    
    const workLog = createWorkLog({
      teacherId,
      teacherName,
      date,
      schedule: schedule || "",
      notes: notes || "",
      students: students || [],
    });
    
    return NextResponse.json({ workLog }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "생성 실패" }, { status: 500 });
  }
}
