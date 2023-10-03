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

export async function buildServerComponents(componentPaths: string[]) {
  const contents = [
    ...componentPaths.map((path, i) =>
      `import s${i} from ${JSON.stringify(path)};`
    ),
    `export default [${componentPaths.map((_, i) => `s${i}`).join(", ")}];`,
  ].join("\n");

  console.log(contents);

  const result = await esbuild.build({
    stdin: {
      loader: "js",
      contents: contents,
    },
    plugins: [
      {
        name: "resolve-stdin",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.namespace === "" && args.importer === "<stdin>") {
              // this is import from stdin
              return { path: args.path, namespace: "file" };
            }

            const isRelative = args.path.startsWith("./") ||
              args.path.startsWith("../");

            // resolve mdx files
            if (isMdx(args.path)) {
              if (!isRelative) {
                throw new Error("import MDX only supports relative paths");
              }
              const path = resolve(dirname(args.importer), args.path);
              return { path, namespace: "file" };
            }

            // fix relative paths
            if (isRelative) {
              const path = resolve(dirname(args.importer), args.path);
              return { path: toFileUrl(path).href, external: true };
            }

            return { external: true };
          });
        },
      },
      mdxPlugin({ jsxImportSource: "preact" }),
      {
        name: "ignore-css",
        setup(build) {
          build.onResolve({ filter: /.*/, namespace: "file" }, (args) => {
            if (isCss(args.path)) {
              console.log("we should ignore", args.path);
              return { path: args.path, namespace: "ignore" };
            }
            return null;
          });
          build.onLoad({ filter: /.*/, namespace: "ignore" }, (args) => {
            console.log("now we are ignoring", args.path);
            return { contents: "export{}", loader: "js" };
          });
        },
      },
    ],
    bundle: true,
    splitting: false,
    write: false,
    format: "esm",
  });

  console.log(result.outputFiles[0].text);
}
