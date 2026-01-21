import { NextRequest, NextResponse } from "next/server";
import { listWorkLogs, createWorkLog } from "@/lib/workLogStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { createWorkLogInputSchema } from "@/lib/schemas";

export const GET = withAuthDev(
  async (req: Request) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const workLogs = listWorkLogs({ startDate, endDate });
      return NextResponse.json({ workLogs });
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
      const parsed = createWorkLogInputSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "필수 필드 누락");
      }

      const workLog = createWorkLog({
        teacherId: parsed.data.teacherId,
        teacherName: parsed.data.teacherName,
        date: parsed.data.date,
        schedule: parsed.data.schedule || "",
        notes: parsed.data.notes || "",
        students: parsed.data.students || [],
      });

      return NextResponse.json({ workLog }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
