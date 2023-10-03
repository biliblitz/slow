import { ComponentType } from "../deps.ts";
import {
  denoPlugins,
  dirname,
  esbuild,
  mdxPlugin,
  resolve,
  toFileUrl,
} from "../server-deps.ts";
import { postcssPlugin } from "./esbuild/postcss.ts";
import { replacePlugin } from "./esbuild/replace.ts";
import { isMdx } from "./utils/ext.ts";

export async function buildClientAssets(
  entryPoint: string,
  componentPaths: string[],
  replacements: Map<string, string | Uint8Array>,
) {
  const entryPoints = [
    resolve(entryPoint),
    ...componentPaths,
  ];

  const results = await esbuild.build({
    plugins: [
      mdxPlugin({ jsxImportSource: "preact" }),
      postcssPlugin({ plugins: [] }),
      {
        name: "resolve-mdx",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (isMdx(args.path)) {
              return {
                namespace: "file",
                path: args.importer
                  ? resolve(dirname(args.importer), args.path)
                  : args.path,
              };
            }

            return null;
          });
        },
      },
      replacePlugin(replacements),
      ...denoPlugins({
        configPath: resolve("./deno.json"),
      }) as esbuild.Plugin[],
    ],
    entryPoints,
    entryNames: "s-[hash]",
    chunkNames: "s-[hash]",
    assetNames: "assets/a-[hash]",
    bundle: true,
    splitting: true,
    minify: true,
    outdir: "./build",
    format: "esm",
    metafile: true,
    jsx: "automatic",
    jsxImportSource: "preact",
    write: true,
  });

  const assets = Object.keys(results.metafile.outputs);

  const assetsDependencyGraph = Object
    .values(results.metafile.outputs)
    .map((output) => {
      const deps = output.imports.map(({ path }) => assets.indexOf(path));
      if (output.cssBundle) {
        deps.push(assets.indexOf(output.cssBundle));
      }
      return deps;
    });

  const [entryURL, ...componentURLs] = Object
    .entries(results.metafile.outputs)
    .filter(([_, output]) => output.entryPoint)
    .sort((a, b) =>
      entryPoints.indexOf(resolve(a[1].entryPoint!)) -
      entryPoints.indexOf(resolve(b[1].entryPoint!))
    )
    .map(([name, _]) => name);

  return {
    assets,
    entryURL,
    componentURLs,
    assetsDependencyGraph,
  };
}
