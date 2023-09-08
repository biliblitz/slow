// deno-lint-ignore-file no-explicit-any
import { useLoader } from "./use-loader.ts";

export type LoaderReturn<T> = T | Promise<T>;
export type LoaderFunction<T> = (req: Request) => LoaderReturn<T>;
export type LoaderResponse<T> = T;

export interface Loader<T = any> {
  (): LoaderResponse<T>;
  __ref: string;
  __func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T>(loaderFn: LoaderFunction<T>): Loader<T> {
  const loader = () => useLoader(loader.__ref) as LoaderResponse<T>;
  loader.__ref = "";
  loader.__func = loaderFn;
  return loader;
}
