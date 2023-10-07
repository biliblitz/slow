import { VNode } from "../deps.ts";
import { extname, renderToString, typeByExtension } from "../server-deps.ts";
import { SlowCity } from "./build-common.ts";
import { RequestEvent } from "./hooks/mod.ts";
import { ManifestProvider } from "./manifest/context.tsx";
import { createServerManifest } from "./manifest/server.ts";
import { LoaderStore } from "./utils/api.ts";
import { Match, matchPathname } from "./utils/entry.ts";

const LOGO = `
 ____  _                ____ _ _         
/ ___|| | _____      __/ ___(_) |_ _   _ 
\\___ \\| |/ _ \\ \\ /\\ / / |   | | __| | | |
 ___) | | (_) \\ V  V /| |___| | |_| |_| |
|____/|_|\\___/ \\_/\\_/  \\____|_|\\__|\\__, |
                                   |___/ 
`;

export function createSlowCity(city: SlowCity, vnode: VNode) {
  console.log(LOGO);

  async function runMiddleware(event: RequestEvent, middlewares: number[]) {
    for (const index of middlewares) {
      const middleware = city.middlewares[index];
      await middleware(event);
    }
  }

  async function runLoaders(event: RequestEvent, loaders: number[]) {
    const store = [] as LoaderStore;
    for (const index of loaders) {
      for (const loader of city.loaders[index]) {
        const result = await loader.func(event);
        store.push([loader.name, result]);
      }
    }
    return store;
  }

  function createRequestEvent(
    req: Request,
    params: string[],
    headers: Headers,
  ) {
    return { req, params, headers };
  }

  return async (req: Request) => {
    const url = new URL(req.url);
    const headers = new Headers();

    if (url.pathname.startsWith("/build/")) {
      const assetName = url.pathname.slice(1);
      const index = city.assets.assetNames.indexOf(assetName);
      console.log(assetName, index);
      if (index > -1) {
        const assetBuffer = city.assets.assetBuffers[index];
        const mimeType = typeByExtension(extname(assetName)) ||
          "application/octet-stream";
        headers.set("content-type", mimeType);
        headers.set("cache-control", "max-age=31536000");
        return new Response(assetBuffer, { headers });
      }
    }

    const pathname = url.pathname;

    const match = matchPathname(city.project.entires, pathname);
    if (!match) return new Response(null, { status: 404 });
    const entry = city.project.entires[match.index];
    const event = createRequestEvent(req, match.params, headers);
    await runMiddleware(event, entry.middlewares);
    const store = await runLoaders(event, entry.loaders);
    const manifest = createServerManifest(city, match, store);

    const html = renderToString(
      <ManifestProvider manifest={manifest}>
        {vnode}
      </ManifestProvider>,
    );
    headers.set("content-type", "text/html");
    return new Response("<!DOCTYPE html>" + html, { headers });
  };
}
