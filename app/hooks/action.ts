// deno-lint-ignore-file no-explicit-any
import { ReadonlySignal } from "../../deps.ts";
import { RequestEvent, useAction } from "./mod.ts";

export type ActionReturn<T> = T | Promise<T>;
export type ActionFunction<T> = (event: RequestEvent) => ActionReturn<T>;

export type ActionState<T> = {
  readonly data: ReadonlySignal<T | null>;
  readonly isRunning: ReadonlySignal<boolean>;
  readonly ref: string;
};

export interface Action<T = any> {
  (): ActionState<T>;
  __ref: string;
  __func: ActionFunction<T>;
}

export function action$<T>(actionFn: ActionFunction<T>): Action<T> {
  const action = () => useAction(action.__ref) as ActionState<T>;
  action.__ref = "";
  action.__func = actionFn;
  return action;
}
