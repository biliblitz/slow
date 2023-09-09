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
  params: [string, string][];
  imports: ComponentImports;
  loaders: [LoaderReference, any][];
  actions: [ActionReference, any][];
  outlets: ComponentReference[];
  entrance: BuiltFile;
  buildGraph: Map<BuiltFile, BuiltFile[]>;
  components: Map<ComponentReference, FunctionComponent>;
};

export function createServerManifest(options: ServerManifestOptions): Manifest {
  return {
    params: options.params,
    loaders: options.loaders,
    actions: options.actions,
    entryPath: options.entrance,
    basePath: "/",
    buildGraph: options.buildGraph,
    imports: options.imports,
    outlets: options.outlets,
    components: options.components,
  };
}
