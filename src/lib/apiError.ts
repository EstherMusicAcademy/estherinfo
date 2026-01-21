import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "ApiError";
  }

  static validation(message: string): ApiError {
    return new ApiError("VALIDATION_ERROR", message, 400);
  }

  static notFound(message: string): ApiError {
    return new ApiError("NOT_FOUND", message, 404);
  }

  static unauthorized(message: string = "인증이 필요합니다."): ApiError {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message: string = "접근 권한이 없습니다."): ApiError {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static internal(message: string = "서버 오류가 발생했습니다."): ApiError {
    return new ApiError("INTERNAL_ERROR", message, 500);
  }

  static badRequest(message: string): ApiError {
    return new ApiError("BAD_REQUEST", message, 400);
  }
}

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    const message =
      process.env.NODE_ENV === "production"
        ? "요청을 처리하는 중 오류가 발생했습니다."
        : error.message;

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "알 수 없는 오류가 발생했습니다." } },
    { status: 500 }
  );
}

export function withErrorHandler<T>(
  handler: (request: Request) => Promise<NextResponse<T>>
) {
  return async (request: Request): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
