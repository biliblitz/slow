// deno-lint-ignore-file no-explicit-any
import { RequestEvent } from "./mod.ts";

export type Middleware<T = any> = (event: RequestEvent) => T | Promise<T>;

export function middleware$<T>(middleware: Middleware<T>) {
  return middleware;
}
