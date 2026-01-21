"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRole } from "@/components/role/RoleProvider";
import { extractYouTubeId } from "@/lib/youtube";
import { IconWarning } from "@/components/icons/UiIcons";

type MockTestGroup = {
  id: string;
  year: number;
  session: number;
  major: string;
  examDate?: string;
  createdAt: string;
};

type MockTest = {
  id: string;
  groupId: string;
  youtubeUrl: string;
  songTitle: string;
  artist: string;
  studentId: string;
  studentName: string;
  studentAge: number;
  createdAt: string;
};

type Student = {
  id: string;
  name: string;
  birthYear: number;
  major?: string;
};

export default function MockTestsPage() {
  const { role } = useRole();
  const [groups, setGroups] = useState<MockTestGroup[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Group Form
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({ year: 2026, session: 1, major: "보컬", examDate: "" });

  // Mock Test Form
  const [showMockTestForm, setShowMockTestForm] = useState(false);
  const [mockTestForm, setMockTestForm] = useState({
    groupId: "",
    youtubeUrl: "",
    songTitle: "",
    artist: "",
    studentId: "",
  });

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterSession, setFilterSession] = useState<string>("");
  const [filterMajor, setFilterMajor] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<MockTest | null>(null);

  // Group Edit
  const [editingGroup, setEditingGroup] = useState<MockTestGroup | null>(null);
  const [editGroupForm, setEditGroupForm] = useState({ year: 2026, session: 1, major: "보컬", examDate: "" });

  // Student selection filters for mock test form
  const [studentSearch, setStudentSearch] = useState("");
  const [studentMajorFilter, setStudentMajorFilter] = useState("");

  const majors = ["보컬", "피아노", "드럼", "기타", "베이스", "작곡"];
  
  // 고유 년도 목록
  const uniqueYears = useMemo(() => {
    const years = new Set(groups.map((g) => g.year));
    return Array.from(years).sort((a, b) => b - a); // 최신 년도 우선
  }, [groups]);

  // 고유 차수 목록
  const uniqueSessions = useMemo(() => {
    const sessions = new Set(groups.map((g) => g.session));
    return Array.from(sessions).sort((a, b) => a - b);
  }, [groups]);

  // 학생 검색 및 전공 필터링
  const filteredStudents = useMemo(() => {
    let result = students;
    if (studentSearch.trim()) {
      const searchLower = studentSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(searchLower));
    }
    if (studentMajorFilter) {
      result = result.filter((s) => s.major === studentMajorFilter);
    }
    return result;
  }, [students, studentSearch, studentMajorFilter]);

  // 전체보기는 관리자/직원만 접근 가능
  const canAccess = role === "admin" || role === "staff";

  useEffect(() => {
    if (!canAccess) return;
    fetchData();
  }, [canAccess]);

  async function fetchData() {
    try {
      setLoading(true);
      const [mockTestsRes, studentsRes] = await Promise.all([
        fetch("/api/mock-tests"),
        fetch("/api/students"),
      ]);

      const mockTestsData = await mockTestsRes.json();
      const studentsData = await studentsRes.json();

      setGroups(mockTestsData.groups || []);
      setMockTests(mockTestsData.mockTests || []);
      setStudents(studentsData?.students || studentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    try {
      const res = await fetch("/api/mock-test-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupForm),
      });

      if (res.ok) {
        await fetchData();
        setShowGroupForm(false);
        setGroupForm({ year: 2026, session: 1, major: "보컬", examDate: "" });
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  }

  async function handleCreateMockTest() {
    try {
      const selectedStudent = students.find((s) => s.id === mockTestForm.studentId);
      if (!selectedStudent) {
        alert("학생을 선택해주세요.");
        return;
      }

      const res = await fetch("/api/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mockTestForm,
          studentName: selectedStudent.name,
          studentAge: new Date().getFullYear() - selectedStudent.birthYear + 1,
        }),
      });

      if (res.ok) {
        await fetchData();
        setShowMockTestForm(false);
        setMockTestForm({
          groupId: "",
          youtubeUrl: "",
          songTitle: "",
          artist: "",
          studentId: "",
        });
      }
    } catch (error) {
      console.error("Error creating mock test:", error);
    }
  }

  // 그룹 수정
  function openEditGroup(group: MockTestGroup) {
    setEditingGroup(group);
    setEditGroupForm({
      year: group.year,
      session: group.session,
      major: group.major,
      examDate: group.examDate || "",
    });
  }

  async function handleUpdateGroup() {
    if (!editingGroup) return;
    try {
      const res = await fetch(`/api/mock-test-groups/${editingGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editGroupForm),
      });

      if (res.ok) {
        await fetchData();
        setEditingGroup(null);
      }
    } catch (error) {
      console.error("Error updating group:", error);
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm("이 그룹과 그룹 내 모든 영상을 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/mock-test-groups/${groupId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  }

  // 그룹별로 영상을 그룹화
  const groupedMockTests = useMemo(() => {
    let filtered = mockTests;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (mt) =>
          mt.songTitle.toLowerCase().includes(lowerSearch) ||
          mt.artist.toLowerCase().includes(lowerSearch) ||
          mt.studentName.toLowerCase().includes(lowerSearch)
      );
    }

    // 그룹별로 묶기
    const grouped: Record<string, MockTest[]> = {};
    filtered.forEach((mt) => {
      if (!grouped[mt.groupId]) {
        grouped[mt.groupId] = [];
      }
      grouped[mt.groupId].push(mt);
    });

    return grouped;
  }, [mockTests, search]);

  // 선택된 그룹만 필터링하거나 전체 표시
  const displayGroups = useMemo(() => {
    let filtered = groups;
    
    if (selectedGroup) {
      filtered = filtered.filter((g) => g.id === selectedGroup);
    }
    if (filterYear) {
      filtered = filtered.filter((g) => g.year === parseInt(filterYear));
    }
    if (filterSession) {
      filtered = filtered.filter((g) => g.session === parseInt(filterSession));
    }
    if (filterMajor) {
      filtered = filtered.filter((g) => g.major === filterMajor);
    }
    
    return filtered;
  }, [groups, selectedGroup, filterYear, filterSession, filterMajor]);

  // 특정 그룹에 영상 추가하기
  function openAddMockTestForGroup(groupId: string) {
    setMockTestForm({ ...mockTestForm, groupId });
    setShowMockTestForm(true);
  }

  const canEdit = role === "admin" || role === "staff";

  if (!canAccess) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">
            관리자/직원만 모의고사 전체보기에 접근할 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="text-center text-muted">로딩 중...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">모의고사 영상 {canEdit ? "관리" : "열람"}</h1>
              <p className="mt-1 text-sm text-muted">
                {canEdit 
                  ? "년도/차수/전공별로 그룹화하여 학생 모의고사 영상을 관리합니다"
                  : "학생들의 모의고사 영상을 확인할 수 있습니다"}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowGroupForm(true)}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-6 font-medium text-white hover:bg-[color:var(--primary-hover)]"
              >
                + 새 그룹 만들기
              </button>
            )}
          </div>
        </div>

        {/* 보안 경고 */}
        <div className="rounded-2xl border-2 border-red-400 bg-red-100 p-4 dark:border-red-800 dark:bg-red-950/40">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              <IconWarning className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">보안 안내</h3>
              <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                본 모의고사 영상은 <strong>학원생 및 선생님 전용</strong>입니다.
                학원 외부인에게 영상을 공유하거나 업로드하는 행위는 <strong>보안을 위해 엄격히 금지</strong>됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium">년도</label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setSelectedGroup(""); // 개별 필터 사용 시 그룹 선택 초기화
              }}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">전체 년도</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">차수</label>
            <select
              value={filterSession}
              onChange={(e) => {
                setFilterSession(e.target.value);
                setSelectedGroup(""); // 개별 필터 사용 시 그룹 선택 초기화
              }}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">전체 차수</option>
              {uniqueSessions.map((session) => (
                <option key={session} value={session}>
                  {session}차
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">전공</label>
            <select
              value={filterMajor}
              onChange={(e) => {
                setFilterMajor(e.target.value);
                setSelectedGroup(""); // 개별 필터 사용 시 그룹 선택 초기화
              }}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">전체 전공</option>
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">그룹 직접 선택</label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                if (e.target.value) {
                  // 그룹 직접 선택 시 개별 필터 초기화
                  setFilterYear("");
                  setFilterSession("");
                  setFilterMajor("");
                }
              }}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">전체 그룹</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.year}년 {group.session}차 - {group.major}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">검색</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="곡 제목, 아티스트, 학생 이름"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
        </div>

        {/* 그룹별 Mock Tests */}
        <div className="space-y-8">
          {displayGroups.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-muted">그룹이 없습니다. 먼저 그룹을 추가해주세요.</p>
            </div>
          ) : (
            displayGroups.map((group) => {
              const groupTests = groupedMockTests[group.id] || [];
              return (
                <div key={group.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                  {/* 그룹 헤더 */}
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white">
                        {group.year}년 {group.session}차
                      </span>
                      <span className="text-lg font-semibold">{group.major}</span>
                      <span className="text-sm text-muted">({groupTests.length}개 영상)</span>
                      {group.examDate && (
                        <span className="text-xs text-muted">
                          시행일: {new Date(group.examDate).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditGroup(group)}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-surface"
                          title="그룹 수정"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-sm font-medium text-red-600 hover:bg-red-500/20"
                          title="그룹 삭제"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          삭제
                        </button>
                        <button
                          onClick={() => openAddMockTestForGroup(group.id)}
                          className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          영상 추가
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 영상 목록 */}
                  <div className="p-4">
                    {groupTests.length === 0 ? (
                      <div className="py-8 text-center text-muted">
                        <p>이 그룹에 등록된 영상이 없습니다.</p>
                        {canEdit && (
                          <button
                            onClick={() => openAddMockTestForGroup(group.id)}
                            className="mt-2 text-primary hover:underline"
                          >
                            + 첫 영상 추가하기
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groupTests.map((mt) => {
                          const videoId = extractYouTubeId(mt.youtubeUrl);
                          return (
                            <div
                              key={mt.id}
                              className="overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md"
                            >
                              {/* Thumbnail */}
                              {videoId ? (
                                <button
                                  onClick={() => setSelectedVideo(mt)}
                                  className="group relative aspect-video w-full overflow-hidden"
                                >
                                  <Image
                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                    alt={mt.songTitle}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/50">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 transition-transform group-hover:scale-110">
                                      <svg className="ml-0.5 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </button>
                              ) : (
                                <div className="aspect-video w-full bg-muted/30"></div>
                              )}

                              {/* Info */}
                              <div className="p-4">
                                <h3 className="font-semibold line-clamp-1">{mt.songTitle}</h3>
                                <p className="text-sm text-muted">{mt.artist}</p>
                                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                                  <span>{mt.studentName} ({mt.studentAge}세)</span>
                                  <a
                                    href={mt.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    YouTube →
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Group Form Modal */}
        {showGroupForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl font-semibold">그룹 추가</h2>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">년도</label>
                    <input
                      type="number"
                      value={groupForm.year}
                      onChange={(e) => setGroupForm({ ...groupForm, year: parseInt(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">차수</label>
                    <input
                      type="number"
                      value={groupForm.session}
                      onChange={(e) => setGroupForm({ ...groupForm, session: parseInt(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">전공</label>
                  <select
                    value={groupForm.major}
                    onChange={(e) => setGroupForm({ ...groupForm, major: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    {majors.map((major) => (
                      <option key={major} value={major}>
                        {major}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">모의고사 시행일</label>
                  <input
                    type="date"
                    value={groupForm.examDate}
                    onChange={(e) => setGroupForm({ ...groupForm, examDate: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                  <p className="mt-1 text-xs text-muted">선택 사항입니다.</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowGroupForm(false)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 font-medium hover:bg-surface"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Group Edit Modal */}
        {editingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl font-semibold">그룹 수정</h2>
              <p className="mt-1 text-sm text-muted">
                현재 그룹: {editingGroup.year}년 {editingGroup.session}차 - {editingGroup.major}
              </p>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">년도</label>
                    <input
                      type="number"
                      value={editGroupForm.year}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, year: parseInt(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">차수</label>
                    <input
                      type="number"
                      value={editGroupForm.session}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, session: parseInt(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">전공</label>
                  <select
                    value={editGroupForm.major}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, major: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    {majors.map((major) => (
                      <option key={major} value={major}>
                        {major}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">모의고사 시행일</label>
                  <input
                    type="date"
                    value={editGroupForm.examDate}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, examDate: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                  <p className="mt-1 text-xs text-muted">선택 사항입니다.</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpdateGroup}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingGroup(null)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 font-medium hover:bg-surface"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mock Test Form Modal */}
        {showMockTestForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl font-semibold">모의고사 영상 추가</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">그룹</label>
                  <select
                    value={mockTestForm.groupId}
                    onChange={(e) => setMockTestForm({ ...mockTestForm, groupId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    <option value="">선택</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.year}년 {group.session}차 - {group.major}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">YouTube URL</label>
                  <input
                    type="url"
                    value={mockTestForm.youtubeUrl}
                    onChange={(e) => setMockTestForm({ ...mockTestForm, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">곡 제목</label>
                  <input
                    type="text"
                    value={mockTestForm.songTitle}
                    onChange={(e) => setMockTestForm({ ...mockTestForm, songTitle: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">아티스트</label>
                  <input
                    type="text"
                    value={mockTestForm.artist}
                    onChange={(e) => setMockTestForm({ ...mockTestForm, artist: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">학생</label>
                  {/* 학생 검색 및 필터링 */}
                  <div className="mb-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="이름 검색"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                    />
                    <select
                      value={studentMajorFilter}
                      onChange={(e) => setStudentMajorFilter(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                    >
                      <option value="">전체 전공</option>
                      {majors.map((major) => (
                        <option key={major} value={major}>
                          {major}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={mockTestForm.studentId}
                    onChange={(e) => setMockTestForm({ ...mockTestForm, studentId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    <option value="">선택 ({filteredStudents.length}명)</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.major || "전공 미정"})
                      </option>
                    ))}
                  </select>
                  {studentSearch || studentMajorFilter ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSearch("");
                        setStudentMajorFilter("");
                      }}
                      className="mt-1 text-xs text-[color:var(--primary)] hover:underline"
                    >
                      필터 초기화
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCreateMockTest}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-[color:var(--primary-hover)]"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowMockTestForm(false)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 font-medium hover:bg-surface"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedVideo(null)}>
            <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-xl font-semibold">{selectedVideo.songTitle}</h3>
                  <p className="text-sm text-white/70">{selectedVideo.artist} • {selectedVideo.studentName}</p>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                >
                  닫기
                </button>
              </div>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideo.youtubeUrl)}?autoplay=1`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
