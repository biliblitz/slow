import { ComponentType } from "../deps.ts";
import {
  dirname,
  esbuild,
  mdxPlugin,
  resolve,
  toFileUrl,
} from "../server-deps.ts";
import { postcssPlugin } from "./esbuild/postcss.ts";
import { ActionInternal } from "./hooks/action.ts";
import { LoaderInternal } from "./hooks/loader.ts";
import { createTranspileServer } from "./transpile.ts";
import { hash } from "./utils.ts";
import { isCss, isMdx } from "./utils/ext.ts";

export async function buildServerLoaders(loaderPaths: string[]) {
  return await Promise.all(loaderPaths.map(async (path, index) => {
    const loaderExports = await import(toFileUrl(path).href);
    const loaders = await Promise.all(
      Object.entries(loaderExports)
        .map(async ([name, loader_]) => {
          const loader = loader_ as LoaderInternal;
          const ref = await hash(`loader-${index}-${name}`);
          loader.__ref = ref;
          return [name, loader] as [string, LoaderInternal];
        }),
    );
    return loaders;
  }));
}

export async function buildServerActions(actionPaths: string[]) {
  return await Promise.all(actionPaths.map(async (path, index) => {
    const actionExports = await import(toFileUrl(path).href);
    const actions = await Promise.all(
      Object.entries(actionExports)
        .map(async ([name, action_]) => {
          const action = action_ as ActionInternal;
          const ref = await hash(`action-${index}-${name}`);
          action.__ref = ref;
          return [name, action] as [string, ActionInternal];
        }),
    );
    return actions;
  }));
}

export async function buildServerMiddlewares(middlewarePaths: string[]) {
  return await Promise.all(middlewarePaths.map(async (path) => {
    const { default: middleware } = await import(toFileUrl(path).href);
    return middleware;
  }));
}

export async function buildServerComponents(
  componentPaths: string[],
  replacements: Map<string, string>,
) {
  const controller = createTranspileServer(replacements, 8029);

  const cwd = Deno.cwd();
  const components = await Promise.all(componentPaths.map(async (path) => {
    const url = "http://localhost:8029" + path.replace(cwd, "");
    return (await import(url)).default as ComponentType;
  }));

  // stop the transpile server
  controller.abort();

  return components;
}
