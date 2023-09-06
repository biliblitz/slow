import { useManager } from "../manager/index.ts";
import { Action } from "./action.ts";

export type ActionResponse<T> = T;

export function useAction<T>(action: Action<T>): ActionResponse<T> {
  const manager = useManager();
  const data = manager.getActionData(action.nick);
  return data as ActionResponse<T>;
}
