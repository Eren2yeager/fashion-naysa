import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./AppError";

type Handler<TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<Response> | Response;

export function withApi<TArgs extends unknown[]>(handler: Handler<TArgs>) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION",
              message: "Invalid request",
              details: err.issues,
            },
          },
          { status: 422 },
        );
      }
      // ponytail: log full error server-side; don't leak stack to client
      console.error("[api]", err);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Internal server error" } },
        { status: 500 },
      );
    }
  };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
