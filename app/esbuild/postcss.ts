import { esbuild, postcss, toFileUrl } from "../../server-deps.ts";

const CSS_REGEX = /\.css$/;
const ASSETS_REGEX = /\.(?:ttf|otf|eot|woff|woff2|svg|jpe?g|png|gif|webp)$/;

const cache = await caches.open("esbuild-postcss-plugin");

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
  const processor = postcss(options.plugins);

  return {
    name: "postcss",
    setup(build) {
      // local css imports
      build.onResolve(
        { filter: /.*/, namespace: "file" },
        (args) => {
          const url = args.importer
            ? new URL(args.path, toFileUrl(args.importer))
            : toFileUrl(args.path);

          if (CSS_REGEX.test(url.pathname) || ASSETS_REGEX.test(url.pathname)) {
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

          if (CSS_REGEX.test(url.pathname) || ASSETS_REGEX.test(url.pathname)) {
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
        { filter: CSS_REGEX, namespace: "postcss-remote-source" },
        async (args) => {
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
        },
      );

      // download remote assets file
      build.onLoad(
        { filter: ASSETS_REGEX, namespace: "postcss-remote-source" },
        async (args) => {
          const response = await downloadResouceWithCache(args.path);
          const arrayBuffer = await response.arrayBuffer();

          return {
            contents: new Uint8Array(arrayBuffer),
            loader: "file",
          };
        },
      );

      // load the css file with plugins
      build.onLoad(
        { filter: CSS_REGEX, namespace: "file" },
        async (args) => {
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
        },
      );
    },
  };
}
