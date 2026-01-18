"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EvaluationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/teacher/students");
  }, [router]);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-muted">학생 관리 페이지로 이동 중...</p>
      </div>
    </main>
  );
}
