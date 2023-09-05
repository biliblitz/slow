import { useManager } from "../manager/index.ts";
import { Loader } from "./loader.ts";
import { convertLoaderKey } from "./utils.ts";

export type LoaderResponse<T> = T;

export function useLoader<T>(loader: Loader<T>): LoaderResponse<T> {
  const path = loader.path;
  const nick = loader.nick;
  const name = loader.name;
  const key = convertLoaderKey(path, nick, name);
  const manager = useManager();

  return manager.getLoaderData(key) as LoaderResponse<T>;
}
