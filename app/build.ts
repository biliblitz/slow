import { Action } from "./hooks/action.ts";
import { Loader } from "./hooks/loader.ts";
import { Middleware } from "./hooks/middleware.ts";
import {
  ActionReference,
  LoaderReference,
  createModule,
  getRoutePathComponent,
  ComponentReference,
  MiddlewareReference,
  filenameMatches,
  filenameMatchesWithNickname,
  hash,
  Dictionary,
} from "./utils.ts";
import { join, resolve } from "path";
import { FunctionComponent } from "preact";

import * as esbuild from "esbuild";
import { denoPlugins } from "esbuild_deno_loader";

export async function build(workingDir = "./app") {
  workingDir = resolve(workingDir);
  // console.log(`[build] working in ${workingDir}`);

  const dictionary: Dictionary = {
    loader: new Map(),
    action: new Map(),
    components: new Map(),
    middlewares: new Map(),
    componentPaths: new Map(),
    componentImports: new Map(),
  };

  async function registerLoader(filepath: string): Promise<LoaderReference[]> {
    const loaders = (await import(filepath)) as Record<string, Loader>;
    return await Promise.all(
      Object.entries(loaders).map(async ([funcname, loader]) => {
        const nick = await hash(`loader:file://${filepath}#${funcname}`);
        loader.nick = nick;
        dictionary.loader.set(nick, loader);
        return nick;
      })
    );
  }

  async function registerAction(filepath: string): Promise<ActionReference[]> {
    const actions = (await import(filepath)) as Record<string, Action>;
    return await Promise.all(
      Object.entries(actions).map(async ([funcname, action]) => {
        const nick = await hash(`action:file://${filepath}#${funcname}`);
        action.nick = nick;
        dictionary.action.set(nick, action);
        return nick;
      })
    );
  }

  async function registerComponent(
    filepath: string
  ): Promise<ComponentReference> {
    const component = (await import(filepath)).default as FunctionComponent;
    if (!component) {
      throw new Error("Index/Layout must export a default component");
    }
    const nick = await hash(`component:file://${filepath}#default`);
    dictionary.components.set(nick, component);
    dictionary.componentPaths.set(nick, filepath);
    return nick;
  }

  async function registerMiddleware(
    filepath: string
  ): Promise<MiddlewareReference> {
    const middleware = (await import(filepath)).default as Middleware;
    if (!middleware) {
      throw new Error("Middleware must be exported as default");
    }
    const nick = await hash(`middleware:file://${filepath}#default`);
    dictionary.middlewares.set(nick, middleware);
    return nick;
  }

  async function buildRoute(directory: string) {
    const module = createModule();

    const files: string[] = [];
    const dirs: string[] = [];

    for await (const file of Deno.readDir(directory)) {
      if (file.isDirectory) dirs.push(file.name);
      else if (file.isFile) files.push(file.name);
      else throw new Error("Symlink is not supported yet");
    }

    for (const filename of files) {
      const filepath = `${directory}/${filename}`;
      if (filenameMatches(filename, "index")) {
        if (module.index) throw new Error("Multiple index found");
        module.index = await registerComponent(filepath);
      } else if (filenameMatches(filename, "layout")) {
        if (module.layout) throw new Error("Multiple layout found");
        module.layout = await registerComponent(filepath);
      } else if (filenameMatches(filename, "middleware")) {
        if (module.middleware) throw new Error("Multiple middleware found");
        module.middleware = await registerMiddleware(filepath);
      } else if (filenameMatchesWithNickname(filename, "loader")) {
        module.loaders.push(...(await registerLoader(filepath)));
      } else if (filenameMatchesWithNickname(filename, "action")) {
        module.actions.push(...(await registerAction(filepath)));
      }
    }

    for (const dirname of dirs) {
      const dirpath = join(directory, dirname);

      module.routes.push({
        path: getRoutePathComponent(dirname),
        module: await buildRoute(dirpath),
      });
    }

    // sort route types
    // match --> pass --> param --> catch
    module.routes.sort((a, b) => a.path.type - b.path.type);

    return module;
  }

  const root = await buildRoute(join(workingDir, "routes"));

  // === analyze entry points ===
  const entryPoints = [
    // add client entrance
    join(workingDir, "entry.client.tsx"),
    // components
    ...dictionary.componentPaths.values(),
  ];

  // clean build dir
  const buildDir = "./build";
  await Deno.remove(buildDir, { recursive: true });

  // TODO: this is panic!
  const result = await esbuild.build({
    plugins: [...denoPlugins({ configPath: resolve("./deno.json") })],
    entryPoints,
    entryNames: "s-[hash]",
    bundle: true,
    splitting: true,
    minify: true,
    chunkNames: "s-[hash]",
    outdir: buildDir,
    format: "esm",
    metafile: true,
    jsx: "automatic",
    jsxImportSource: "preact",
  });

  const buildGraph = new Map<string, string[]>(
    Object.entries(result.metafile.outputs).map(([key, value]) => [
      key,
      value.imports.map(({ path }) => path),
    ])
  );

  const componentBuildResult = new Map(
    Object.entries(result.metafile.outputs)
      .filter(([_, value]) => value.entryPoint)
      .map(([key, value]) => [resolve(value.entryPoint!), key] as const)
  );

  for (const [hash, importPath] of dictionary.componentPaths.entries()) {
    const buildPath = componentBuildResult.get(importPath)!;
    dictionary.componentImports.set(hash, buildPath);
  }
  const entrance = componentBuildResult.get(entryPoints[0])!;
  // console.log(entrance);

  return { root, dictionary, entrance, buildDir, buildGraph };
}

export type Project = Awaited<ReturnType<typeof build>>;
