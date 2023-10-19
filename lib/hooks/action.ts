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
export const ActionSymbol = Symbol("action");
export interface ActionInternal<T extends ActionReturnType = ActionReturnType> {
  [ActionSymbol]?: boolean;
  ref: string;
  name: string;
  func: ActionFunction<T>;
  middlewares: number[];
}

export function action$<T extends ActionReturnType>(
  actionFn: ActionFunction<T>,
): Action<T> {
  const internal: ActionInternal<T> = {
    [ActionSymbol]: true,
    ref: "",
    name: "",
    func: actionFn,
    middlewares: [],
  };
  // we will do a magic replacement in building process.
  return internal as unknown as Action<T>;
}
