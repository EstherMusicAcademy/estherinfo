import { NextResponse } from "next/server";
import {
  listRooms,
  listAllRooms,
  createRoom,
  getSettings,
  updateSettings,
} from "@/lib/practiceRoomStore";
import { withAuthDev, extractAuthFromRequest, requireRole, authErrorResponse, type AuthenticatedUser } from "@/lib/apiAuth";
import { handleApiError, ApiError } from "@/lib/apiError";
import { z } from "zod";

const createRoomSchema = z.object({
  name: z.string().min(1, "연습실 이름을 입력해주세요."),
  description: z.string().optional(),
  roomType: z.enum(["general", "vocal", "piano", "drum"]).default("general"),
  capacity: z.number().int().positive().default(1),
});

export const GET = withAuthDev(
  async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get("includeInactive") === "true";
      const type = searchParams.get("type");

      if (type === "settings") {
        const settings = getSettings();
        return NextResponse.json({ settings });
      }

      const rooms = includeInactive ? listAllRooms() : listRooms();
      const settings = getSettings();

      return NextResponse.json({ rooms, settings });
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
      const parsed = createRoomSchema.safeParse(body);

      if (!parsed.success) {
        throw ApiError.validation(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
      }

      const room = createRoom({
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim(),
        roomType: parsed.data.roomType,
        capacity: parsed.data.capacity,
      });

      return NextResponse.json(room, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);

export const PUT = withAuthDev(
  async (request: Request, _user: AuthenticatedUser) => {
    try {
      const body = await request.json();
      const { type, settings: newSettings } = body;

      if (type !== "settings") {
        throw ApiError.badRequest("잘못된 요청입니다.");
      }

      const settings = updateSettings(newSettings);
      return NextResponse.json({ settings });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);

export const PATCH = withAuthDev(
  async (request: Request, _user: AuthenticatedUser) => {
    try {
      const body = await request.json();
      const { settings: newSettings } = body;

      const settings = updateSettings(newSettings);
      return NextResponse.json(settings);
    } catch (error) {
      return handleApiError(error);
    }
  },
  { allowedRoles: ["admin"] }
);
