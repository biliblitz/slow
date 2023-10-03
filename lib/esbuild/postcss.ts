import { esbuild, postcss, toFileUrl } from "../../server-deps.ts";
import { isAssert, isCss } from "../utils/ext.ts";

const cache = await caches.open("esbuild-plugin-postcss");

async function downloadResouceWithCache(url: string) {
  const cacheResponse = await cache.match(url);
  if (cacheResponse) return cacheResponse;
  console.log("Downloading " + url);
  const response = await fetch(url, { redirect: "follow" });
  cache.put(url, response.clone());
  return response;
}

export function postcssPlugin(
  options: { plugins: postcss.AcceptedPlugin[] },
): esbuild.Plugin {
  const processor = postcss(options?.plugins);

  return {
    name: "postcss",
    setup(build) {
      // local css imports
      build.onResolve(
        { filter: /.*/, namespace: "file" },
        (args) => {
          if (isCss(args.path) || isAssert(args.path)) {
            const url = args.importer
              ? new URL(args.path, toFileUrl(args.importer))
              : toFileUrl(args.path);

            if (url.protocol === "file:") {
              return { path: url.pathname, namespace: "file" };
            }
            if (url.protocol === "http:" || url.protocol === "https:") {
              return { path: url.href, namespace: "postcss-remote-source" };
            }

            throw new Error(`Unknown import protocol: '${url.protocol}'`);
          }

          return null;
        },
      );

      // remote css imports
      build.onResolve(
        { filter: /.*/, namespace: "postcss-remote-source" },
        (args) => {
          const url = new URL(args.path, args.importer);

          if (isCss(url.pathname) || isAssert(url.pathname)) {
            if (url.protocol === "http:" || url.protocol === "https:") {
              return { path: url.href, namespace: "postcss-remote-source" };
            }
            throw new Error(`Unknown import protocol: '${url.protocol}'`);
          }

          return null;
        },
      );

      // download remote css file
      build.onLoad(
        { filter: /.*/, namespace: "postcss-remote-source" },
        async (args) => {
          if (isCss(args.path)) {
            const response = await downloadResouceWithCache(args.path);
            const source = await response.text();
            const result = await processor.process(source, { from: args.path });

            return {
              loader: "css",
              contents: result.css,
              warnings: result.warnings().map((warn) => ({
                text: warn.text,
                location: { line: warn.line, column: warn.column },
                detail: warn,
              })),
            };
          }

          if (isAssert(args.path)) {
            const response = await downloadResouceWithCache(args.path);
            const arrayBuffer = await response.arrayBuffer();

            return {
              loader: "file",
              contents: new Uint8Array(arrayBuffer),
            };
          }

          return null;
        },
      );

      // load the css file with plugins
      build.onLoad(
        { filter: /.*/, namespace: "file" },
        async (args) => {
          if (isCss(args.path)) {
            const source = await Deno.readTextFile(args.path);
            const result = await processor.process(source, { from: args.path });

            return {
              loader: "css",
              contents: result.css,
              warnings: result.warnings().map((warn) => ({
                text: warn.text,
                location: { line: warn.line, column: warn.column },
                detail: warn,
              })),
            };
          }

          return null;
        },
      );
    },
  };
}
