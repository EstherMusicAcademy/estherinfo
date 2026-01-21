import { NextResponse } from "next/server";
import { createStudent, listStudents, updateStudent } from "@/lib/studentStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { createStudentSchema, updateStudentSchema } from "@/lib/schemas";

export const GET = withAuthDev(
  async (_request: Request, _user) => {
    try {
      return NextResponse.json({ students: listStudents() });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);

export const POST = withAuthDev(
  async (req: Request, _user: AuthenticatedUser) => {
    try {
      const body = await req.json();
      const parsed = createStudentSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const student = createStudent(parsed.data);
      return NextResponse.json({ student }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);

export const PATCH = withAuthDev(
  async (req: Request, _user: AuthenticatedUser) => {
    try {
      const body = await req.json();
      const parsed = updateStudentSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const { id, ...patch } = parsed.data;
      const student = updateStudent(id, patch);
      return NextResponse.json({ student });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);
