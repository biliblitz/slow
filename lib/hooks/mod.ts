// deno-lint-ignore-file no-explicit-any
import { batch, useComputed, useSignal } from "../../deps.ts";
import { useRouter } from "../components/router.tsx";
import { ServerActionResponse, ServerErrorResponse } from "../utils.ts";
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
  const data = useSignal(null);
  const isRunning = useSignal(false);

  const submit = async (formData: FormData) => {
    isRunning.value = true;

    // fetch target
    const dataUrl = new URL(location.href);
    if (!dataUrl.pathname.endsWith("/")) {
      dataUrl.pathname += "/";
    }
    dataUrl.pathname += "s-data.json";
    dataUrl.searchParams.set("saction", ref);

    const response = await fetch(dataUrl, { body: formData, method: "POST" })
      .then((resp) => resp.json() as Promise<ServerActionResponse>)
      .catch((error): Promise<ServerActionResponse> =>
        error instanceof Response
          // if return is not 200
          ? error.text().then((message) => ({
            ok: "error",
            status: error.status,
            message: message || error.statusText,
          }))
          // maybe network errors / server boom
          : Promise.resolve({
            ok: "error",
            status: 500,
            message: error instanceof Error ? error.message : String(error),
          })
      );

    // as always, making a POST request does not trigger history update
    if (response.ok === "success") {
      batch(() => {
        data.value = response.action;
        isRunning.value = false;
      });
      await router.render(response.data);
    } else if (response.ok === "redirect") {
      await router.navigate(response.redirect);
    } else if (response.ok === "error") {
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
