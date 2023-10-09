// deno-lint-ignore-file ban-types
import { ReadonlySignal } from "../../deps.ts";
import { RequestEvent } from "./mod.ts";

export type LoaderReturnType = {} | null;
export type LoaderReturn<T extends LoaderReturnType> = T | Promise<T>;
export type LoaderFunction<T extends LoaderReturnType> = (
  event: RequestEvent,
) => LoaderReturn<T>;
export type Loader<T extends LoaderReturnType> = () => ReadonlySignal<T>;
export const LoaderSymbol = Symbol("loader");
export interface LoaderInternal<T extends LoaderReturnType = LoaderReturnType> {
  [LoaderSymbol]?: boolean;
  ref: string;
  name: string;
  func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T extends LoaderReturnType>(
  loaderFn: LoaderFunction<T>,
): Loader<T> {
  const internal: LoaderInternal<T> = {
    [LoaderSymbol]: true,
    ref: "",
    name: "",
    func: loaderFn,
  };
  // we does not return loader itself in code
  // we will do a magic replacement in building process.
  return internal as unknown as Loader<T>;
}
