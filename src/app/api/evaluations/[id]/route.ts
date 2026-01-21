import { NextRequest, NextResponse } from "next/server";
import { getEvaluationById, updateEvaluation, deleteEvaluation } from "@/lib/evaluationStore";
import { extractAuthFromRequest, requireRole, authErrorResponse } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await extractAuthFromRequest();
  if (!authResult.success) {
    if (process.env.NODE_ENV !== "development") {
      return authErrorResponse(authResult.error, authResult.status);
    }
  }

  try {
    const { id } = await params;
    const evaluation = getEvaluationById(id);

    if (!evaluation) {
      throw ApiError.notFound("평가를 찾을 수 없습니다.");
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await extractAuthFromRequest();

  if (!authResult.success) {
    if (process.env.NODE_ENV === "development") {
      const devRole = req.headers.get("x-dev-role");
      if (devRole !== "admin") {
        return authErrorResponse("관리자만 평가를 수정할 수 있습니다.", 403);
      }
    } else {
      return authErrorResponse(authResult.error, authResult.status);
    }
  } else {
    const roleCheck = requireRole(authResult.user, ["admin"]);
    if (!roleCheck.allowed) {
      return authErrorResponse("관리자만 평가를 수정할 수 있습니다.", 403);
    }
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { content, evalDate, subjectId, teacherName } = body;

    const updated = updateEvaluation(id, { content, evalDate, subjectId, teacherName });

    if (!updated) {
      throw ApiError.notFound("평가를 찾을 수 없습니다.");
    }

    return NextResponse.json({ evaluation: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await extractAuthFromRequest();

  if (!authResult.success) {
    if (process.env.NODE_ENV === "development") {
      const devRole = req.headers.get("x-dev-role");
      if (devRole !== "admin") {
        return authErrorResponse("관리자만 평가를 삭제할 수 있습니다.", 403);
      }
    } else {
      return authErrorResponse(authResult.error, authResult.status);
    }
  } else {
    const roleCheck = requireRole(authResult.user, ["admin"]);
    if (!roleCheck.allowed) {
      return authErrorResponse("관리자만 평가를 삭제할 수 있습니다.", 403);
    }
  }

  try {
    const { id } = await params;
    const success = deleteEvaluation(id);

    if (!success) {
      throw ApiError.notFound("평가를 찾을 수 없습니다.");
    }

    return NextResponse.json({ success: true, message: "평가가 삭제되었습니다." });
  } catch (error) {
    return handleApiError(error);
  }
}
