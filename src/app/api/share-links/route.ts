import { NextResponse } from "next/server";
import { shareLinkStore } from "@/lib/shareLinkStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { createShareLinkSchema } from "@/lib/schemas";

export const GET = withAuthDev(
  async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const activeOnly = searchParams.get("activeOnly") === "true";

      if (activeOnly) {
        const activeStudentIds = shareLinkStore.getStudentsWithActiveLinks();
        return NextResponse.json({ activeStudentIds });
      }

      const links = shareLinkStore.listShareLinks();
      return NextResponse.json({ links });
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
      const parsed = createShareLinkSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "studentId is required");
      }

      const token = shareLinkStore.createShareLink(
        parsed.data.studentId,
        parsed.data.expiresAt || null
      );

      return NextResponse.json({
        token,
        studentId: parsed.data.studentId,
        expiresAt: parsed.data.expiresAt,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
