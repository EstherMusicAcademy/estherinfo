// /apps/web/src/app/api/mock-test-groups/[groupId]/route.ts
import { mockTestStore } from "@/lib/mockTestStore";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET: 단일 그룹 조회
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { groupId } = await params;
  const group = mockTestStore.getGroup(groupId);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

// PATCH: 그룹 수정
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const body = await req.json();
    const { year, session, major, examDate } = body;

    const updated = mockTestStore.updateGroup(groupId, {
      ...(year !== undefined && { year }),
      ...(session !== undefined && { session }),
      ...(major !== undefined && { major }),
      ...(examDate !== undefined && { examDate }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE: 그룹 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const deleted = mockTestStore.deleteGroup(groupId);

    if (!deleted) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
