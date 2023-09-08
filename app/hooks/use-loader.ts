import { useManager } from "../manager/index.ts";

/**
 * @deprecated Internal function, do not use
 */
export function useLoader(ref: string) {
  return useManager().loaders.get(ref);
}
