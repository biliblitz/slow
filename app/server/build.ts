import { FunctionComponent } from "../../deps.ts";
import {
  denoPlugins,
  esbuild,
  join,
  resolve,
  toFileUrl,
} from "../../server-deps.ts";

import { Action } from "../hooks/action.ts";
import { Loader } from "../hooks/loader.ts";
import { Middleware } from "../hooks/middleware.ts";
import {
  ActionReference,
  ComponentReference,
  createModule,
  Dictionary,
  filenameMatches,
  filenameMatchesWithNickname,
  getRoutePathComponent,
  hash,
  LoaderReference,
  MiddlewareReference,
} from "../utils.ts";

function staticReplacePlugin(mapping: Map<string, string>): esbuild.Plugin {
  return {
    name: "static-replace",
    setup(build) {
      build.onLoad({ filter: /.*/ }, (args) => {
        if (args.namespace === "file" && mapping.has(args.path)) {
          return {
            contents: mapping.get(args.path),
            loader: "js",
          };
        }
        return null;
      });
    },
  };
}

async function buildClientAssets(
  entryPoints: string[],
  plugins: esbuild.Plugin[],
) {
  const result = await esbuild.build({
    plugins,
    entryPoints,
    entryNames: "s-[hash]",
    bundle: true,
    splitting: true,
    minify: true,
    chunkNames: "s-[hash]",
    outdir: "./build",
    format: "esm",
    metafile: true,
    jsx: "automatic",
    jsxImportSource: "preact",
    write: false,
    // sourcemap: true,
  });

  // "file:///project/build/s-XXXXXXXX.js" => "import ..."
  const filePathToContents = new Map(result.outputFiles.map((file) => {
    return [toFileUrl(file.path).href, file.contents];
  }));

  // "build/s-XXXXXXXX.js" => "import ..."
  const buildAssets = new Map(
    Object.keys(result.metafile.outputs)
      .map((file) => {
        const fileUrl = toFileUrl(resolve(file)).href;
        return [file, filePathToContents.get(fileUrl)!];
      }),
  );

  // "build/s-XXXXXXXX.js" => ["build/s-YYYYYYYY.js", "build/s-ZZZZZZZZ.js"]
  const buildGraph = new Map(
    Object.entries(result.metafile.outputs)
      .map(([key, value]) => [key, value.imports.map(({ path }) => path)]),
  );

  /** "file:///path/to/entry/point.tsx" => "build/s-XXXXXXXX.js" */
  const buildEntries = new Map(
    Object.entries(result.metafile.outputs)
      .filter(([_, value]) => value.entryPoint)
      .map(([key, value]) => [toFileUrl(resolve(value.entryPoint!)).href, key]),
  );

  return {
    buildAssets,
    buildGraph,
    buildEntries,
  };
}

