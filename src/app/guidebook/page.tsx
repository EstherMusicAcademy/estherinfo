"use client";

import { useState } from "react";
import { useRole } from "@/components/role/RoleProvider";
import {
  IconFileList,
  IconLightbulb,
  IconLink,
  IconStar,
  IconTool,
  IconUser,
  IconVideo,
  IconWarning,
} from "@/components/icons/UiIcons";

export default function GuidebookPage() {
  const { role } = useRole();
  const [activeSection, setActiveSection] = useState("start");

  if (role !== "teacher" && role !== "admin" && role !== "staff") {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <h1 className="text-2xl font-semibold">접근 불가</h1>
          <p className="mt-2 text-sm text-muted">선생님, 관리자, 직원만 가이드북을 사용할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  const sections = [
    { id: "start", title: "시작하기" },
    { id: "student-management", title: "학생 관리" },
    { id: "work-log", title: "업무일지" },
    { id: "mock-test", title: "모의고사" },
    { id: "feedback-share", title: "피드백 공유" },
    { id: "my-info", title: "내 정보 관리" },
    { id: "faq", title: "자주 묻는 질문" },
    ...(role === "admin" || role === "staff" ? [{ id: "staff", title: "직원 전용" }] : []),
    ...(role === "admin" ? [{ id: "admin", title: "관리자 전용" }] : []),
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl">
        {/* Side Navigation */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 flex-shrink-0 overflow-y-auto border-r border-border bg-surface p-6 lg:block">
          <h2 className="mb-4 text-lg font-semibold">목차</h2>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h1 className="text-2xl font-bold">에스더 실용음악학원 가이드북</h1>
              <p className="mt-1 text-sm text-muted">선생님과 직원을 위한 학원 운영 시스템 사용 가이드</p>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
              {/* 시작하기 */}
              {activeSection === "start" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconStar className="h-5 w-5" />
                      시작하기
                    </h2>
                    <p className="mt-2 text-sm text-muted">에스더 실용음악학원 시스템 사용법을 안내합니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">회원가입 및 로그인</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">1. 회원가입</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 메인 페이지에서 &quot;가입하기&quot; 클릭</li>
                          <li>• 역할 선택: <strong>선생님</strong> 또는 <strong>직원</strong></li>
                          <li>• 이름, 이메일, 비밀번호, 전공 입력</li>
                          <li>• 가입 후 <strong>관리자 승인</strong>을 기다려주세요</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">2. 로그인</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 승인된 계정으로 이메일/비밀번호 입력</li>
                          <li>• 비밀번호 분실 시 &quot;비밀번호 찾기&quot; 이용</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">메뉴 안내</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <span className="font-medium text-primary">홈</span>
                        <span className="text-muted">메인 페이지로 이동</span>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <span className="font-medium text-primary">모의고사</span>
                        <span className="text-muted">모의고사 영상 열람 및 관리 (직원/관리자 전용)</span>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <span className="font-medium text-primary">업무일지</span>
                        <span className="text-muted">일일 레슨 기록 및 출석 관리</span>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <span className="font-medium text-primary">가이드북</span>
                        <span className="text-muted">현재 보고 계신 페이지</span>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <span className="font-medium text-primary">학생 관리</span>
                        <span className="text-muted">담당 학생 평가 작성 및 조회 (선생님/관리자)</span>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                        <span className="font-medium text-primary">내 정보</span>
                        <span className="text-muted">비밀번호, 전공, 이름 변경</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 학생 관리 */}
              {activeSection === "student-management" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconUser className="h-5 w-5" />
                      학생 관리
                    </h2>
                    <p className="mt-2 text-sm text-muted">담당 학생의 평가를 작성하고 모의고사 영상을 확인할 수 있습니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">학생 관리 페이지 접근</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <ul className="space-y-2 text-muted">
                          <li>• 상단 메뉴에서 <strong>&quot;학생 관리&quot;</strong> 클릭</li>
                          <li>• 왼쪽 사이드바에 담당 학생 목록이 표시됩니다</li>
                          <li>• 학생을 클릭하면 해당 학생의 정보가 표시됩니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">학생 평가 작성</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">평가 작성 방법</h4>
                        <ol className="mt-2 space-y-1 text-muted list-decimal list-inside">
                          <li>학생 선택 후 &quot;학생 평가 차트&quot; 탭 선택</li>
                          <li>&quot;새 평가 작성&quot; 버튼 클릭</li>
                          <li>수업 과목 선택 (전공/이론 등)</li>
                          <li>평가 날짜 선택</li>
                          <li>평가 내용 작성 후 &quot;평가 저장&quot;</li>
                        </ol>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">평가 내용 포함 사항</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 레슨 진행 상황</li>
                          <li>• 학생의 장점과 개선점</li>
                          <li>• 다음 목표 및 과제</li>
                          <li>• 학부모님께 전달할 내용</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border-2 border-blue-400 bg-blue-100 p-4 dark:border-blue-700 dark:bg-blue-950/30">
                        <h4 className="inline-flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
                          <IconLightbulb className="h-4 w-4" />
                          TIP
                        </h4>
                        <p className="mt-1 text-blue-800 dark:text-blue-200">
                          작성된 평가는 해당 학생을 담당하는 <strong>모든 선생님</strong>이 볼 수 있습니다.
                          담당 선생님 간 소통을 위해 활용해주세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">모의고사 영상 확인</h3>
                    <div className="mt-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <ul className="space-y-2 text-muted">
                          <li>• 학생 선택 후 &quot;모의고사 영상&quot; 탭 선택</li>
                          <li>• 해당 학생의 모의고사 영상이 년도/차수별로 표시됩니다</li>
                          <li>• 영상 재생 버튼을 눌러 바로 확인 가능</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 업무일지 */}
              {activeSection === "work-log" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconFileList />
                      업무일지
                    </h2>
                    <p className="mt-2 text-sm text-muted">일일 레슨 기록과 학생 출석을 관리합니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">업무일지 작성</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">1. 일지 작성 버튼 클릭</h4>
                        <p className="mt-1 text-muted">업무일지 페이지 상단의 &quot;일지 작성&quot; 버튼을 클릭합니다.</p>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">2. 날짜 선택</h4>
                        <p className="mt-1 text-muted">레슨이 진행된 날짜를 선택합니다. (기본값: 오늘)</p>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">3. 레슨 시간표 작성</h4>
                        <p className="mt-1 text-muted">오늘 진행한 레슨 시간과 학생을 서술형으로 작성합니다.</p>
                        <div className="mt-2 rounded bg-surface p-3 font-mono text-xs text-muted">
                          예시:<br />
                          14:00-15:00 김민준 보컬 레슨<br />
                          15:00-16:00 이서준 피아노 레슨<br />
                          16:30-17:30 박하은 기타 레슨
                        </div>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">4. 레슨 학생 선택 및 출석 체크</h4>
                        <p className="mt-1 text-muted">담당 학생 목록에서 오늘 레슨한 학생을 선택하고 출석 상태를 표시합니다.</p>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• <span className="font-medium text-green-600">출석(O)</span> - 정상 출석</li>
                          <li>• <span className="font-medium text-yellow-600">지각</span> - 15분 이상 지각</li>
                          <li>• <span className="font-medium text-red-600">결석(X)</span> - 무단 결석 또는 사전 연락 없음</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">5. 특이사항 작성</h4>
                        <p className="mt-1 text-muted">레슨 중 특별히 기록할 내용을 작성합니다.</p>
                        <div className="mt-2 rounded bg-surface p-3 font-mono text-xs text-muted">
                          예시: 김민준 학생 고음 발성 많이 개선됨. 다음 주 모의고사 준비 필요.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">업무일지 확인 및 수정</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">일지 확인</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 캘린더에서 해당 날짜의 일지 클릭</li>
                          <li>• 작성자, 저장일시, 내용이 표시됩니다</li>
                          <li>• <strong>모든 선생님</strong>의 업무일지를 확인할 수 있습니다</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">일지 수정</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 본인이 작성한 일지만 수정 가능</li>
                          <li>• 일지 확인 화면에서 &quot;수정&quot; 버튼 클릭</li>
                          <li>• 내용 수정 후 &quot;저장&quot; 버튼 클릭</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 모의고사 */}
              {activeSection === "mock-test" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconVideo />
                      모의고사
                    </h2>
                    <p className="mt-2 text-sm text-muted">모의고사 영상을 전공/년도/차수별로 관리합니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">모의고사 영상 열람 (직원/관리자)</h3>
                    <div className="mt-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <ul className="space-y-2 text-muted">
                          <li>• 상단 메뉴의 &quot;모의고사&quot; 클릭</li>
                          <li>• 년도, 차수, 전공으로 필터링 가능</li>
                          <li>• 곡 제목, 학생 이름으로 검색 가능</li>
                          <li>• 재생 버튼을 눌러 영상 바로 확인</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {(role === "admin" || role === "staff") && (
                    <div className="rounded-2xl border border-border bg-surface p-6">
                      <h3 className="font-semibold">모의고사 관리 (직원/관리자)</h3>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="rounded-lg bg-background p-4">
                          <h4 className="font-medium">그룹 생성</h4>
                          <ol className="mt-2 space-y-1 text-muted list-decimal list-inside">
                            <li>&quot;그룹 추가&quot; 버튼 클릭</li>
                            <li>년도, 차수, 전공 선택</li>
                            <li>모의고사 시행 날짜 입력</li>
                            <li>&quot;생성&quot; 버튼 클릭</li>
                          </ol>
                        </div>

                        <div className="rounded-lg bg-background p-4">
                          <h4 className="font-medium">영상 추가</h4>
                          <ol className="mt-2 space-y-1 text-muted list-decimal list-inside">
                            <li>해당 그룹에서 &quot;영상 추가&quot; 버튼 클릭</li>
                            <li>YouTube URL 입력</li>
                            <li>곡 제목, 아티스트 입력</li>
                            <li>학생 선택 (검색/전공 필터 가능)</li>
                            <li>&quot;추가&quot; 버튼 클릭</li>
                          </ol>
                        </div>

                        <div className="rounded-lg border-2 border-blue-400 bg-blue-100 p-4 dark:border-blue-700 dark:bg-blue-950/30">
                          <h4 className="inline-flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
                            <IconLightbulb className="h-4 w-4" />
                            자동 연동
                          </h4>
                          <p className="mt-1 text-blue-800 dark:text-blue-200">
                            등록된 모의고사 영상은 해당 학생의 페이지에 <strong>자동으로 연동</strong>됩니다.
                            학부모 공개 페이지에서도 확인 가능합니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* 피드백 공유 */}
              {activeSection === "feedback-share" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconLink />
                      피드백 공유
                    </h2>
                    <p className="mt-2 text-sm text-muted">학부모님께 학생의 평가와 모의고사 영상을 공유합니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">공유 링크 안내</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">공유 페이지 내용</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• <strong>학생 평가 차트</strong> - 선생님들이 작성한 평가 내용</li>
                          <li>• <strong>모의고사 영상</strong> - 학생의 모의고사 촬영 영상</li>
                          <li>• 담당 선생님 정보 (전공/이론 선생님)</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border-2 border-amber-500 bg-amber-100 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                        <h4 className="inline-flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
                          <IconWarning className="h-4 w-4" />
                          주의
                        </h4>
                        <p className="mt-1 text-amber-800 dark:text-amber-200">
                          공유 링크는 <strong>관리자만</strong> 생성 및 관리할 수 있습니다.
                          학부모 공유가 필요한 경우 관리자에게 요청해주세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  {role === "admin" && (
                    <div className="rounded-2xl border border-border bg-surface p-6">
                      <h3 className="font-semibold">공유 링크 관리 (관리자)</h3>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="rounded-lg bg-background p-4">
                          <h4 className="font-medium">새 링크 생성</h4>
                          <ol className="mt-2 space-y-1 text-muted list-decimal list-inside">
                            <li>&quot;관리&quot; → &quot;피드백 공유 관리&quot; 메뉴 접속</li>
                            <li>학생 검색 및 선택</li>
                            <li>만료일 설정 (3일/5일/7일/무제한 또는 직접 선택)</li>
                            <li>&quot;링크 생성&quot; 클릭</li>
                            <li>생성된 링크 복사 후 학부모님께 전달</li>
                          </ol>
                        </div>

                        <div className="rounded-lg bg-background p-4">
                          <h4 className="font-medium">링크 관리</h4>
                          <ul className="mt-2 space-y-1 text-muted">
                            <li>• 활성/만료 상태 확인</li>
                            <li>• 링크 복사, 미리보기</li>
                            <li>• 불필요한 링크 삭제</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* 내 정보 관리 */}
              {activeSection === "my-info" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconUser />
                      내 정보 관리
                    </h2>
                    <p className="mt-2 text-sm text-muted">계정 정보를 확인하고 수정할 수 있습니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">수정 가능 항목</h3>
                    <div className="mt-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <ul className="space-y-2 text-muted">
                          <li>• <strong>이름</strong> - 표시되는 이름 변경</li>
                          <li>• <strong>전공</strong> - 담당 전공 변경</li>
                          <li>• <strong>비밀번호</strong> - 로그인 비밀번호 변경</li>
                          <li>• <strong>이메일</strong> - 로그인 이메일 변경 (인증 필요)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">비밀번호 변경 방법</h3>
                    <div className="mt-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <ol className="space-y-1 text-muted list-decimal list-inside">
                          <li>상단 메뉴의 &quot;내 정보&quot; 클릭</li>
                          <li>현재 비밀번호 입력</li>
                          <li>새 비밀번호 입력 (2회)</li>
                          <li>&quot;저장&quot; 버튼 클릭</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* FAQ */}
              {activeSection === "faq" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <IconWarning className="h-5 w-5" />
                      자주 묻는 질문
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <details className="group">
                      <summary className="cursor-pointer font-medium">Q. 담당 학생이 표시되지 않아요</summary>
                      <p className="mt-2 text-sm text-muted">
                        관리자가 학생을 배정해야 담당 학생으로 표시됩니다. 관리자에게 학생 배정을 요청해주세요.
                      </p>
                    </details>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <details className="group">
                      <summary className="cursor-pointer font-medium">Q. 업무일지를 삭제하고 싶어요</summary>
                      <p className="mt-2 text-sm text-muted">
                        본인이 작성한 업무일지만 삭제할 수 있습니다. 해당 일지를 클릭하여 열고 &quot;삭제&quot; 버튼을 클릭하세요.
                      </p>
                    </details>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <details className="group">
                      <summary className="cursor-pointer font-medium">Q. 다른 선생님의 평가를 볼 수 있나요?</summary>
                      <p className="mt-2 text-sm text-muted">
                        네, 같은 학생을 담당하는 선생님끼리는 서로의 평가를 확인할 수 있습니다. 이를 통해 학생에 대한 정보를 공유하세요.
                      </p>
                    </details>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <details className="group">
                      <summary className="cursor-pointer font-medium">Q. 학부모님께 평가를 보여주고 싶어요</summary>
                      <p className="mt-2 text-sm text-muted">
                        관리자에게 해당 학생의 &quot;피드백 공유 링크&quot; 발급을 요청하세요. 발급된 링크를 학부모님께 전달하면 됩니다.
                      </p>
                    </details>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <details className="group">
                      <summary className="cursor-pointer font-medium">Q. 비밀번호를 잊어버렸어요</summary>
                      <p className="mt-2 text-sm text-muted">
                        로그인 페이지에서 &quot;비밀번호 찾기&quot;를 클릭하여 이메일로 재설정 링크를 받으세요. 또는 관리자에게 문의해주세요.
                      </p>
                    </details>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">문의처</h3>
                    <div className="mt-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <p className="text-muted">
                          시스템 사용 중 문제가 발생하거나 궁금한 점이 있으시면<br />
                          관리자에게 문의해주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 직원 전용 */}
              {activeSection === "staff" && (role === "admin" || role === "staff") && (
                <section className="space-y-4">
                  <div className="rounded-2xl border-2 border-purple-500 bg-purple-100 p-6 dark:border-purple-700 dark:bg-purple-950/30">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-purple-900 dark:text-purple-100">
                      <IconTool className="h-5 w-5" />
                      직원 전용
                    </h2>
                    <p className="mt-2 text-sm text-purple-800 dark:text-purple-200">직원이 관리하는 업무 안내입니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">직원 주요 업무</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">모의고사 영상 관리</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 모의고사 그룹 생성 (년도/차수/전공)</li>
                          <li>• YouTube 영상 업로드 및 학생 연결</li>
                          <li>• 기존 영상 수정/삭제</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">업무일지 확인</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 모든 선생님의 업무일지 열람</li>
                          <li>• 레슨 현황 및 출석 확인</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 관리자 전용 */}
              {activeSection === "admin" && role === "admin" && (
                <section className="space-y-4">
                  <div className="rounded-2xl border-2 border-amber-500 bg-amber-100 p-6 dark:border-amber-700 dark:bg-amber-950/30">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-amber-900 dark:text-amber-100">
                      <IconTool />
                      관리자 전용
                    </h2>
                    <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">관리자가 관리하는 업무 안내입니다.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <h3 className="font-semibold">관리자 주요 업무</h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">선생님/직원 관리</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 신규 가입 승인/거절</li>
                          <li>• 역할 변경 및 계정 비활성화</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">학생 관리</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 신규 학생 등록</li>
                          <li>• 선생님-학생 배정 (과목별)</li>
                          <li>• 학생 정보 수정/삭제</li>
                          <li>• 관리자 전용 메모 작성</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">과목 관리</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 과목 추가/수정/삭제</li>
                          <li>• 전공/이론 구분 설정</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">피드백 공유 관리</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 학부모 공유 링크 생성</li>
                          <li>• 링크 만료일 설정</li>
                          <li>• 공유 링크 관리/삭제</li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-background p-4">
                        <h4 className="font-medium">대시보드</h4>
                        <ul className="mt-2 space-y-1 text-muted">
                          <li>• 전체 현황 요약 확인</li>
                          <li>• 승인 대기 목록 확인</li>
                          <li>• 최근 활동 내역</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
