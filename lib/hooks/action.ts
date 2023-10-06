// deno-lint-ignore-file no-explicit-any
import { ReadonlySignal } from "../../deps.ts";
import { RequestEvent } from "./mod.ts";

export type ActionReturn<T> = T | Promise<T>;
export type ActionFunction<T> = (event: RequestEvent) => ActionReturn<T>;
export type ActionState<T> = {
  readonly data: ReadonlySignal<T | null>;
  readonly isRunning: ReadonlySignal<boolean>;
  readonly ref: string;
  submit(formData: FormData): Promise<void>;
};
export type Action<T = any> = () => ActionState<T>;
export interface ActionInternal<T = any> {
  ref: string;
  name: string;
  func: ActionFunction<T>;
}

export function action$<T>(actionFn: ActionFunction<T>): Action<T> {
  const internal: ActionInternal<T> = {
    ref: "",
    name: "",
    func: actionFn,
  };
  // we does not return action itself in code
  // we will do a magic replacement in building process.
  return internal as unknown as Action<T>;
}