export async function build(workingDir = "./app") {
  workingDir = resolve(workingDir);

  const dictionary: Dictionary = {
    loader: new Map(),
    action: new Map(),
    components: new Map(),
    middlewares: new Map(),
    componentUrls: new Map(),
    componentImports: new Map(),
  };

  const loaderPaths: {
    filePath: string;
    exports: { funcname: string; ref: string }[];
  }[] = [];
  const actionPaths: {
    filePath: string;
    exports: { funcname: string; method: string; ref: string }[];
  }[] = [];

  async function registerLoader(filePath: string): Promise<LoaderReference[]> {
    const fileUrl = toFileUrl(filePath).href;
    const loaders = (await import(fileUrl)) as Record<string, Loader>;
    const exports = await Promise.all(
      Object.entries(loaders).map(async ([funcname, loader]) => {
        const ref = await hash(`loader:${fileUrl}#${funcname}`);
        loader.__ref = ref;
        dictionary.loader.set(ref, loader);
        return { ref, funcname };
      }),
    );
    loaderPaths.push({ filePath, exports });
    return exports.map(({ ref }) => ref);
  }

  async function registerAction(filePath: string): Promise<ActionReference[]> {
    const fileUrl = toFileUrl(filePath).href;
    const actions = (await import(fileUrl)) as Record<string, Action>;
    const exports = await Promise.all(
      Object.entries(actions).map(async ([funcname, action]) => {
        const ref = await hash(`action:${fileUrl}#${funcname}`);
        action.__ref = ref;
        dictionary.action.set(ref, action);
        return { ref, funcname, method: action.__method };
      }),
    );
    actionPaths.push({ filePath, exports });
    return exports.map(({ ref }) => ref);
  }

  async function registerComponent(
    filePath: string,
  ): Promise<ComponentReference> {
    const fileUrl = toFileUrl(filePath).href;
    const component = (await import(fileUrl)).default as FunctionComponent;
    if (!component) {
      throw new Error("Index/Layout must export a default component");
    }
    const nick = await hash(`component:${fileUrl}#default`);
    dictionary.components.set(nick, component);
    dictionary.componentUrls.set(nick, fileUrl);
    return nick;
  }

  async function registerMiddleware(
    filePath: string,
  ): Promise<MiddlewareReference> {
    const fileUrl = toFileUrl(filePath).href;
    const middleware = (await import(fileUrl)).default as Middleware;
    if (!middleware) {
      throw new Error("Middleware must be exported as default");
    }
    const nick = await hash(`middleware:${fileUrl}#default`);
    dictionary.middlewares.set(nick, middleware);
    return nick;
  }

  async function scanRoutes(directory: string) {
    const module = createModule();

    const files: string[] = [];
    const dirs: string[] = [];

    for await (const file of Deno.readDir(directory)) {
      if (file.isDirectory) dirs.push(file.name);
      else if (file.isFile) files.push(file.name);
      else throw new Error("Symlink is not supported yet");
    }

    for (const filename of files) {
      const filePath = join(directory, filename);
      if (filenameMatches(filename, "index")) {
        if (module.index) throw new Error("Multiple index found");
        module.index = await registerComponent(filePath);
      } else if (filenameMatches(filename, "layout")) {
        if (module.layout) throw new Error("Multiple layout found");
        module.layout = await registerComponent(filePath);
      } else if (filenameMatches(filename, "middleware")) {
        if (module.middleware) throw new Error("Multiple middleware found");
        module.middleware = await registerMiddleware(filePath);
      } else if (filenameMatchesWithNickname(filename, "loader")) {
        module.loaders.push(...(await registerLoader(filePath)));
      } else if (filenameMatchesWithNickname(filename, "action")) {
        module.actions.push(...(await registerAction(filePath)));
      }
    }

    for (const dirname of dirs) {
      const dirpath = join(directory, dirname);

      module.routes.push({
        path: getRoutePathComponent(dirname),
        module: await scanRoutes(dirpath),
      });
    }

    // sort route types
    // match --> pass --> param --> catch
    module.routes.sort((a, b) => a.path.type - b.path.type);

    return module;
  }

  const root = await scanRoutes(join(workingDir, "routes"));

  // === analyze entry points ===
  const entryPoints = [
    // add client entrance
    toFileUrl(join(workingDir, "entry.client.tsx")).href,
    // components
    ...dictionary.componentUrls.values(),
  ];

  // generate replacements for import loader/action in esbuild
  const fileConvertList = new Map(
    [
      ...loaderPaths.map(({ filePath, exports }) => {
        const contents = [
          'import { useLoader } from "slow";',
          ...exports.map(({ funcname, ref }) => {
            return `export const ${funcname} = () => useLoader("${ref}");`;
          }),
        ].join("\n");
        return [filePath, contents] as const;
      }),
      ...actionPaths.map(({ filePath, exports }) => {
        const contents = [
          'import { useAction } from "slow";',
          ...exports.map(({ funcname, ref, method }) => {
            return `export const ${funcname} = () => useAction("${ref}", "${method}");`;
          }),
        ].join("\n");
        return [filePath, contents] as const;
      }),
    ],
  );

  const { buildAssets, buildGraph, buildEntries } = await buildClientAssets(
    entryPoints,
    [
      staticReplacePlugin(fileConvertList),
      ...denoPlugins({
        configPath: resolve("./deno.json"),
      }) as esbuild.Plugin[],
    ],
  );

  for (const [hash, importUrl] of dictionary.componentUrls.entries()) {
    const buildPath = buildEntries.get(importUrl)!;
    dictionary.componentImports.set(hash, buildPath);
  }
  const entrance = buildEntries.get(entryPoints[0])!;

  return { root, dictionary, entrance, buildAssets, buildGraph };
}

export type Project = Awaited<ReturnType<typeof build>>;
