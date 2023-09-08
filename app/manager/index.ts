// deno-lint-ignore-file no-explicit-any
import { createContext, FunctionComponent, useContext } from "../../deps.ts";
import { BuiltFile, ComponentReference, LoaderReference } from "../utils.ts";

export type Manager = {
  /** entrance of the entire website, `"build/s-XXXXXXXX.js"` */
  entryPath: BuiltFile;
  /** Where the website hosts, default to `/` */
  basePath: string;
  /** `"build/s-XXXXXXXX.js" => ["build/s-YYYYYYYY.js", "build/s-ZZZZZZZZ.js"]` */
  buildGraph: Map<BuiltFile, BuiltFile[]>;
  /** `"cccccccc" => "build/s-XXXXXXXX.js"` */
  imports: Map<ComponentReference, BuiltFile>;
  /** `"cccccccc" => <Component />` */
  components: Map<ComponentReference, FunctionComponent>;

  loaders: Map<LoaderReference, any>;
  actions: Map<LoaderReference, any>;
  renderTree: ComponentReference[];
};

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
    imports: Array.from(manager.imports),
    buildGraph: Array.from(manager.buildGraph),
    basePath: manager.basePath,
    entryPath: manager.entryPath,
    renderTree: manager.renderTree,
  }).replaceAll("/", "\\/");
}

export function deserializeManager(serialized: string) {
  const manager = JSON.parse(serialized);
  return {
    loaders: new Map(manager.loaders),
    actions: new Map(manager.actions),
    imports: new Map(manager.imports),
    buildGraph: new Map(manager.buildGraph),
    components: new Map(),
    basePath: manager.basePath,
    entryPath: manager.entryPath,
    renderTree: manager.renderTree,
  } as Manager;
}
