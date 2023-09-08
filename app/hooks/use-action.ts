import { useManager } from "../manager/index.ts";

export function useAction(ref: string) {
  const manager = useManager();
  return manager.actions.get(ref);
}
