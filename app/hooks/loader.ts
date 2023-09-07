export type LoaderReturn<T> = T | Promise<T>;
export type LoaderFunction<T> = (req: Request) => LoaderReturn<T>;
export interface Loader<T = {}> {
  ref: string;
  func: LoaderFunction<T>;
}

// this function only calls in Deno
export function loader$<T = {}>(loader: LoaderFunction<T>): Loader<T> {
  return {
    ref: "",
    func: loader,
  };
}
