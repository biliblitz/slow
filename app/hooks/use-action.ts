import { useManager } from "../manager/index.ts";
import { Action } from "./action.ts";

export type ActionResponse<T> = T;

export function useAction<T>(action: Action<T>): ActionResponse<T> {
  const manager = useManager();
  const data = manager.actions.get(action.ref);
  return data as ActionResponse<T>;
}
