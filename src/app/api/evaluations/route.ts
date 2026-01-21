import { NextResponse } from "next/server";
import { createEvaluation } from "@/lib/evaluationStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { createEvaluationSchema } from "@/lib/schemas";

export const POST = withAuthDev(
  async (req: Request, _user: AuthenticatedUser) => {
    try {
      const body = await req.json();
      const parsed = createEvaluationSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const evaluation = createEvaluation(parsed.data);
      return NextResponse.json({ evaluation }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
