import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1, "학생 이름을 입력해주세요."),
  birthYear: z.number().int().min(1900).max(2100, "출생년도를 확인해주세요."),
  major: z.string().optional(),
});

export const updateStudentSchema = z.object({
  id: z.string().min(1, "id가 필요합니다."),
  name: z.string().min(1).optional(),
  birthYear: z.number().int().min(1900).max(2100).optional(),
  major: z.string().optional(),
  sharedMemo: z.string().optional(),
  adminMemo: z.string().optional(),
});

export const createEvaluationSchema = z.object({
  studentId: z.string().min(1, "studentId가 필요합니다."),
  subjectId: z.string().min(1, "subjectId가 필요합니다."),
  teacherId: z.string().min(1, "teacherId가 필요합니다."),
  evalDate: z.string().min(1, "evalDate가 필요합니다."),
  content: z.string().min(1, "content가 필요합니다."),
});

export const updateEvaluationSchema = z.object({
  evalDate: z.string().optional(),
  content: z.string().optional(),
});

export const createWorkLogSchema = z.object({
  teacherId: z.string().min(1),
  workDate: z.string().min(1),
  hours: z.number().positive(),
  description: z.string().optional(),
});

export const createShareLinkSchema = z.object({
  studentId: z.string().min(1),
  expiresAt: z.string().optional(),
});

export const createMockTestSchema = z.object({
  groupId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  testDate: z.string().min(1),
  score: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
});

export const createMockTestGroupSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  session: z.number().int().min(1),
  major: z.string().min(1),
  examDate: z.string().optional(),
});

export const createMockTestInputSchema = z.object({
  groupId: z.string().min(1),
  youtubeUrl: z.string().url(),
  songTitle: z.string().min(1),
  artist: z.string().min(1),
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  studentAge: z.number().int().positive(),
});

const studentAttendanceSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  status: z.enum(["출석", "지각", "무단결석", "병결", "기타결석"]),
  reason: z.string().optional(),
});

export const createWorkLogInputSchema = z.object({
  teacherId: z.string().min(1),
  teacherName: z.string().min(1),
  date: z.string().min(1),
  schedule: z.string().optional(),
  notes: z.string().optional(),
  students: z.array(studentAttendanceSchema).optional(),
});

export const teacherIdQuerySchema = z.object({
  teacherId: z.string().min(1, "teacherId가 필요합니다."),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type CreateMockTestInput = z.infer<typeof createMockTestSchema>;
export type CreateMockTestGroupInput = z.infer<typeof createMockTestGroupSchema>;
