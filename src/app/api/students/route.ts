import { NextResponse } from "next/server";
import { listStudents } from "@/lib/studentStore";
import { withAuthDev } from "@/lib/apiAuth";
import { handleApiError } from "@/lib/apiError";

export const GET = withAuthDev(
  async (_request: Request, _user) => {
    try {
      return NextResponse.json({ students: listStudents() });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher"] }
);
