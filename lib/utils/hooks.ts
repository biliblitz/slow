import { Context, useContext } from "../../deps.ts";

export function useContextOrThrows<T>(
  context: Context<T | null>,
  errmsg = "Context is nulll",
) {
  const value = useContext(context);
  if (!value) throw new Error(errmsg);
  return value;
}
