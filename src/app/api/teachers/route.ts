import { NextResponse } from "next/server";
import { listTeachers } from "@/lib/userStore";

export async function GET() {
  return NextResponse.json({ teachers: listTeachers() });
}

