import { extname, join, resolve } from "../server-deps.ts";
import { isJs, isJsOrMdx } from "./utils/ext.ts";

function getFilenameWithoutExt(filename: string) {
  const ext = extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

/**
 * @param name name of the file
 * @param filename filename to test
 * @returns filename is a javascript file and the exactly starts with `name`
 *
 * @example "${name}.ext"
 * @example "${name}.nick.ext" => false
 */
function isNameOf(name: string, filename: string) {
  return getFilenameWithoutExt(filename) === name;
}

/**
 * @param name name of the file
 * @param filename filename to test
 * @returns filename is a javascript file and the starts with `name` or `name` with a dot
 *
 * @example "${name}.ext"
 * @example "${name}.nick.ext"
 * @example "${name}.can.be.very.long.ext"
 */
function isNickOf(name: string, filename: string) {
  const filenameWithoutExt = getFilenameWithoutExt(filename);
  return filenameWithoutExt === name ||
    filenameWithoutExt.startsWith(name + ".");
}

function isIndex(filename: string) {
  return isJsOrMdx(filename) && isNameOf("index", filename);
}

function isLayout(filename: string) {
  return isJsOrMdx(filename) && isNameOf("layout", filename);
}

function isMiddleware(filename: string) {
  return isJs(filename) && isNameOf("middleware", filename);
}

function isLoader(filename: string) {
  return isJs(filename) && isNickOf("loader", filename);
}

function isAction(filename: string) {
  return isJs(filename) && isNickOf("action", filename);
}

/**
 * Escape every malicious charactors for regex
 * @param str string to match
 * @returns an escaped regex string
 * @example "a.b/c" => "a\.b\/c"
 */
function escapeRegex(str: string) {
  return str.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\\\/]/g, "\\$&");
}

function getRouteLevel(dir: string) {
  if (dir === "[...]") {
    return 4;
  } else if (dir.startsWith("[") && dir.endsWith("]")) {
    return 3;
  } else if (dir.startsWith("(") && dir.endsWith(")")) {
    return 2;
  } else {
    return 1;
  }
}

function computeEntryRegex(dirs: string[]) {
  let exp = "";
  const params = [];

  for (const dir of dirs) {
    if (dir === "[...]") {
      exp += "/(.+)";
      params.push("$");
    } else if (dir.startsWith("[") && dir.endsWith("]")) {
      exp += "/([^/]+)";
      params.push(dir.slice(1, -1));
    } else if (dir.startsWith("(") && dir.endsWith(")")) {
      exp += "";
    } else {
      exp += "/" + escapeRegex(encodeURIComponent(dir));
    }
  }

  // Add a optional trailing slash
  const regex = new RegExp(`^${exp}/?$`, "i");
  return { regex, params };
}

export type Entry = {
  regex: RegExp;
  params: string[];
  loaders: number[];
  components: number[];
};

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);
  console.log(`start scanning from ${entrance}`);

  const entires: Entry[] = [];
  const loaderPaths: string[] = [];
  const actionPaths: string[] = [];
  const componentPaths: string[] = [];
  const middlewarePaths: string[] = [];
  const loaderMiddlewares: number[][] = [];
  const actionMiddlewares: number[][] = [];

  function registerEntry(
    dirs: string[],
    loaders: number[],
    components: number[],
  ) {
    const { regex, params } = computeEntryRegex(dirs);
    console.log("entry", regex);
    entires.push({ components, regex, params, loaders });
  }

  function registerComponent(filePath: string) {
    const id = componentPaths.length;
    componentPaths.push(filePath);
    console.log("component", id, "=>", filePath);
    return id;
  }

  function registerMiddleware(filePath: string) {
    const id = middlewarePaths.length;
    middlewarePaths.push(filePath);
    console.log("middleware", id, "=>", filePath);
    return id;
  }

  function registerLoader(filePath: string, middlewares: number[]) {
    const id = loaderPaths.length;
    loaderPaths.push(filePath);
    loaderMiddlewares.push(middlewares);
    console.log("loader", id, "=>", filePath, middlewares);
    return id;
  }

  function registerAction(filePath: string, middlewares: number[]) {
    const id = actionPaths.length;
    actionPaths.push(filePath);
    actionMiddlewares.push(middlewares);
    console.log("action", id, "=>", filePath, middlewares);
    return id;
  }

  async function scanDirectory(
    dirPath: string,
    dirs: string[],
    parentLayouts: number[],
    parentMiddlewares: number[],
    parentLoaders: number[],
  ) {
    const filenames: string[] = [];
    const dirnames: string[] = [];

    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile) filenames.push(entry.name);
      if (entry.isDirectory) dirnames.push(entry.name);
    }

    const indexPaths: string[] = [];
    const layoutPaths: string[] = [];
    const loaderPaths: string[] = [];
    const actionPaths: string[] = [];
    const middlewarePaths: string[] = [];

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isIndex(filename)) indexPaths.push(filePath);
      if (isLayout(filename)) layoutPaths.push(filePath);
      if (isLoader(filename)) loaderPaths.push(filePath);
      if (isAction(filename)) actionPaths.push(filePath);
      if (isMiddleware(filename)) middlewarePaths.push(filePath);
    }

    // Test conflit files
    if (indexPaths.length > 1) {
      throw new Error(
        `Multiple index in same directory found: ${indexPaths[1]}`,
      );
    }
    if (layoutPaths.length > 1) {
      throw new Error(
        `Multiple layout in same directory found: ${layoutPaths[1]}`,
      );
    }
    if (middlewarePaths.length > 1) {
      throw new Error(
        `Multiple middleware in same directory found: ${middlewarePaths[1]}`,
      );
    }

    // === first scan for layouts and middlewares ===
    const layouts = [
      ...parentLayouts,
      ...layoutPaths.map((filePath) => registerComponent(filePath)),
    ];
    const middlewares = [
      ...parentMiddlewares,
      ...middlewarePaths.map((filePath) => registerMiddleware(filePath)),
    ];

    // === second scan for loaders and actions ===
    const loaders = [
      ...parentLoaders,
      ...loaderPaths.map((filePath) => registerLoader(filePath, middlewares)),
    ];
    actionPaths.forEach((filePath) => {
      registerAction(filePath, middlewares);
    });

    // === third scan for index ===
    indexPaths.forEach((filePath) => {
      registerEntry(dirs, loaders, [...layouts, registerComponent(filePath)]);
    });

    // sort dirnames from
    // Catch -> Ignore -> Param -> Match
    dirnames.sort((a, b) => getRouteLevel(a) - getRouteLevel(b));

    for (const dirname of dirnames) {
      const newDirPath = join(dirPath, dirname);
      await scanDirectory(
        newDirPath,
        [...dirs, dirname],
        layouts,
        middlewares,
        loaders,
      );
    }
  }

  await scanDirectory(entrance, [], [], [], []);

  return {
    entires,
    loaderPaths,
    actionPaths,
    componentPaths,
    middlewarePaths,
    loaderMiddlewares,
    actionMiddlewares,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;
