import { useManager } from "../manager/index.ts";
import { Loader } from "./loader.ts";

export type LoaderResponse<T> = T;

export function useLoader<T>(loader: Loader<T>): LoaderResponse<T> {
  const manager = useManager();
  const data = manager.getLoaderData(loader.nick);
  return data as LoaderResponse<T>;
}
