// deno-lint-ignore-file no-explicit-any
import { useAction } from "./use-action.ts";

export type ActionReturn<T> = T | Promise<T>;
export type ActionFunction<T> = (req: Request) => ActionReturn<T>;
export type ActionResult<R> = {
  data?: R | null;
};
export type ActionResponse<T> = T;
export interface Action<T = any> {
  (): ActionResponse<T>;
  __ref: string;
  __method: string;
  __func: ActionFunction<T>;
}

export function action$<T>(
  actionFn: ActionFunction<T>,
  method = "POST",
): Action<T> {
  const action = () => useAction(action.__ref) as ActionResponse<T>;
  action.__ref = "";
  action.__method = method;
  action.__func = actionFn;
  return action;
}

export function delete$<T>(action: ActionFunction<T>): Action<T> {
  return action$(action, "DELETE");
}

export function put$<T>(action: ActionFunction<T>): Action<T> {
  return action$(action, "PUT");
}

export function patch$<T>(action: ActionFunction<T>): Action<T> {
  return action$(action, "PATCH");
}
