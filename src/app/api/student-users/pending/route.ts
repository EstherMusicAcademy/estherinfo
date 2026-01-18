import { NextResponse } from "next/server";
import { listPendingStudents } from "@/lib/userStore";

export async function GET() {
  const students = listPendingStudents();
  return NextResponse.json({ students });
}
