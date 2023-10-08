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

  function registerAction(filePath: string) {
    const id = actionPaths.length;
    actionPaths.push(filePath);
    console.log("action", id, "=>", filePath);
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

    let foundIndex: null | number = null;
    let foundLayout: null | number = null;
    let foundEndpoint: null | number = null;
    let foundMiddleware: null | number = null;
    const currentLoaders: number[] = [];
    const currentActions: number[] = [];

    for (const filename of filenames) {
      const filePath = join(dirPath, filename);
      if (isIndex(filename)) {
        if (foundIndex !== null) {
          throw new Error(
            `Multiple index in same directory found: ${filePath}`,
          );
        }
        if (foundEndpoint !== null) {
          throw new Error(`Endpoint cannot exist with index: ${filePath}`);
        }
        foundIndex = registerComponent(filePath);
      }
      if (isEndpoint(filename)) {
        if (foundEndpoint !== null) {
          throw new Error(
            `Multiple endpoint in same directory found: ${filePath}`,
          );
        }
        if (foundIndex !== null) {
          throw new Error(`Endpoint cannot exist with index: ${filePath}`);
        }
        foundEndpoint = registerMiddleware(filePath);
      }
      if (isLayout(filename)) {
        if (foundLayout !== null) {
          throw new Error(
            `Multiple layout in same directory found: ${filePath}`,
          );
        }
        foundLayout = registerComponent(filePath);
      }
      if (isMiddleware(filename)) {
        if (foundMiddleware !== null) {
          throw new Error(
            `Multiple middleware in same directory found: ${filePath}`,
          );
        }
        foundMiddleware = registerMiddleware(filePath);
      }
      if (isLoader(filename)) {
        currentLoaders.push(registerLoader(filePath));
      }
      if (isAction(filename)) {
        currentActions.push(registerAction(filePath));
      }
    }

    // add layout to layouts
    const layouts = [...parentLayouts];
    if (foundLayout !== null) {
      layouts.push(foundLayout);
    }

    // add middlewares
    const middlewares = [...parentMiddlewares];
    if (foundMiddleware !== null) {
      middlewares.push(foundMiddleware);
    }

    // sort loaders
    const loaders = [...parentLoaders, ...currentLoaders];

    // register entry
    if (foundIndex !== null) {
      registerEntry(dirs, [...layouts, foundIndex], middlewares, loaders);
    }

    // register endpoint
    if (foundEndpoint !== null) {
      registerEndpoint(dirs, middlewares, foundEndpoint);
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
  };
}

export type ProjectStructure = Awaited<ReturnType<typeof scanProjectStructure>>;
