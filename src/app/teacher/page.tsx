import Link from "next/link";

export default function TeacherPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">선생님</h1>
        <p className="mt-2 text-muted">
          내 학생 조회/업무일지 작성/서술형 평가 작성 및 학생 상세(모의고사/평가 목록)를 여기에 구현합니다. (과목은 전공/이론 분류 포함)
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">내 학생(데모)</h2>
          <p className="mt-1 text-sm text-muted">
            아직 Cognito 연동 전이라, 임시로 teacherId를 쿼리로 넘기는 방식으로 확인합니다.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link className="text-[color:var(--primary)] hover:underline" href="/teacher/students?teacherId=t-1">
              손서율(보컬) 내 학생 보기
            </Link>
            <Link
              className="text-[color:var(--primary)] hover:underline"
              href="/teacher/evaluations/new?teacherId=t-1"
            >
              손서율(보컬) 평가 작성
            </Link>
            <Link className="text-[color:var(--primary)] hover:underline" href="/teacher/students?teacherId=t-2">
              박성우(작곡) 내 학생 보기(승인/배정 후 확인)
            </Link>
            <Link
              className="text-[color:var(--primary)] hover:underline"
              href="/teacher/evaluations/new?teacherId=t-2"
            >
              박성우(작곡) 평가 작성(승인/배정 후 확인)
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

