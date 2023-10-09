import { useContext } from "preact/hooks";
import { Context } from "preact";

export function useContextOrThrows<T>(
  context: Context<T | null>,
  errmsg = "Context is nulll",
) {
  const value = useContext(context);
  if (!value) throw new Error(errmsg);
  return value;
}
