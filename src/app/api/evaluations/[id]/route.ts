// /api/evaluations/[id]/route.ts - 평가 수정/삭제 API (관리자 전용)
import { NextRequest, NextResponse } from "next/server";
import { getEvaluationById, updateEvaluation, deleteEvaluation } from "@/lib/evaluationStore";

// 관리자 역할 체크 (개발용 헤더 기반)
function getRole(req: NextRequest): string {
  return req.headers.get("x-dev-role") || "guest";
}

// 평가 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evaluation = getEvaluationById(id);
  
  if (!evaluation) {
    return NextResponse.json({ error: "평가를 찾을 수 없습니다." }, { status: 404 });
  }
  
  return NextResponse.json({ evaluation });
}

// 평가 수정 (관리자 전용)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = getRole(req);
  
  // 관리자만 수정 가능
  if (role !== "admin") {
    return NextResponse.json(
      { error: "관리자만 평가를 수정할 수 있습니다." },
      { status: 403 }
    );
  }
  
  const { id } = await params;
  const body = await req.json();
  const { content, evalDate, subjectId, teacherName } = body;
  
  const updated = updateEvaluation(id, { content, evalDate, subjectId, teacherName });
  
  if (!updated) {
    return NextResponse.json({ error: "평가를 찾을 수 없습니다." }, { status: 404 });
  }
  
  return NextResponse.json({ evaluation: updated });
}

// 평가 삭제 (관리자 전용)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = getRole(req);
  
  // 관리자만 삭제 가능
  if (role !== "admin") {
    return NextResponse.json(
      { error: "관리자만 평가를 삭제할 수 있습니다." },
      { status: 403 }
    );
  }
  
  const { id } = await params;
  const success = deleteEvaluation(id);
  
  if (!success) {
    return NextResponse.json({ error: "평가를 찾을 수 없습니다." }, { status: 404 });
  }
  
  return NextResponse.json({ success: true, message: "평가가 삭제되었습니다." });
}
