import { NextResponse } from "next/server";
import { approveStudent, setStudentVip, updateUser } from "@/lib/userStore";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const body = await req.json();
    const { action, displayName, major, email, birthYear, phone } = body;

    // 승인 액션
    if (action === "approve") {
      const result = approveStudent(id);
      if (!result) {
        return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json({ success: true, student: result });
    }

    // VIP 설정 액션
    if (action === "setVip") {
      const result = setStudentVip(id, true);
      if (!result) {
        return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json({ success: true, student: result });
    }

    // VIP 해제 액션
    if (action === "removeVip") {
      const result = setStudentVip(id, false);
      if (!result) {
        return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json({ success: true, student: result });
    }

    // 일반 정보 수정
    const patch: Record<string, unknown> = {};
    if (displayName !== undefined) patch.displayName = displayName;
    if (major !== undefined) patch.major = major;
    if (email !== undefined) patch.email = email;
    if (birthYear !== undefined) patch.birthYear = Number(birthYear);
    if (phone !== undefined) patch.phone = phone;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
    }

    const result = updateUser(id, patch);
    if (!result) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, student: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "요청 처리 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const result = updateUser(id, { isActive: false });
    if (!result) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "삭제 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
