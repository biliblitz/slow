import { useSignal } from "../../deps.ts";
import { useManager } from "../manager/index.ts";

export type RequestEvent = {
  /**
   * Original Request object
   */
  readonly req: Request;
  /**
   * Extra headers appended to Response if nobody throws Response
   */
  headers: Headers;
  /**
   * Params arguments from URL.pathname
   */
  readonly params: ReadonlyMap<string, string>;
};

export function useLoader(ref: string) {
  const manager = useManager();
  return manager.loaders.get(ref);
}

export function useAction(ref: string) {
  const manager = useManager();
  return manager.actions.get(ref);
}

export function useParam(param: string) {
  const signal = useSignal(param);
}

export function useCatchAllParam() {
  return useParam("$");
}
