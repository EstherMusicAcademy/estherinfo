import { NextResponse } from "next/server";
import { shareLinkStore } from "@/lib/shareLinkStore";

type Params = { params: Promise<{ studentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { studentId } = await params;
    const deleted = shareLinkStore.deleteShareLink(studentId);
    
    if (!deleted) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting share link:", error);
    return NextResponse.json({ error: "Failed to delete share link" }, { status: 500 });
  }
}
