import { NextResponse } from "next/server";
import { listTeachers } from "@/lib/userStore";
import { withAuthDev } from "@/lib/apiAuth";
import { handleApiError } from "@/lib/apiError";

export const GET = withAuthDev(
  async (_request: Request, _user) => {
    try {
      return NextResponse.json({ teachers: listTeachers() });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
