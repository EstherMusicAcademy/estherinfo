export type MockTestGroup = {
  id: string;
  year: number;
  session: number;
  major: string;
  examDate?: string; // 모의고사 시행 날짜
  createdAt: string;
};

export type MockTest = {
  id: string;
  groupId: string; // 그룹 ID
  youtubeUrl: string;
  songTitle: string;
  artist: string;
  studentId: string;
  studentName: string;
  studentAge: number;
  createdAt: string;
};

type Store = {
  groups: MockTestGroup[];
  mockTests: MockTest[];
};

function seed(): Store {
  const now = new Date().toISOString();
  
  const groups: MockTestGroup[] = [
    {
      id: "group-1",
      year: 2026,
      session: 1,
      major: "보컬",
      examDate: "2026-01-10",
      createdAt: now,
    },
    {
      id: "group-2",
      year: 2026,
      session: 1,
      major: "피아노",
      examDate: "2026-01-12",
      createdAt: now,
    },
  ];

  const mockTests: MockTest[] = [
    {
      id: "mt-1",
      groupId: "group-1",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      songTitle: "좋은 날",
      artist: "아이유",
      studentId: "s-1",
      studentName: "김민준",
      studentAge: 18,
      createdAt: now,
    },
    {
      id: "mt-2",
      groupId: "group-1",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      songTitle: "밤편지",
      artist: "아이유",
      studentId: "s-2",
      studentName: "이서준",
      studentAge: 17,
      createdAt: now,
    },
    {
      id: "mt-3",
      groupId: "group-2",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      songTitle: "River Flows in You",
      artist: "이루마",
      studentId: "s-3",
      studentName: "박하은",
      studentAge: 16,
      createdAt: now,
    },
  ];

  return { groups, mockTests };
}

const store: Store = seed();

export const mockTestStore = {
  // Groups
  listGroups(params?: { year?: number; session?: number; major?: string }) {
    let filtered = store.groups;
    if (params?.year) {
      filtered = filtered.filter((g) => g.year === params.year);
    }
    if (params?.session) {
      filtered = filtered.filter((g) => g.session === params.session);
    }
    if (params?.major) {
      filtered = filtered.filter((g) => g.major === params.major);
    }
    return filtered.sort((a, b) => b.year - a.year || b.session - a.session);
  },

  getGroup(id: string) {
    return store.groups.find((g) => g.id === id);
  },

  createGroup(data: Omit<MockTestGroup, "id" | "createdAt">) {
    const newGroup: MockTestGroup = {
      ...data,
      id: `group-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.groups.push(newGroup);
    return newGroup;
  },

  updateGroup(id: string, updates: Partial<Omit<MockTestGroup, "id" | "createdAt">>) {
    const idx = store.groups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    store.groups[idx] = { ...store.groups[idx], ...updates };
    return store.groups[idx];
  },

  deleteGroup(id: string) {
    // 그룹에 속한 모의고사도 함께 삭제
    store.mockTests = store.mockTests.filter((mt) => mt.groupId !== id);
    const idx = store.groups.findIndex((g) => g.id === id);
    if (idx === -1) return false;
    store.groups.splice(idx, 1);
    return true;
  },

  // Mock Tests
  listMockTests(params?: { groupId?: string; studentId?: string; search?: string }) {
    let filtered = store.mockTests;
    
    if (params?.groupId) {
      filtered = filtered.filter((mt) => mt.groupId === params.groupId);
    }
    
    if (params?.studentId) {
      filtered = filtered.filter((mt) => mt.studentId === params.studentId);
    }
    
    if (params?.search) {
      const lowerSearch = params.search.toLowerCase();
      filtered = filtered.filter(
        (mt) =>
          mt.songTitle.toLowerCase().includes(lowerSearch) ||
          mt.artist.toLowerCase().includes(lowerSearch) ||
          mt.studentName.toLowerCase().includes(lowerSearch)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getMockTest(id: string) {
    return store.mockTests.find((mt) => mt.id === id);
  },

  createMockTest(data: Omit<MockTest, "id" | "createdAt">) {
    const newMockTest: MockTest = {
      ...data,
      id: `mt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.mockTests.push(newMockTest);
    return newMockTest;
  },

  updateMockTest(id: string, updates: Partial<Omit<MockTest, "id" | "createdAt">>) {
    const idx = store.mockTests.findIndex((mt) => mt.id === id);
    if (idx === -1) return null;
    store.mockTests[idx] = { ...store.mockTests[idx], ...updates };
    return store.mockTests[idx];
  },

  deleteMockTest(id: string) {
    const idx = store.mockTests.findIndex((mt) => mt.id === id);
    if (idx === -1) return false;
    store.mockTests.splice(idx, 1);
    return true;
  },
};

// 개별 export 함수들 (편의용)
export function listMockTests(params?: { groupId?: string; studentId?: string; search?: string }) {
  return mockTestStore.listMockTests(params);
}

export function getMockTestById(id: string) {
  return mockTestStore.getMockTest(id);
}

export function createMockTest(data: Omit<MockTest, "id" | "createdAt">) {
  return mockTestStore.createMockTest(data);
}

export function updateMockTest(id: string, updates: Partial<Omit<MockTest, "id" | "createdAt">>) {
  return mockTestStore.updateMockTest(id, updates);
}

export function deleteMockTest(id: string) {
  return mockTestStore.deleteMockTest(id);
}
