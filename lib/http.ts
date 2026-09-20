import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "./errors";

export function parsePositiveInt(value: string | null | undefined, field = "id") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${field} tidak valid`, 400);
  }

  return id;
}

export function jsonError(error: unknown) {
  const { message, status } = toErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
