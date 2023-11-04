// deno-lint-ignore-file ban-types
import { RequestEvent } from "./mod.ts";

export type MiddlewareReturnType = {} | null | undefined;
export type Middleware<T extends MiddlewareReturnType = MiddlewareReturnType> =
  (event: RequestEvent) => T | Promise<T>;

export function middleware$<T extends MiddlewareReturnType>(
  middleware: Middleware<T>,
) {
  return middleware;
}

export function endpoint$<T extends MiddlewareReturnType>(
  endpoint: Middleware<T>,
) {
  return endpoint;
}
