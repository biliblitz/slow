import { compareRoutePaths, validateRoutePath } from "./route.ts";
import { Module, Project, RoutePath } from "./utils.ts";

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

export async function buildRoute(
  directory: string,
  path: RoutePath,
  layouts: string[],
  middlewares: string[]
) {
  const module: Module = {
    path,
    index: null,
    layouts,
    actions: [],
    loaders: [],
    middlewares,
  };

  const routes: Module[] = [];

  const files: string[] = [];
  const dirs: string[] = [];

  for await (const file of Deno.readDir(directory)) {
    if (file.isDirectory) dirs.push(file.name);
    else if (file.isFile) files.push(file.name);
  }

  let layoutFound = false;
  let middlewareFound = false;

  for (const filename of files) {
    const filepath = `${directory}/${filename}`;
    if (filenameMatches(filename, "index")) {
      if (module.index) {
        throw new Error("Multiple index found");
      }
      module.index = filepath;
    } else if (filenameMatches(filename, "layout")) {
      if (layoutFound) {
        throw new Error("Multiple layout found");
      }
      layoutFound = true;
      layouts.push(filepath);
    } else if (filenameMatches(filename, "middleware")) {
      if (middlewareFound) {
        throw new Error("Multiple middleware found");
      }
      middlewareFound = true;
      middlewares.push(filepath);
    } else if (filenameMatchesWithNickname(filename, "loader")) {
      const names = await import(filepath);
      module.loaders.push({ filepath, exports: Object.keys(names) });
    } else if (filenameMatchesWithNickname(filename, "action")) {
      const names = await import(filepath);
      module.actions.push({ filepath, exports: Object.keys(names) });
    }
  }

  for (const dirname of dirs) {
    const dirpath = `${directory}/${dirname}`;

    routes.push(
      ...(await buildRoute(
        dirpath,
        [...path, dirname],
        [...layouts],
        [...middlewares]
      ))
    );
  }

  if (module.index || module.actions.length > 0 || module.loaders.length > 0) {
    routes.push(module);
  }

  return routes;
}

export async function build(root = "./app") {
  const cwd = await Deno.realPath(root);
  console.log(`[build] working in ${cwd}`);

  const project: Project = {
    rootpath: "",
    routes: [],
  };

  for await (const file of Deno.readDir(cwd)) {
    if (file.isFile) {
      const filename = `${cwd}/${file.name}`;
      if (filenameMatches(file.name, "root")) {
        project.rootpath = filename;
      }
    } else if (file.isDirectory) {
      // recursive directory
      if (file.name === "routes") {
        project.routes = await buildRoute(`${cwd}/${file.name}`, [], [], []);
      }
    }
  }

  console.dir(project, { depth: null });
  // validate path
  for (const route of project.routes) {
    validateRoutePath(route.path);
    console.log(route.path);
  }
  // sort paths for later use
  project.routes.sort((a, b) => compareRoutePaths(a.path, b.path));

  return project;
}
