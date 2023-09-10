import { createContext, FunctionComponent, useContext } from "../../deps.ts";
import { Loaders, Outlets, Params } from "../route.ts";
import { BuiltFile, ComponentReference } from "../utils.ts";

export type PageData = {
  loaders: Loaders;
  outlets: Outlets;
  params: Params;
};

export type Manifest = {
  /** entrance of the entire website, `"build/s-XXXXXXXX.js"` */
  entryPath: BuiltFile;
  /** entrance of the entire style, `"build/s-XXXXXXXX.css"` */
  stylePath: BuiltFile | null;
  /** Where the website hosts, default to `/` */
  basePath: string;
  /** `"build/s-XXXXXXXX.js" => ["build/s-YYYYYYYY.js", "build/s-ZZZZZZZZ.js"]` */
  graph: Map<BuiltFile, BuiltFile[]>;
  /** `"cccccccc" => "build/s-XXXXXXXX.js"` */
  imports: Map<ComponentReference, BuiltFile>;
  /** `"cccccccc" => <Component />` */
  components: Map<ComponentReference, FunctionComponent>;
} & PageData;

export const ManifestContext = createContext<Manifest | null>(null);

export function useManifest() {
  const manifest = useContext(ManifestContext);
  if (!manifest) {
    throw new Error("Please use hydrate function from slow");
  }
  return manifest;
}

export function serializeManifest(manifest: Manifest) {
  const map = Array.from(manifest.graph.keys());
  const reverseMap = new Map(Array.from(map.entries()).map(([a, b]) => [b, a]));
  const encode = (file: string) => reverseMap.get(file)!;
  const imports = Array.from(manifest.imports)
    .map(([ref, file]) => [ref, encode(file)]);
  const graph = Array.from(manifest.graph)
    .map(([file, deps]) => [encode(file), deps.map(encode)]);

  return JSON.stringify({
    map: map.map((file) => file.slice(6)),
    graph,
    imports,
    params: manifest.params,
    loaders: manifest.loaders,
    outlets: manifest.outlets,
    basePath: manifest.basePath,
    entryPath: encode(manifest.entryPath),
    stylePath: manifest.stylePath
      ? encode(manifest.stylePath)
      : manifest.stylePath,
  }).replaceAll("/", "\\/");
}

export function deserializeManifest(serialized: string): Manifest {
  const manifest = JSON.parse(serialized);
  const map = (manifest.map as string[]).map((file) => `build/${file}`);
  const decode = (id: number) => map[id];

  const imports = new Map((manifest.imports as [string, number][])
    .map(([ref, id]) => [ref, decode(id)]));
  const graph = new Map((manifest.graph as [number, number[]][])
    .map(([file, deps]) => [decode(file), deps.map(decode)]));

  return {
    imports,
    graph: graph,
    components: new Map(),
    params: manifest.params,
    loaders: manifest.loaders,
    outlets: manifest.outlets,
    basePath: manifest.basePath,
    entryPath: decode(manifest.entryPath),
    stylePath: typeof manifest.stylePath === "number"
      ? decode(manifest.stylePath)
      : manifest.stylePath,
  };
}
