// deno-lint-ignore-file no-explicit-any
import { useComputed, useSignal } from "../../deps.ts";
import { useRouter } from "../components/router.tsx";
import { ActionState } from "./action.ts";

export type RequestEvent = {
  /**
   * Original Request object
   */
  readonly req: Request;
  /**
   * Params arguments from URL.pathname
   */
  readonly params: ReadonlyMap<string, string>;
  /**
   * Extra headers appended to Response if nobody throws Response
   */
  headers: Headers;
};

export function useLoader(ref: string) {
  const router = useRouter();
  return useComputed(() => router.loaders.value.get(ref) || null);
}

export function useAction(ref: string) {
  const router = useRouter();
  const data = useComputed(() => router.actions.value.get(ref) || null);
  const isRunning = useSignal(false);
  return { isRunning, data, ref } satisfies ActionState<any>;
}

export function useParam(param: string) {
  const router = useRouter();
  return useComputed(() => router.params.value.get(param) || "");
}

export function useCatchAllParam() {
  return useParam("$");
}
