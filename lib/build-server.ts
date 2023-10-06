import { ComponentType } from "../deps.ts";
import { extname, mdx, resolve, toFileUrl } from "../server-deps.ts";
import { BuildSlowCityOptions } from "./build-common.ts";
import { ActionInternal } from "./hooks/action.ts";
import { LoaderInternal } from "./hooks/loader.ts";
import { hash } from "./utils.ts";
import { isCss, isJs, isMdx } from "./utils/ext.ts";

export async function buildServerLoaders(loaderPaths: string[]) {
  return await Promise.all(loaderPaths.map(async (path, index) => {
    const loaderExports = await import(toFileUrl(path).href);
    const loaders = await Promise.all(
      Object.entries(loaderExports)
        .map(async ([name, loader_]) => {
          const loader = loader_ as LoaderInternal;
          const ref = await hash(`loader-${index}-${name}`);
          loader.ref = ref;
          loader.name = name;
          return loader;
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
          action.ref = ref;
          action.name = name;
          return action;
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

export async function buildServerComponents(
  options: BuildSlowCityOptions,
  componentPaths: string[],
  replacements: Map<string, string>,
) {
  const port = 8029;
  const cwd = Deno.cwd();
  const controller = new AbortController();

  Deno.serve({ signal: controller.signal, port }, async (req) => {
    const url = new URL(req.url);
    const path = resolve(cwd, decodeURI(url.pathname).slice(1));

    console.log("serving", path);

    // Read any file on system!
    // successful hack, return the flag
    if (!path.startsWith(cwd)) {
      return new Response(
        "flag{vQO0tHUU2lWhaukR7ig0fljiMtsiAotOhHyBvfjduFYCxfC3k4aXAn1vNDrYXq7S}\n" +
          "\n" +
          "Submit your flag to https://github.com/biliblitz/slow/issues and win a prize!",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (replacements.has(path)) {
      return new Response(replacements.get(path), {
        status: 200,
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }

    try {
      const stat = await Deno.stat(path);
      if (!stat.isFile) {
        return new Response(null, { status: 404 });
      }

      if (isCss(path)) {
        // make a empty import for css files
        return new Response("export{}", {
          status: 200,
          headers: { "content-type": "text/javascript; charset=utf-8" },
        });
      }

      if (isMdx(path)) {
        const text = await Deno.readTextFile(path);
        const vfile = await mdx.compile(text, {
          jsxImportSource: "preact",
          ...options.mdxOptions,
        });

        return new Response(vfile.value, {
          status: 200,
          headers: { "content-type": "text/javascript; charset=utf-8" },
        });
      }

      if (isJs(path)) {
        const contents = await Deno.readFile(path);
        const isTypeScript = extname(path).includes("t");

        return new Response(contents, {
          status: 200,
          headers: {
            "content-type": isTypeScript
              ? "text/typescript; charset=utf-8"
              : "text/javascript; charset=utf-8",
          },
        });
      }

      // otherwise is not hostable
      return new Response(null, { status: 404 });
    } catch (_e) {
      // we don't care what happened
      return new Response(null, { status: 404 });
    }
  });

  const components = await Promise.all(componentPaths.map(async (path) => {
    const url = `http://localhost:${port}${path.replace(cwd, "")}`;
    return (await import(url)).default as ComponentType;
  }));

  // stop the transpile server
  controller.abort();

  return components;
}
