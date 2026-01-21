import { NextResponse } from "next/server";
import { createSubject, deleteSubject, listSubjects, updateSubject } from "@/lib/subjectStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { z } from "zod";

const createSubjectSchema = z.object({
  name: z.string().min(1, "과목 이름을 입력해주세요."),
  category: z.enum(["major", "theory"]).default("major"),
});

const updateSubjectSchema = z.object({
  id: z.string().min(1, "id가 필요합니다."),
  name: z.string().optional(),
  category: z.enum(["major", "theory"]).optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAuthDev(
  async (_request: Request, _user) => {
    try {
      return NextResponse.json({ subjects: listSubjects() });
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
      const parsed = createSubjectSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const subject = createSubject(parsed.data);
      return NextResponse.json({ subject }, { status: 201 });
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
      const parsed = updateSubjectSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const { id, ...patch } = parsed.data;
      const subject = updateSubject(id, patch);
      return NextResponse.json({ subject });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);

export const DELETE = withAuthDev(
  async (req: Request, _user: AuthenticatedUser) => {
    try {
      const body = await req.json();
      const { id } = body as { id?: string };

      if (!id) {
        throw ApiError.validation("id가 필요합니다.");
      }

      deleteSubject(id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);
