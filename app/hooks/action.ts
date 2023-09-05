export type ActionResponse<T> =
  | Response
  | URL
  | T
  | Promise<URL>
  | Promise<Response>
  | Promise<T>;
export type ActionFunction<T> = (req: Request) => ActionResponse<T>;
export type ActionResult<R> = {
  data?: R | null;
};
export type Action<T> = {
  nick: string;
  func: ActionFunction<T>;
};

export function useAction<T>(action: Action<T>): ActionResult<T> {
  // TODO
  // return action(t);
  return null as any;
}

export function action$<T>(action: ActionFunction<T>): Action<T> {
  return { nick: "", func: action };
}
