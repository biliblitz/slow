import { extname, join, resolve } from "../deps.ts";
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

function isError(filename: string) {
  return isJsOrMdx(filename) && isNameOf("error", filename);
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
  directories: number[];
};

export type Directory = {
  index: number | null;
  error: number | null;
  layout: number | null;
  loaders: number[];
  actions: number[];
  middleware: number | null;
};

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);
  console.log(`start scanning from ${entrance}`);

  const errors: Entry[] = [];
  const entires: Entry[] = [];
  const loaderPaths: string[] = [];
  const actionPaths: string[] = [];
  const directories: Directory[] = [];
  const componentPaths: string[] = [];
  const middlewarePaths: string[] = [];

  function registerEntry(
    dirnames: string[],
    directories: number[],
  ) {
    const { regex, params } = computeEntryRegex(dirnames);
    console.log("entry =>", regex, params, directories);
    entires.push({ regex, params, directories });
  }

  function registerDirectory(
    directory: Directory,
  ) {
    const id = directories.length;
    directories.push(directory);
    console.log("directory", id, "=>", directory);
    return id;
  }

  function registerComponent(filePath: string | undefined) {
    if (!filePath) return null;
    const id = componentPaths.length;
    componentPaths.push(filePath);
    console.log("component", id, "=>", filePath);
    return id;
  }

  function registerMiddleware(filePath: string | undefined) {
    if (!filePath) return null;
    const id = middlewarePaths.length;
    middlewarePaths.push(filePath);
    console.log("middleware", id, "=>", filePath);
    return id;
  }

  function registerLoader(filePath: string) {
    const id = loaderPaths.length;
    loaderPaths.push(filePath);
    console.log("loader", id, "=>", filePath);
    return id;
  }

  function registerAction(filePath: string) {
    const id = actionPaths.length;
    actionPaths.push(filePath);
    console.log("action", id, "=>", filePath);
    return id;
  }

  async function scanDirectory(
    dirPath: string,
    currentDirnames: string[],
    currentDirectories: number[],
  ) {
    const filenames: string[] = [];
    const dirnames: string[] = [];

    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile) filenames.push(entry.name);
      if (entry.isDirectory) dirnames.push(entry.name);
    }

    const indexPaths: string[] = [];
    const errorPaths: string[] = [];
    const layoutPaths: string[] = [];
    const loaderPaths: string[] = [];
    const actionPaths: string[] = [];
    const middlewarePaths: string[] = [];

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isIndex(filename)) indexPaths.push(filePath);
      if (isError(filename)) errorPaths.push(filePath);
      if (isLayout(filename)) layoutPaths.push(filePath);
      if (isLoader(filename)) loaderPaths.push(filePath);
      if (isAction(filename)) actionPaths.push(filePath);
      if (isMiddleware(filename)) middlewarePaths.push(filePath);
    }

    // Test conflit files
    if (indexPaths.length > 1) {
      throw new Error(
        `Multiple index page in same directory found: ${indexPaths[1]}`,
      );
    }
    if (errorPaths.length > 1) {
      throw new Error(
        `Multiple error page in same directory found: ${indexPaths[1]}`,
      );
    }
    if (layoutPaths.length > 1) {
      throw new Error(
        `Multiple layout page in same directory found: ${layoutPaths[1]}`,
      );
    }
    if (middlewarePaths.length > 1) {
      throw new Error(
        `Multiple middleware in same directory found: ${middlewarePaths[1]}`,
      );
    }

    const index = registerComponent(indexPaths[0]);
    const error = registerComponent(errorPaths[0]);
    const layout = registerComponent(layoutPaths[0]);
    const loaders = loaderPaths.map((filePath) => registerLoader(filePath));
    const actions = actionPaths.map((filePath) => registerAction(filePath));
    const middleware = registerMiddleware(middlewarePaths[0]);

    const directory = registerDirectory(
      { index, error, layout, loaders, actions, middleware },
    );

    // register entry for index
    if (directories[directory].index) {
      registerEntry(currentDirnames, [...currentDirectories, directory]);
    }

    // sort dirnames from
    // Catch -> Ignore -> Param -> Match
    dirnames.sort((a, b) => getRouteLevel(a) - getRouteLevel(b));

    for (const dirname of dirnames) {
      const newDirPath = join(dirPath, dirname);
      await scanDirectory(
        newDirPath,
        [...currentDirnames, dirname],
        [...currentDirectories, directory],
      );
    }
  }

  await scanDirectory(entrance, [], []);

  return {
    errors,
    entires,
    directories,
    loaderPaths,
    actionPaths,
    componentPaths,
    middlewarePaths,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;
