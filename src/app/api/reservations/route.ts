import { NextResponse } from "next/server";
import {
  listReservations,
  listReservationsForUser,
  createReservation,
  getAvailableTimeSlots,
  canUserReserve,
  getAllTimeSlots,
} from "@/lib/practiceRoomStore";
import { withAuthDev, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { z } from "zod";

const timeSlotSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

const createReservationSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  userRole: z.string().min(1),
  date: z.string().min(1),
  timeSlot: timeSlotSchema,
  note: z.string().optional(),
});

export const GET = withAuthDev(
  async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get("date");
      const userId = searchParams.get("userId");
      const roomId = searchParams.get("roomId");

      if (userId) {
        const reservations = listReservationsForUser(userId);
        return NextResponse.json({ reservations });
      }

      if (date && roomId) {
        const slots = getAvailableTimeSlots(roomId, date);
        return NextResponse.json({ slots, date, roomId });
      }

      const reservations = listReservations(date || undefined);
      const allSlots = getAllTimeSlots();

      return NextResponse.json({ reservations, allSlots, date });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher", "student"] }
);

export const POST = withAuthDev(
  async (request: Request, _user: AuthenticatedUser) => {
    try {
      const body = await request.json();
      const parsed = createReservationSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "필수 정보가 누락되었습니다.");
      }

      const canReserveResult = canUserReserve(parsed.data.userRole, parsed.data.date);
      if (!canReserveResult.canReserve) {
        throw ApiError.forbidden(canReserveResult.reason || "예약할 수 없습니다.");
      }

      const reservation = createReservation({
        roomId: parsed.data.roomId,
        userId: parsed.data.userId,
        userName: parsed.data.userName,
        userRole: parsed.data.userRole,
        date: parsed.data.date,
        timeSlot: parsed.data.timeSlot,
        note: parsed.data.note,
      });

      return NextResponse.json(reservation, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin", "teacher", "student"] }
);
