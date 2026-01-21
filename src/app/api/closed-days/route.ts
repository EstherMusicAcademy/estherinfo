import { NextResponse } from "next/server";
import { listClosedDays, addClosedDay, removeClosedDay } from "@/lib/practiceRoomStore";
import { withAuthDev, extractAuthFromRequest, requireRole, authErrorResponse, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { z } from "zod";

const addClosedDaySchema = z.object({
  date: z.string().min(1, "날짜를 입력해주세요."),
  reason: z.string().optional(),
});

export const GET = withAuthDev(
  async (_request: Request, _user) => {
    try {
      const closedDays = listClosedDays();
      return NextResponse.json({ closedDays });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher", "student"] }
);

export const POST = withAuthDev(
  async (request: Request, _user: AuthenticatedUser) => {
    try {
      const body = await request.json();
      const parsed = addClosedDaySchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "날짜를 입력해주세요.");
      }

      const closedDay = addClosedDay(parsed.data.date, parsed.data.reason);
      return NextResponse.json(closedDay, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);

export const DELETE = withAuthDev(
  async (request: Request, _user: AuthenticatedUser) => {
    try {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get("date");

      if (!date) {
        throw ApiError.validation("날짜를 입력해주세요.");
      }

      const removed = removeClosedDay(date);
      if (!removed) {
        throw ApiError.notFound("휴무일을 찾을 수 없습니다.");
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);
