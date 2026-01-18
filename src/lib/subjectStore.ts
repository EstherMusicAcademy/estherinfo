export type SubjectCategory = "major" | "theory";

export type Subject = {
  id: string;
  name: string;
  category: SubjectCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  subjects: Subject[];
};

function seed(): Subject[] {
  const now = new Date().toISOString();
  return [
    { id: "1", name: "보컬", category: "major", isActive: true, createdAt: now, updatedAt: now },
    { id: "2", name: "피아노", category: "major", isActive: true, createdAt: now, updatedAt: now },
    { id: "3", name: "작곡", category: "major", isActive: true, createdAt: now, updatedAt: now },
    { id: "4", name: "재즈화성학", category: "theory", isActive: true, createdAt: now, updatedAt: now },
  ];
}

function getStore(): Store {
  const g = globalThis as unknown as { __estherStore?: Store };
  if (!g.__estherStore) g.__estherStore = { subjects: seed() };
  return g.__estherStore;
}

export function listSubjects(): Subject[] {
  return [...getStore().subjects].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function getSubjectById(id: string) {
  return getStore().subjects.find((s) => s.id === id) ?? null;
}

export function createSubject(input: { name: string; category: SubjectCategory }): Subject {
  const store = getStore();
  const name = input.name.trim();
  if (!name) throw new Error("과목명을 입력해주세요.");
  if (store.subjects.some((s) => s.name === name)) throw new Error("이미 존재하는 과목명입니다.");

  const now = new Date().toISOString();
  const subject: Subject = {
    id: String(Date.now()),
    name,
    category: input.category,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  store.subjects.unshift(subject);
  return subject;
}

export function updateSubject(
  id: string,
  patch: Partial<Pick<Subject, "name" | "category" | "isActive">>,
): Subject {
  const store = getStore();
  const idx = store.subjects.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("과목을 찾을 수 없습니다.");

  const current = store.subjects[idx];
  const nextName = patch.name !== undefined ? patch.name.trim() : current.name;
  if (!nextName) throw new Error("과목명을 입력해주세요.");
  if (nextName !== current.name && store.subjects.some((s) => s.name === nextName)) {
    throw new Error("이미 존재하는 과목명입니다.");
  }

  // undefined인 필드는 현재 값을 유지
  const next: Subject = {
    ...current,
    name: nextName,
    category: patch.category !== undefined ? patch.category : current.category,
    isActive: patch.isActive !== undefined ? patch.isActive : current.isActive,
    updatedAt: new Date().toISOString(),
  };
  store.subjects[idx] = next;
  return next;
}

export function deleteSubject(id: string) {
  const store = getStore();
  store.subjects = store.subjects.filter((s) => s.id !== id);
}

