import { NextResponse } from "next/server";
import { listStudents } from "@/lib/studentStore";

export async function GET() {
  return NextResponse.json({ students: listStudents() });
}

