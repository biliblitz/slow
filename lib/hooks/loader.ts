// deno-lint-ignore-file ban-types
import { ReadonlySignal } from "@preact/signals";
import { RequestEvent } from "./mod.ts";

export type LoaderReturnType = {} | null;
export type LoaderReturn<T extends LoaderReturnType> = T | Promise<T>;
export type LoaderFunction<T extends LoaderReturnType> = (
  event: RequestEvent,
) => LoaderReturn<T>;
export type Loader<T extends LoaderReturnType> = () => ReadonlySignal<T>;
export interface LoaderInternal<T extends LoaderReturnType = LoaderReturnType> {
  ref: string;
  name: string;
  func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T extends LoaderReturnType>(
  loaderFn: LoaderFunction<T>,
): Loader<T> {
  const internal: LoaderInternal<T> = {
    ref: "",
    name: "",
    func: loaderFn,
  };
  // we does not return loader itself in code
  // we will do a magic replacement in building process.
  return internal as unknown as Loader<T>;
}

export function isLoader(
  loader: unknown,
): loader is LoaderInternal<LoaderReturnType> {
  // check function property only, just for warnings
  return typeof loader === "object" && loader !== null && "func" in loader &&
    typeof loader.func === "function";
}
