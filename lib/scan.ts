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

function isEndpoint(filename: string) {
  return isJs(filename) && isNameOf("endpoint", filename);
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
  exp = "^" + exp + "/?$";
  const regex = new RegExp(exp, "i");
  return { regex, params };
}

export type Entry = {
  regex: RegExp;
  params: string[];
  loaders: number[];
  components: number[];
  middlewares: number[];
};

export type EndpointEntry = {
  regex: RegExp;
  params: string[];
  endpoint: number;
  middlewares: number[];
};

export async function scanProjectStructure(entrance: string) {
  entrance = resolve(entrance);
  console.log(`start scanning from ${entrance}`);

  const entires: Entry[] = [];
  const endpoints: EndpointEntry[] = [];
  const loaderPaths: string[] = [];
  const actionPaths: string[] = [];
  const componentPaths: string[] = [];
  const middlewarePaths: string[] = [];
  const actionMiddlewares: number[][] = [];

  function registerEntry(
    dirs: string[],
    components: number[],
    middlewares: number[],
    loaders: number[],
  ) {
    const { regex, params } = computeEntryRegex(dirs);
    console.log("entry", regex);
    entires.push({ components, regex, params, middlewares, loaders });
  }

  function registerEndpoint(
    dirs: string[],
    middlewares: number[],
    endpoint: number,
  ) {
    const { regex, params } = computeEntryRegex(dirs);
    console.log("endpoint", regex);
    return endpoints.push({ regex, params, endpoint, middlewares });
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

  function registerLoader(filePath: string) {
    const id = loaderPaths.length;
    loaderPaths.push(filePath);
    console.log("loader", id, "=>", filePath);
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

    // === first scan for layouts and middlewares ===
    const layouts = [...parentLayouts];
    const middlewares = [...parentMiddlewares];

    let foundLayout = false;
    let foundMiddleware = false;

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isLayout(filename)) {
        if (foundLayout) {
          throw new Error(
            `Multiple layout in same directory found: ${filePath}`,
          );
        }
        foundLayout = true;
        layouts.push(registerComponent(filePath));
      }
      if (isMiddleware(filename)) {
        if (foundMiddleware) {
          throw new Error(
            `Multiple middleware in same directory found: ${filePath}`,
          );
        }
        foundMiddleware = true;
        middlewares.push(registerMiddleware(filePath));
      }
    }

    // === second scan for loaders and actions ===
    const loaders = [...parentLoaders];

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);

      if (isLoader(filename)) {
        loaders.push(registerLoader(filePath));
      }
      if (isAction(filename)) {
        registerAction(filePath, middlewares);
      }
    }

    // === third scan for index and endpoints ===
    let foundIndex = false;
    let foundEndpoint = false;

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);

      if (isIndex(filename)) {
        if (foundIndex) {
          throw new Error(
            `Multiple index in same directory found: ${filePath}`,
          );
        }
        if (foundEndpoint) {
          throw new Error(`Endpoint cannot exist with index: ${filePath}`);
        }
        foundIndex = true;
        const index = registerComponent(filePath);
        registerEntry(dirs, [...layouts, index], middlewares, loaders);
      }

      if (isEndpoint(filename)) {
        if (foundEndpoint) {
          throw new Error(
            `Multiple endpoint in same directory found: ${filePath}`,
          );
        }
        if (foundIndex) {
          throw new Error(`Endpoint cannot exist with index: ${filePath}`);
        }
        foundEndpoint = true;
        const endpoint = registerMiddleware(filePath);
        registerEndpoint(dirs, middlewares, endpoint);
      }
    }

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
    endpoints,
    loaderPaths,
    actionPaths,
    componentPaths,
    middlewarePaths,
    actionMiddlewares,
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;
