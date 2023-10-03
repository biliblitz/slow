import { esbuild, join, postcss, resolve } from "../server-deps.ts";
import { buildClientAssets } from "./build-client.ts";
import {
  buildServerActions,
  buildServerComponents,
  buildServerLoaders,
  buildServerMiddlewares,
} from "./build-server.ts";
import { ActionInternal } from "./hooks/action.ts";
import { LoaderInternal } from "./hooks/loader.ts";
import { scanProject } from "./scan.ts";

export type BuildSlowCityOptions = {
  dir?: string;
  esbuildPlugins?: esbuild.Plugin[];
  postcssPlugins?: postcss.AcceptedPlugin[];
};

export async function buildSlowCity(options?: BuildSlowCityOptions) {
  options ??= {};
  options.dir ??= "./app";
  options.dir = resolve(options.dir);
  options.esbuildPlugins ??= [];
  options.postcssPlugins ??= [];

  const project = await scanProject(join(options.dir, "routes"));
  console.log(project);

  const loaders = await buildServerLoaders(project.loaderPaths);
  const actions = await buildServerActions(project.actionPaths);
  const middlewares = await buildServerMiddlewares(project.middlewarePaths);

  console.log("loaders", loaders);
  console.log("actions", actions);
  console.log("middlewares", middlewares);

  const replacements = createReplacements(
    project.loaderPaths,
    project.actionPaths,
    loaders,
    actions,
  );

  const clientAssets = await buildClientAssets(
    "./app/entry.client.tsx",
    project.componentPaths,
    replacements,
  );
  console.log(clientAssets);

  await buildServerComponents(project.componentPaths);
}

function createReplacements(
  loaderPaths: string[],
  actionPaths: string[],
  loaders: [string, LoaderInternal][][],
  actions: [string, ActionInternal][][],
) {
  return new Map([
    ...loaderPaths.map((path, index) => {
      const contents = [
        `import { __internals } from "slow";`,
        ...loaders[index].map(([name, loader]) =>
          `export const ${name} = () => __internals.useLoader("${loader.__ref}");`
        ),
      ].join("\n");
      console.log(path, "=>", contents);
      return [path, contents] as [string, string];
    }),
    ...actionPaths.map((path, index) => {
      const contents = [
        `import { __internals } from "slow";`,
        ...actions[index].map(([name, loader]) =>
          `export const ${name} = () => __internals.useAction("${loader.__ref}");`
        ),
      ].join("\n");
      console.log(path, "=>", contents);
      return [path, contents] as [string, string];
    }),
  ]);
}
