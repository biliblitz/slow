// deno-lint-ignore-file no-explicit-any
import { useComputed, useSignal } from "../../deps.ts";
import { useRouter } from "../components/router.tsx";
import { ServerDataResponse } from "../utils.ts";
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

  const submit = async (formData: FormData) => {
    // fetch target
    const dataUrl = new URL(location.href);
    if (!dataUrl.pathname.endsWith("/")) {
      dataUrl.pathname += "/";
    }
    dataUrl.pathname += "s-data.json";
    dataUrl.searchParams.set("saction", ref);

    const response = await fetch(dataUrl, { body: formData, method: "POST" });
    const data = await response.json() as ServerDataResponse;

    // as always, making a POST request does not trigger history update
    if (data.ok === "data") {
      await router.render(data.data);
    } else if (data.ok === "redirect") {
      await router.navigate(data.redirect);
    }
  };

  return { isRunning, data, ref, submit } satisfies ActionState<any>;
}

export function useParam(param: string) {
  const router = useRouter();
  return useComputed(() => router.params.value.get(param) || "");
}

export function useCatchAllParam() {
  return useParam("$");
}
