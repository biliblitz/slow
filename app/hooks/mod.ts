import { useComputed } from "../../deps.ts";
import { useRouter } from "../components/router.tsx";

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
  const router = useRouter();
  return useComputed(() => router.loaders.value.get(ref) || null);
}

export function useAction(ref: string) {
  const router = useRouter();
  return useComputed(() => router.actions.value.get(ref) || null);
}

export function useParam(param: string) {
  const router = useRouter();
  return useComputed(() => router.params.value.get(param) || "");
}

export function useCatchAllParam() {
  return useParam("$");
}
