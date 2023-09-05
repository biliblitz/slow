export type ActionResponse<T> =
  | Response
  | URL
  | T
  | Promise<URL>
  | Promise<Response>
  | Promise<T>;
export type Action<T, R> = (req: Request, t: T) => ActionResponse<R>;
export type ActionResult<R> = {
  data?: R | null;
};

export function useAction<T, R>(action: Action<T, R>): ActionResult<R> {
  // TODO
  // return action(t);
  return null as any;
}

export function action$<T, R>(action: Action<T, R>): Action<T, R> {
  return action;
}
