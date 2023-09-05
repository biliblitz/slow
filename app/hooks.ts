import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Project } from "./utils.ts";

export type InitialContext = {
  project: Project;
  url: URL;
};

export const SlowInitialContext = createContext<InitialContext | null>(null);

export function useInitialContext() {
  const context = useContext(SlowInitialContext);
  if (!context) {
    throw new Error("invalid call to useInitialContext");
  }
  return context;
}
