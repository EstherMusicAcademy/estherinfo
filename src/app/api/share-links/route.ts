import { NextResponse } from "next/server";
import { shareLinkStore } from "@/lib/shareLinkStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    
    if (activeOnly) {
      // 활성 공유 링크가 있는 학생 ID 목록만 반환
      const activeStudentIds = shareLinkStore.getStudentsWithActiveLinks();
      return NextResponse.json({ activeStudentIds });
    }
    
    const links = shareLinkStore.listShareLinks();
    return NextResponse.json({ links });
  } catch (error) {
    console.error("Error listing share links:", error);
    return NextResponse.json({ error: "Failed to list share links" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, expiresAt } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const token = shareLinkStore.createShareLink(studentId, expiresAt || null);

    return NextResponse.json({ token, studentId, expiresAt });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
