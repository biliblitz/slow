// deno-lint-ignore-file no-explicit-any
import { createContext, FunctionComponent, useContext } from "../../deps.ts";
import {
  ActionReference,
  BuiltFile,
  ComponentReference,
  LoaderReference,
} from "../utils.ts";

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

  loaders: [LoaderReference, any][];
  actions: [ActionReference, any][];
  params: [string, string][];
  outlets: ComponentReference[];
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
    imports: Array.from(manager.imports),
    buildGraph: Array.from(manager.buildGraph),
    params: manager.params,
    loaders: manager.loaders,
    actions: manager.actions,
    outlets: manager.outlets,
    basePath: manager.basePath,
    entryPath: manager.entryPath,
  }).replaceAll("/", "\\/");
}

export function deserializeManager(serialized: string) {
  const manager = JSON.parse(serialized);
  return {
    imports: new Map(manager.imports),
    buildGraph: new Map(manager.buildGraph),
    components: new Map(),
    params: manager.params,
    loaders: manager.loaders,
    actions: manager.actions,
    outlets: manager.outlets,
    basePath: manager.basePath,
    entryPath: manager.entryPath,
  } satisfies Manager;
}
