import { useManager } from "../manager/index.ts";

export type LoaderReturn<T> = T | Promise<T>;
export type LoaderFunction<T> = (req: Request) => LoaderReturn<T>;
export type LoaderResponse<T> = T;

export interface Loader<T> {
  /** useLoader() hook */
  (): LoaderResponse<T>;
  __ref: string;
  __func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T>(loaderFn: LoaderFunction<T>): Loader<T> {
  const loader = () =>
    useManager().loaders.get(loader.__ref) as LoaderResponse<T>;
  loader.__ref = "";
  loader.__func = loaderFn;
  return loader;
}
