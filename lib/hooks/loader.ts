// deno-lint-ignore-file no-explicit-any
import { ReadonlySignal } from "../../deps.ts";
import { RequestEvent } from "./mod.ts";

export type LoaderReturn<T> = T | Promise<T>;
export type LoaderFunction<T> = (event: RequestEvent) => LoaderReturn<T>;
export type Loader<T = any> = () => ReadonlySignal<T>;
export interface LoaderInternal<T = any> {
  ref: string;
  name: string;
  func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T>(loaderFn: LoaderFunction<T>): Loader<T> {
  const internal: LoaderInternal<T> = {
    ref: "",
    name: "",
    func: loaderFn,
  };
  // we does not return loader itself in code
  // we will do a magic replacement in building process.
  return internal as unknown as Loader<T>;
}
