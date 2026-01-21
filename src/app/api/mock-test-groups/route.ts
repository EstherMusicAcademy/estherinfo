import { mockTestStore } from "@/lib/mockTestStore";
import { NextResponse } from "next/server";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { createMockTestGroupSchema } from "@/lib/schemas";

export const GET = withAuthDev(
  async (req: Request) => {
    try {
      const { searchParams } = new URL(req.url);
      const year = searchParams.get("year");
      const session = searchParams.get("session");
      const major = searchParams.get("major") || undefined;

      const groups = mockTestStore.listGroups({
        year: year ? parseInt(year) : undefined,
        session: session ? parseInt(session) : undefined,
        major,
      });

      return NextResponse.json(groups);
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
      const parsed = createMockTestGroupSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "Missing required fields");
      }

      const newGroup = mockTestStore.createGroup(parsed.data);
      return NextResponse.json(newGroup, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);
