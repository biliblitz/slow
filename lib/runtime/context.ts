import { createContext, useContext } from "../../deps.ts";
import { Runtime } from "./client.tsx";

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error();
  return value;
}
