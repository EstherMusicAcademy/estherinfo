import { getStudentById, listAssignmentsForStudent } from "@/lib/studentStore";
import { getUserById } from "@/lib/userStore";
import { listMockTests } from "@/lib/mockTestStore";
import { listEvaluationsForStudent } from "@/lib/evaluationStore";
import { getSubjectById } from "@/lib/subjectStore";
import { getShareLinkByToken, isExpired, recordShareLinkAccess } from "@/lib/shareLinkStore";

export type TeacherAssignment = {
  id: string;
  displayName: string;
  subjectType: "major" | "theory" | "other";
  subjectLabel: string;
};

export type PublicStudentPayload = {
  student: { id: string; name: string; major?: string; birthYear: number };
  lessonSubject?: string;
  teachers: TeacherAssignment[];
  mockTests: { id: string; title: string; youtubeUrl: string; createdAt: string }[];
  evaluations: { id: string; evalDate: string; subjectLabel: string; teacherName: string; content: string }[];
  expiresAt?: string; // 만료일
};

export function getPublicStudentByToken(token: string): PublicStudentPayload {
  const link = getShareLinkByToken(token);
  if (!link) throw new Error("유효하지 않은 링크입니다.");
  if (link.isRevoked) throw new Error("회수된 링크입니다.");
  if (isExpired(link)) throw new Error("만료된 링크입니다.");

  recordShareLinkAccess(token);

  const student = getStudentById(link.studentId);
  if (!student) throw new Error("학생을 찾을 수 없습니다.");

  const assignments = listAssignmentsForStudent(student.id);
  const teachers: TeacherAssignment[] = assignments
    .map((a) => {
      const teacher = getUserById(a.teacherId);
      if (!teacher) return null;
      return {
        id: teacher.id,
        displayName: teacher.displayName,
        subjectType: a.subjectType,
        subjectLabel: a.subjectLabel || teacher.major || "기타",
      };
    })
    .filter((t): t is TeacherAssignment => t !== null);

  const mockTests = listMockTests({ studentId: student.id }).map((m) => ({
    id: m.id,
    title: m.songTitle,
    youtubeUrl: m.youtubeUrl,
    createdAt: m.createdAt,
  }));

  const evaluations = listEvaluationsForStudent(student.id).map((e) => {
    const subj = getSubjectById(e.subjectId);
    const teacher = getUserById(e.teacherId);
    const subjectLabel = subj ? `${subj.name}(${subj.category === "major" ? "전공" : "이론"})` : "과목";
    return {
      id: e.id,
      evalDate: e.evalDate,
      subjectLabel,
      teacherName: teacher?.displayName ?? "선생님",
      content: e.content,
    };
  });

  return {
    student: { id: student.id, name: student.name, major: student.major, birthYear: student.birthYear },
    lessonSubject: student.major,
    teachers,
    mockTests,
    evaluations,
    expiresAt: link.expiresAt || undefined, // 만료일
  };
}

