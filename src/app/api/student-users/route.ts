import { NextResponse } from "next/server";
import { listStudentUsers, createStudentUser } from "@/lib/userStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { z } from "zod";

const createStudentUserSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요."),
  displayName: z.string().min(1, "이름을 입력해주세요."),
  major: z.string().min(1, "전공을 입력해주세요."),
  birthYear: z.number().int().optional(),
  phone: z.string().optional(),
});

export const GET = withAuthDev(
  async (_request: Request, _user) => {
    try {
      const students = listStudentUsers();
      return NextResponse.json({ students });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);

export const POST = withAuthDev(
  async (req: Request, _user: AuthenticatedUser) => {
    try {
      const body = await req.json();
      const parsed = createStudentUserSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const student = createStudentUser({
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        major: parsed.data.major,
        birthYear: parsed.data.birthYear,
        phone: parsed.data.phone,
      });

      return NextResponse.json({ student }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);
