import { NextResponse } from "next/server";
import { createEvaluation } from "@/lib/evaluationStore";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      studentId?: string;
      subjectId?: string;
      teacherId?: string;
      evalDate?: string;
      content?: string;
    };
    const evaluation = createEvaluation({
      studentId: body.studentId ?? "",
      subjectId: body.subjectId ?? "",
      teacherId: body.teacherId ?? "",
      evalDate: body.evalDate ?? "",
      content: body.content ?? "",
    });
    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

