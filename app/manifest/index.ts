// deno-lint-ignore-file no-explicit-any
import { createContext, FunctionComponent, useContext } from "../../deps.ts";
import {
  ActionReference,
  BuiltFile,
  ComponentReference,
  LoaderReference,
} from "../utils.ts";

export type Manifest = {
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

export const ManifestContext = createContext<Manifest | null>(null);

export function useManifest() {
  const manifest = useContext(ManifestContext);
  if (!manifest) {
    throw new Error("Please use hydrate function from slow");
  }
  return manifest;
}

export function serializeManifest(manifest: Manifest) {
  return JSON.stringify({
    imports: Array.from(manifest.imports),
    buildGraph: Array.from(manifest.buildGraph),
    params: manifest.params,
    loaders: manifest.loaders,
    actions: manifest.actions,
    outlets: manifest.outlets,
    basePath: manifest.basePath,
    entryPath: manifest.entryPath,
  }).replaceAll("/", "\\/");
}

export function deserializeManifest(serialized: string) {
  const manifest = JSON.parse(serialized);
  return {
    imports: new Map(manifest.imports),
    buildGraph: new Map(manifest.buildGraph),
    components: new Map(),
    params: manifest.params,
    loaders: manifest.loaders,
    actions: manifest.actions,
    outlets: manifest.outlets,
    basePath: manifest.basePath,
    entryPath: manifest.entryPath,
  } satisfies Manifest;
}
