import { NextResponse } from "next/server";
import { listEvaluationsForStudent, addEvaluation } from "@/lib/evaluationStore";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return NextResponse.json({ evaluations: listEvaluationsForStudent(studentId) });
}

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const body = await req.json();
  
  const { teacherId, subjectId, evalDate, content } = body;
  
  if (!teacherId || !subjectId || !evalDate || !content) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  
  const evaluation = addEvaluation({
    studentId,
    teacherId,
    subjectId,
    evalDate,
    content,
  });
  
  return NextResponse.json({ evaluation }, { status: 201 });
}