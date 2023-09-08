import { useManager } from "../manager/index.ts";

export function useLoader(ref: string) {
  const manager = useManager();
  return manager.loaders.get(ref);
}
