import { RequestEvent } from "./mod.ts";

export type Middleware = (event: RequestEvent) => void | Promise<void>;

export function middleware$(middleware: Middleware) {
  return middleware;
}
