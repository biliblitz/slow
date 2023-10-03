// deno-lint-ignore-file no-explicit-any
import { ComponentType } from "../../deps.ts";
import {
  BuiltFile,
  ComponentReference,
  Dictionary,
  LoaderReference,
} from "../utils.ts";
import { Manifest } from "./index.ts";

type ComponentImports = Dictionary["componentImports"];

type ServerManifestOptions = {
  graph: Map<BuiltFile, BuiltFile[]>;
  params: [string, string][];
  imports: ComponentImports;
  loaders: [LoaderReference, any][];
  outlets: ComponentReference[];
  entryPath: BuiltFile;
  stylePath: BuiltFile | null;
  components: Map<ComponentReference, ComponentType>;
};

export function createServerManifest(options: ServerManifestOptions): Manifest {
  return {
    graph: options.graph,
    params: options.params,
    loaders: options.loaders,
    imports: options.imports,
    outlets: options.outlets,
    basePath: "/",
    entryPath: options.entryPath,
    stylePath: options.stylePath,
    components: options.components,
  };
}
