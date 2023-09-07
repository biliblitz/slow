import { useContext } from "preact/hooks";
import { createContext } from "preact";
import { BuiltFile, ComponentReference, LoaderReference } from "../utils.ts";

export interface Manager {
  loaders: Map<LoaderReference, any>;
  actions: Map<LoaderReference, any>;
  entryPath: BuiltFile;
  basePath: string;
  buildGraph: Map<BuiltFile, BuiltFile[]>;
  imports: Map<ComponentReference, BuiltFile>;
}

export const ManagerContext = createContext<Manager | null>(null);

export function useManager() {
  const manager = useContext(ManagerContext);
  if (!manager) {
    throw new Error("Invalid call to useManager()");
  }
  return manager;
}
