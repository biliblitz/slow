// deno-lint-ignore-file no-explicit-any
import { ReadonlySignal } from "../../deps.ts";
import { RequestEvent, useLoader } from "./mod.ts";

export type LoaderReturn<T> = T | Promise<T>;
export type LoaderFunction<T> = (event: RequestEvent) => LoaderReturn<T>;
export type LoaderResponse<T> = T;

export interface Loader<T = any> {
  (): ReadonlySignal<LoaderResponse<T>>;
  __ref: string;
  __func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T>(loaderFn: LoaderFunction<T>): Loader<T> {
  const loader = () =>
    useLoader(loader.__ref) as ReadonlySignal<LoaderResponse<T>>;
  loader.__ref = "";
  loader.__func = loaderFn;
  return loader;
}
