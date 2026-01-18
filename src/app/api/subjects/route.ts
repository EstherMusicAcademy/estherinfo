import { NextResponse } from "next/server";
import { createSubject, deleteSubject, listSubjects, updateSubject } from "@/lib/subjectStore";

export async function GET() {
  return NextResponse.json({ subjects: listSubjects() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; category?: "major" | "theory" };
    const subject = createSubject({ name: body.name ?? "", category: body.category ?? "major" });
    return NextResponse.json({ subject }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      name?: string;
      category?: "major" | "theory";
      isActive?: boolean;
    };
    if (!body.id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    const subject = updateSubject(body.id, {
      name: body.name,
      category: body.category,
      isActive: body.isActive,
    });
    return NextResponse.json({ subject });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    deleteSubject(body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "요청이 실패했습니다." }, { status: 400 });
  }
}

