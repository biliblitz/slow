// deno-lint-ignore-file no-explicit-any
import { FunctionComponent } from "../../deps.ts";
import {
  ActionReference,
  BuiltFile,
  ComponentReference,
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
  renderTree: ComponentReference[];
  components: Map<ComponentReference, FunctionComponent>;
};

export function createServerManager(options: ServerManagerOptions): Manager {
  return {
    loaders: options.loaders,
    actions: options.actions,
    entryPath: options.entrance,
    basePath: "/",
    buildGraph: options.buildGraph,
    imports: options.imports,
    renderTree: options.renderTree,
    components: options.components,
  };
}
