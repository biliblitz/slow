export type Middleware = (req: Request) => void | Promise<void>;

export function middleware$(middleware: Middleware) {
  return middleware;
}
