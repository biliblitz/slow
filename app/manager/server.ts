import {
  ActionReference,
  BuiltFile,
  Dictionary,
  LoaderReference,
} from "../utils.ts";
import { Manager } from "./index.ts";

type ComponentImports = Dictionary["componentImports"];

type ServerManagerOptions = {
  imports: ComponentImports;
  loaders: Map<LoaderReference, any>;
  actions: Map<ActionReference, any>;
  entrance: BuiltFile;
  buildGraph: Map<BuiltFile, BuiltFile[]>;
};

export function createServerManager(options: ServerManagerOptions): Manager {
  return {
    loaders: options.loaders,
    actions: options.actions,
    entryPath: options.entrance,
    basePath: "/",
    buildGraph: options.buildGraph,
    imports: options.imports,
  };
}
