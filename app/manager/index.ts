// deno-lint-ignore-file no-explicit-any
import { createContext, FunctionComponent, useContext } from "../../deps.ts";
import { BuiltFile, ComponentReference, LoaderReference } from "../utils.ts";

export interface Manager {
  loaders: Map<LoaderReference, any>;
  actions: Map<LoaderReference, any>;
  entryPath: BuiltFile;
  basePath: string;
  buildGraph: Map<BuiltFile, BuiltFile[]>;
  imports: Map<ComponentReference, BuiltFile>;
  renderTree: ComponentReference[];
  components: Map<ComponentReference, FunctionComponent>;
}

export const ManagerContext = createContext<Manager | null>(null);

export function useManager() {
  const manager = useContext(ManagerContext);
  if (!manager) {
    throw new Error("Please use hydrate function from slow");
  }
  return manager;
}

export function serializeManager(manager: Manager) {
  return JSON.stringify({
    loaders: Array.from(manager.loaders),
    actions: Array.from(manager.actions),
    entryPath: manager.entryPath,
    basePath: manager.basePath,
    buildGraph: Array.from(manager.buildGraph),
    imports: Array.from(manager.imports),
    renderTree: manager.renderTree,
    components: Array.from(manager.components),
  }).replaceAll("/", "\\/");
}

export function deserializeManager(serialized: string) {
  const manager = JSON.parse(serialized);
  return {
    loaders: new Map(manager.loaders),
    actions: new Map(manager.actions),
    entryPath: manager.entryPath,
    basePath: manager.basePath,
    buildGraph: new Map(manager.buildGraph),
    imports: new Map(manager.imports),
    renderTree: manager.renderTree,
    components: new Map(manager.components),
  } as Manager;
}
