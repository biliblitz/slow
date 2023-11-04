import { esbuild, join, mdx, postcss, resolve } from "../deps.ts";
import { buildClientAssets } from "./build-client.ts";
import {
  buildServerActions,
  buildServerComponents,
  buildServerLoaders,
  buildServerMiddlewares,
} from "./build-server.ts";
import { ActionInternal } from "./hooks/action.ts";
import { LoaderInternal } from "./hooks/loader.ts";
import { scanProjectStructure } from "./scan.ts";

export type BuildBlitzCityOptions = Partial<{
  dir: string;
  esbuildPlugins: esbuild.Plugin[];
  postcssPlugins: postcss.AcceptedPlugin[];
  mdxOptions: mdx.CompileOptions & mdx.ProcessorOptions;
}>;

export async function buildBlitzCity(
  options: BuildBlitzCityOptions = {},
) {
  options.dir = resolve(options.dir ?? "./app");

  const project = await scanProjectStructure(join(options.dir, "routes"));

  const middlewares = await buildServerMiddlewares(project.middlewarePaths);
  const loaders = await buildServerLoaders(project.loaderPaths);
  const actions = await buildServerActions(project.actionPaths);

  const actionMap = createActionMap(actions);
  const replacements = createReplacements(
    project.loaderPaths,
    project.actionPaths,
    loaders,
    actions,
  );

  const assets = await buildClientAssets(
    options,
    project.componentPaths,
    replacements,
  );

  const components = await buildServerComponents(
    options,
    project.componentPaths,
    replacements,
  );

  return {
    assets,
    loaders,
    actions,
    project,
    actionMap,
    components,
    middlewares,
  };
}

export type BlitzCity = Awaited<ReturnType<typeof buildBlitzCity>>;

function createReplacements(
  loaderPaths: string[],
  actionPaths: string[],
  loaders: LoaderInternal[][],
  actions: ActionInternal[][],
) {
  return new Map([
    ...loaderPaths.map((path, index) => {
      const contents = [
        `// loader: ${path}`,
        `import { __internals } from "blitz";`,
        ...loaders[index].map((loader) =>
          `export const ${loader.name} = () => __internals.useLoader("${loader.ref}");`
        ),
      ].join("\n");
      return [path, contents] as [string, string];
    }),
    ...actionPaths.map((path, index) => {
      const contents = [
        `// action: ${path}`,
        `import { __internals } from "blitz";`,
        ...actions[index].map((action) =>
          `export const ${action.name} = () => __internals.useAction("${action.ref}");`
        ),
      ].join("\n");
      return [path, contents] as [string, string];
    }),
  ]);
}

function createActionMap(
  actions: ActionInternal[][],
) {
  return new Map(
    actions.flatMap((action) =>
      action.map((internal) => [internal.ref, internal])
    ),
  );
}
