export type Evaluation = {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  teacherName?: string; // 작성자 이름
  evalDate: string; // YYYY-MM-DD
  content: string;
  createdAt: string;
};

type Store = {
  evaluations: Evaluation[];
};

function seed(): Evaluation[] {
  const now = new Date().toISOString();
  return [
    {
      id: "e-1",
      studentId: "s-1",
      subjectId: "1",
      teacherId: "t-1",
      teacherName: "손서율",
      evalDate: "2026-01-10",
      content: "호흡 안정이 좋아졌고 고음에서 힘이 덜 들어갑니다. 다음 주는 발성 연결을 더 다듬어요.",
      createdAt: now,
    },
  ];
}

function getStore(): Store {
  const g = globalThis as unknown as { __estherEvalStore?: Store };
  if (!g.__estherEvalStore) g.__estherEvalStore = { evaluations: seed() };
  return g.__estherEvalStore;
}

export function listEvaluationsForStudent(studentId: string): Evaluation[] {
  return getStore()
    .evaluations.filter((e) => e.studentId === studentId)
    .sort((a, b) => b.evalDate.localeCompare(a.evalDate));
}

export function createEvaluation(input: Omit<Evaluation, "id" | "createdAt">): Evaluation {
  const studentId = input.studentId.trim();
  const subjectId = input.subjectId.trim();
  const teacherId = input.teacherId.trim();
  const teacherName = input.teacherName?.trim();
  const evalDate = input.evalDate.trim();
  const content = input.content.trim();
  if (!studentId || !subjectId || !teacherId) throw new Error("필수값이 누락되었습니다.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(evalDate)) throw new Error("평가 날짜 형식이 올바르지 않습니다.");
  if (!content) throw new Error("평가 내용을 입력해주세요.");

  const e: Evaluation = {
    id: `e-${Date.now()}`,
    studentId,
    subjectId,
    teacherId,
    teacherName,
    evalDate,
    content,
    createdAt: new Date().toISOString(),
  };
  getStore().evaluations.unshift(e);
  return e;
}


// 평가 조회
export function getEvaluationById(id: string): Evaluation | undefined {
  return getStore().evaluations.find((e) => e.id === id);
}

// 평가 수정 (관리자 전용)
export function updateEvaluation(
  id: string,
  patch: Partial<Pick<Evaluation, "content" | "evalDate" | "subjectId" | "teacherName">>
): Evaluation | null {
  const evaluations = getStore().evaluations;
  const idx = evaluations.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  
  const current = evaluations[idx];
  const updated: Evaluation = {
    ...current,
    content: patch.content !== undefined ? patch.content.trim() : current.content,
    evalDate: patch.evalDate !== undefined ? patch.evalDate : current.evalDate,
    subjectId: patch.subjectId !== undefined ? patch.subjectId : current.subjectId,
    teacherName: patch.teacherName !== undefined ? patch.teacherName : current.teacherName,
  };
  
  evaluations[idx] = updated;
  return updated;
}

// 평가 삭제 (관리자 전용)
export function deleteEvaluation(id: string): boolean {
  const store = getStore();
  const idx = store.evaluations.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.evaluations.splice(idx, 1);
  return true;
}

// 모든 평가 조회
export function listAllEvaluations(): Evaluation[] {
  return getStore().evaluations.sort((a, b) => b.evalDate.localeCompare(a.evalDate));
}

// Alias functions (for compatibility)
export const addEvaluation = createEvaluation;
export const listEvaluationsByStudent = listEvaluationsForStudent;

// Store object (for consistency with other stores)
export const evaluationStore = {
  listEvaluationsByStudent: listEvaluationsForStudent,
  createEvaluation,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
  listAllEvaluations,
};
