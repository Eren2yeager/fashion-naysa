export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "PAYMENT"
  | "UPSTREAM"
  | "INTERNAL";

export class AppError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", msg, details);
export const unauthorized = (msg = "Unauthorized") =>
  new AppError(401, "UNAUTHORIZED", msg);
export const forbidden = (msg = "Forbidden") =>
  new AppError(403, "FORBIDDEN", msg);
export const notFound = (msg = "Not found") =>
  new AppError(404, "NOT_FOUND", msg);
export const conflict = (msg: string, details?: unknown) =>
  new AppError(409, "CONFLICT", msg, details);
export const validation = (msg: string, details?: unknown) =>
  new AppError(422, "VALIDATION", msg, details);
export const payment = (msg: string, details?: unknown) =>
  new AppError(402, "PAYMENT", msg, details);
export const upstream = (msg: string, details?: unknown) =>
  new AppError(502, "UPSTREAM", msg, details);
