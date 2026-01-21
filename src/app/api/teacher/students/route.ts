import { NextResponse } from "next/server";
import { listStudentsForTeacher } from "@/lib/studentStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";

export const GET = withAuthDev(
  async (req: Request, user: AuthenticatedUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const teacherId = searchParams.get("teacherId");

      if (!teacherId) {
        throw ApiError.validation("teacherId가 필요합니다.");
      }

      if (user.role === "teacher" && user.sub !== teacherId) {
        throw ApiError.forbidden("다른 선생님의 학생 목록을 조회할 수 없습니다.");
      }

      return NextResponse.json({ students: listStudentsForTeacher(teacherId) });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
