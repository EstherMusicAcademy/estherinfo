export type ShareLink = {
  id: string;
  studentId: string;
  shareToken: string;
  expiresAt: string | null; // ISO or null
  isRevoked: boolean;
  viewCount: number;
  lastAccessed: string | null;
  createdAt: string;
};

type Store = { links: ShareLink[] };

function randomToken(len = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function getStore(): Store {
  const g = globalThis as unknown as { __estherShareStore?: Store };
  if (!g.__estherShareStore) {
    // 개발 편의: 언제나 확인 가능한 데모 토큰
    const now = new Date().toISOString();
    // 7일 후 만료 (데모용)
    const expiresIn7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    g.__estherShareStore = {
      links: [
        {
          id: "sl-demo",
          studentId: "s-1",
          shareToken: "demo-token",
          expiresAt: expiresIn7Days,
          isRevoked: false,
          viewCount: 0,
          lastAccessed: null,
          createdAt: now,
        },
      ],
    };
  }
  return g.__estherShareStore;
}

export function listShareLinksForStudent(studentId: string) {
  return getStore()
    .links.filter((l) => l.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listShareLinks() {
  return getStore().links.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createShareLink(studentId: string, expiresAt: string | null) {
  if (!studentId) throw new Error("studentId가 필요합니다.");
  const link: ShareLink = {
    id: `sl-${Date.now()}`,
    studentId,
    shareToken: randomToken(40),
    expiresAt,
    isRevoked: false,
    viewCount: 0,
    lastAccessed: null,
    createdAt: new Date().toISOString(),
  };
  getStore().links.unshift(link);
  return link;
}

export function revokeShareLink(id: string) {
  const store = getStore();
  const idx = store.links.findIndex((l) => l.id === id);
  if (idx < 0) throw new Error("링크를 찾을 수 없습니다.");
  store.links[idx] = { ...store.links[idx], isRevoked: true };
  return store.links[idx];
}

export function getShareLinkByToken(token: string) {
  return getStore().links.find((l) => l.shareToken === token) ?? null;
}

export function recordShareLinkAccess(token: string) {
  const store = getStore();
  const idx = store.links.findIndex((l) => l.shareToken === token);
  if (idx < 0) return null;
  const l = store.links[idx];
  const next: ShareLink = {
    ...l,
    viewCount: l.viewCount + 1,
    lastAccessed: new Date().toISOString(),
  };
  store.links[idx] = next;
  return next;
}

export function isExpired(link: ShareLink) {
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt).getTime() < Date.now();
}

export function deleteShareLink(studentId: string) {
  const store = getStore();
  const idx = store.links.findIndex((l) => l.studentId === studentId);
  if (idx < 0) return false;
  store.links.splice(idx, 1);
  return true;
}

// 활성 공유 링크가 있는 학생 ID 목록 반환
export function getStudentsWithActiveLinks(): string[] {
  const store = getStore();
  const now = Date.now();
  const activeStudentIds = new Set<string>();
  
  for (const link of store.links) {
    if (link.isRevoked) continue;
    if (link.expiresAt && new Date(link.expiresAt).getTime() < now) continue;
    activeStudentIds.add(link.studentId);
  }
  
  return Array.from(activeStudentIds);
}

// 객체 export
export const shareLinkStore = {
  listShareLinks,
  listShareLinksForStudent,
  createShareLink: (studentId: string, expiresAt: string | null) => {
    const link = createShareLink(studentId, expiresAt);
    return link.shareToken;
  },
  getShareLinkByToken,
  revokeShareLink,
  deleteShareLink,
  recordShareLinkAccess,
  isExpired,
  getStudentsWithActiveLinks,
};
