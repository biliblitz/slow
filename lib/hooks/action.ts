// deno-lint-ignore-file ban-types
import { ReadonlySignal } from "@preact/signals";
import { RequestEvent } from "./mod.ts";

export type ActionReturnType = {} | null;
export type ActionReturn<T extends ActionReturnType> = T | Promise<T>;
export type ActionFunction<T extends ActionReturnType> = (
  event: RequestEvent,
) => ActionReturn<T>;
export type ActionState<T extends ActionReturnType = ActionReturnType> = {
  readonly data: ReadonlySignal<T | null>;
  readonly isRunning: ReadonlySignal<boolean>;
  submit(formData: FormData): Promise<void>;
  readonly __ref: string;
};
export type Action<T extends ActionReturnType> = () => ActionState<T>;
export interface ActionInternal<T extends ActionReturnType = ActionReturnType> {
  ref: string;
  name: string;
  func: ActionFunction<T>;
}

export function action$<T extends ActionReturnType>(
  actionFn: ActionFunction<T>,
): Action<T> {
  const internal: ActionInternal<T> = {
    ref: "",
    name: "",
    func: actionFn,
  };
  // we will do a magic replacement in building process.
  return internal as unknown as Action<T>;
}

export function isAction(
  action: unknown,
): action is ActionInternal<ActionReturnType> {
  // check function property only, just for warnings
  return typeof action === "object" && action !== null && "func" in action &&
    typeof action.func === "function";
}
