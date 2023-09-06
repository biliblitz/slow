export type LoaderReturn<T> = T | Promise<T>;
export type LoaderFunction<T> = (req: Request) => LoaderReturn<T>;
export interface Loader<T = {}> {
  nick: string;
  func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T = {}>(loader: LoaderFunction<T>): Loader<T> {
  return {
    nick: "",
    func: loader,
  };
}
