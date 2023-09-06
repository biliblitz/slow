import { Action } from "./hooks/action.ts";
import { Loader } from "./hooks/loader.ts";
import {
  Module,
  ActionReference,
  LoaderReference,
  Project,
  RoutePathType,
  createModule,
  getRoutePathComponent,
  sha256,
} from "./utils.ts";
import { join } from "path";

import * as esbuild from "esbuild";
import { denoPlugins } from "esbuild_deno_loader";

const jsreg = /\.[jt]sx?$/;

function isJavaScriptFile(filename: string) {
  if (Deno.build.os === "windows") {
    filename = filename.toLocaleLowerCase();
  }
  return jsreg.test(filename);
}

/**
 * Matches `loader.ts`, `loader.nick.tsx`, `loader.anything.else.ts`
 */
function filenameMatchesWithNickname(filename: string, target: string) {
  return isJavaScriptFile(filename) && filename.startsWith(target + ".");
}

/**
 * Matches `root.ts`, `root.tsx`
 */
function filenameMatches(filename: string, target: string) {
  return (
    filename.startsWith(target) &&
    isJavaScriptFile(filename.slice(target.length))
  );
}

export async function build(root = "./app") {
  const cwd = await Deno.realPath(root);
  console.log(`[build] working in ${cwd}`);

  const project: Project = {
    root: createModule(),
    dictionary: {
      loader: new Map<LoaderReference, Loader<any>>(),
      action: new Map<ActionReference, Action<any>>(),
    },
  };

  async function registerLoader(filepath: string): Promise<LoaderReference[]> {
    const loaders = (await import(filepath)) as Record<string, Loader<any>>;
    return await Promise.all(
      Object.entries(loaders).map(async ([funcname, loader]) => {
        const name = `${filepath}\0${funcname}`;
        const nick = (await sha256(name)).slice(0, 8);
        loader.nick = nick;
        project.dictionary.loader.set(nick, loader);
        return nick;
      })
    );
  }

  async function registerAction(filepath: string): Promise<ActionReference[]> {
    const actions = (await import(filepath)) as Record<string, Action<any>>;
    return await Promise.all(
      Object.entries(actions).map(async ([funcname, action]) => {
        const name = `${filepath}\0${funcname}`;
        const nick = (await sha256(name)).slice(0, 8);
        action.nick = nick;
        project.dictionary.action.set(nick, action);
        return nick;
      })
    );
  }

  async function buildRoute(directory: string) {
    const module: Module = {
      index: null,
      layout: null,
      middleware: null,
      actions: [],
      loaders: [],
      routes: [],
    };

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
        module.index = filepath;
      } else if (filenameMatches(filename, "layout")) {
        if (module.layout) throw new Error("Multiple layout found");
        module.layout = filepath;
      } else if (filenameMatches(filename, "middleware")) {
        if (module.middleware) throw new Error("Multiple middleware found");
        module.middleware = filepath;
      } else if (filenameMatchesWithNickname(filename, "loader")) {
        module.loaders.push(...(await registerLoader(filepath)));
      } else if (filenameMatchesWithNickname(filename, "action")) {
        module.actions.push(...(await registerAction(filepath)));
      }
    }

    for (const dirname of dirs) {
      const dirpath = join(directory, dirname);
      const pathComponent = getRoutePathComponent(dirname);

      module.routes.push({
        path: pathComponent,
        module: await buildRoute(dirpath),
      });
    }

    // sort route types
    // match --> pass --> param --> catch
    module.routes.sort((a, b) => a.path.type - b.path.type);

    return module;
  }

  project.root.routes.push({
    path: { type: RoutePathType.PASS },
    module: await buildRoute(join(cwd, "routes")),
  });

  for await (const file of Deno.readDir(cwd)) {
    if (file.isFile) {
      const filepath = join(cwd, file.name);
      if (filenameMatches(file.name, "root")) {
        project.root.layout = filepath;
      } else if (filenameMatchesWithNickname(file.name, "loader")) {
        project.root.loaders.push(...(await registerLoader(filepath)));
      } else if (filenameMatchesWithNickname(file.name, "action")) {
        project.root.actions.push(...(await registerAction(filepath)));
      }
    }
  }

  // TODO: this is panic!
  await esbuild.build({
    plugins: [...denoPlugins()],
    entryPoints: [project.root.layout!],
    bundle: true,
    // minify: true,
    outdir: "./build",
    jsxImportSource: "preact",
    jsx: "transform",
  });

  return project;
}
