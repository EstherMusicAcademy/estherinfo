import { mockTestStore } from "@/lib/mockTestStore";
import { NextResponse } from "next/server";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { createMockTestInputSchema } from "@/lib/schemas";

export const GET = withAuthDev(
  async (req: Request) => {
    try {
      const { searchParams } = new URL(req.url);
      const groupId = searchParams.get("groupId") || undefined;
      const studentId = searchParams.get("studentId") || undefined;
      const search = searchParams.get("search") || undefined;

      const mockTests = mockTestStore.listMockTests({ groupId, studentId, search });
      const groups = mockTestStore.listGroups();

      return NextResponse.json({ mockTests, groups });
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
      const parsed = createMockTestInputSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "Missing required fields");
      }

      const newMockTest = mockTestStore.createMockTest(parsed.data);
      return NextResponse.json(newMockTest, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
