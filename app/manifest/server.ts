// deno-lint-ignore-file no-explicit-any
import { FunctionComponent } from "../../deps.ts";
import {
  ActionReference,
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
  actions: [ActionReference, any][];
  outlets: ComponentReference[];
  entrance: BuiltFile;
  components: Map<ComponentReference, FunctionComponent>;
};

export function createServerManifest(options: ServerManifestOptions): Manifest {
  return {
    graph: options.graph,
    params: options.params,
    loaders: options.loaders,
    actions: options.actions,
    imports: options.imports,
    outlets: options.outlets,
    basePath: "/",
    entryPath: options.entrance,
    components: options.components,
  };
}
