import { VNode } from "../deps.ts";
import { extname, renderToString, typeByExtension } from "../server-deps.ts";
import { BlitzCity } from "./build-common.ts";
import { RequestEvent } from "./hooks/mod.ts";
import { ManifestProvider } from "./manifest/context.tsx";
import { createServerManifest } from "./manifest/server.ts";
import { LoaderStore, ServerResponse } from "./utils/api.ts";
import { Match, matchEntries } from "./utils/entry.ts";

const LOGO = `
 ____  _                ____ _ _         
/ ___|| | _____      __/ ___(_) |_ _   _ 
\\___ \\| |/ _ \\ \\ /\\ / / |   | | __| | | |
 ___) | | (_) \\ V  V /| |___| | |_| |_| |
|____/|_|\\___/ \\_/\\_/  \\____|_|\\__|\\__, |
                                   |___/ 
`;

export function createBlitzCity(city: BlitzCity, vnode: VNode) {
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
        store.push([loader.ref, result]);
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

  async function handleEndpointRequest(req: Request, match: Match) {
    const headers = new Headers();
    const entry = city.project.endpoints[match.index];
    const event = createRequestEvent(req, match.params, headers);
    await runMiddleware(event, entry.middlewares);
    const endpoint = city.middlewares[entry.endpoint];
    return await endpoint(event);
  }

  return async (req: Request) => {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname.startsWith("/build/")) {
      const assetName = pathname.slice(1);
      const index = city.assets.assetNames.indexOf(assetName);
      console.log(assetName, index);
      if (index > -1) {
        const assetBuffer = city.assets.assetBuffers[index];
        const mimeType = typeByExtension(extname(assetName)) ||
          "application/octet-stream";
        const headers = new Headers();
        headers.set("content-type", mimeType);
        headers.set("cache-control", "max-age=31536000");
        return new Response(assetBuffer, { headers });
      }
    }

    let isDataRequest = false;

    // remove tailing s-data.json if exist
    if (pathname.endsWith("/s-data.json")) {
      isDataRequest = true;
      pathname = pathname.slice(0, -11);
    }

    const match = matchEntries(city.project.entires, pathname);
    if (match) {
      const actionRef = url.searchParams.get("saction");

      const headers = new Headers();
      const entry = city.project.entires[match.index];
      const event = createRequestEvent(req, entry.params, headers);
      await runMiddleware(event, entry.middlewares);
      const store = await runLoaders(event, entry.loaders);

      if (isDataRequest) {
        return Response.json(
          { ok: "data", store } satisfies ServerResponse,
          { headers },
        );
      }

      const manifest = createServerManifest(city, match, store);

      const html = renderToString(
        <ManifestProvider manifest={manifest}>
          {vnode}
        </ManifestProvider>,
      );
      headers.set("content-type", "text/html");
      return new Response("<!DOCTYPE html>" + html, { headers });
    }

    if (!url.pathname.endsWith("/")) {
      url.pathname = url.pathname + "/";
      return Response.redirect(url, 301);
    }

    const actionRef = url.searchParams.get("saction");
  };
}
