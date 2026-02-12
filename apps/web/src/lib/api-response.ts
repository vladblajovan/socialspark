import { NextResponse } from "next/server";

interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export function apiSuccess<T>(data: T, meta?: ApiMeta, status = 200) {
  return NextResponse.json({ data, meta: meta ?? null, error: null }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ data: null, meta: null, error }, { status });
}
