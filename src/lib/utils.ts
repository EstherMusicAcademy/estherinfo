// 유틸리티 함수들

/**
 * YouTube URL에서 비디오 ID 추출
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/{id} or /embed/{id}
      const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 한국식 나이 계산 (세는 나이: 현재년도 - 출생년도 + 1)
 * 매년 1월 1일에 모두 한 살씩 나이를 먹음
 */
export function calcKoreanAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear + 1;
}

/**
 * 한국 나이 포맷팅
 */
export function formatKoreanAge(birthYear: number): string {
  const age = calcKoreanAge(birthYear);
  return `${age}세`;
}

/**
 * 날짜 포맷팅 (한국어)
 */
export function formatDateKR(date: string | Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * cn 함수 - tailwind-merge와 clsx 대체 간단 버전
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
