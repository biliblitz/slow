// deno-lint-ignore-file no-explicit-any
import {
  batch,
  ComponentChildren,
  createContext,
  ReadonlySignal,
  useComputed,
  useContext,
  useEffect,
  useSignal,
} from "../../deps.ts";
import { importComponents } from "../manifest/client.ts";
import { PageData, useManifest } from "../manifest/index.ts";
import { ComponentReference, ServerDataResponse } from "../utils.ts";

type Navigate = (href: string) => Promise<void>;
type Router = {
  params: ReadonlySignal<ReadonlyMap<string, string>>;
  loaders: ReadonlySignal<ReadonlyMap<string, any>>;
  outlets: ReadonlySignal<ComponentReference[]>;
  preloads: ReadonlySignal<ComponentReference[]>;
  navigate: Navigate;
  render(data: PageData): Promise<void>;
};
type HistoryState = {
  data: PageData;
  scroll: [number, number];
};

const RouterContext = createContext<Router | null>(null);

function compareStringArray(a: string[], b: string[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function RouterProvider(props: { children?: ComponentChildren }) {
  const manifest = useManifest();

  const outlets = useSignal(manifest.outlets);
  const preloads = useSignal(manifest.outlets);
  const params = useSignal(manifest.params);
  const loaders = useSignal(manifest.loaders);

  /** Update current page or  */
  const render = async (data: PageData) => {
    // start preload modules
    preloads.value = data.outlets;
    // import components
    await importComponents(manifest, data.outlets);
    // push history
    // start render whole page
    batch(() => {
      // update actions & loaders & params
      params.value = Array.from(new Map(params.value.concat(data.params)));
      loaders.value = Array.from(new Map(loaders.value.concat(data.loaders)));
      // update outlets
      if (!compareStringArray(outlets.value, data.outlets)) {
        outlets.value = data.outlets;
      }
    });
  };

  const navigate = async (href: string) => {
    // calculate target url
    const targetUrl = new URL(href, location.href);

    // if is the same page, then we don't need fetch any data
    if (targetUrl.pathname === location.pathname) {
      const targetAnchor = targetUrl.hash;
      const originAnchor = location.hash;

      // check if is hash update
      if (targetAnchor !== originAnchor && targetAnchor) {
        const targetElem = document.getElementById(targetAnchor.slice(1));
        targetElem?.scrollIntoView({ behavior: "smooth" });
        // history.pushState({ url: location.href }, "", targetUrl);
        return;
      }

      // then there is nothing to do
      return;
    }

    // fix pathname for new target
    if (!targetUrl.pathname.endsWith("/")) {
      targetUrl.pathname += "/";
    }

    // fetch data
    const dataUrl = new URL(targetUrl);
    dataUrl.pathname += "s-data.json";
    // now sending request to dataUrl
    const response = await fetch(dataUrl);
    const data = await response.json() as ServerDataResponse;

    if (data.ok === "data") {
      // save current scroll before leave
      history.replaceState(
        { ...history.state, scroll: [scrollX, scrollY] },
        "",
      );
      history.pushState({ data: data.data, scroll: [0, 0] }, "", targetUrl);
      // update DOM due to data
      await render(data.data);
    } else if (data.ok === "redirect") {
      await navigate(data.redirect);
    }
  };

  const router = {
    params: useComputed(() => new Map(params.value)),
    loaders: useComputed(() => new Map(loaders.value)),
    outlets,
    preloads,
    navigate,
    render,
  } satisfies Router;

  useEffect(() => {
    const initialData: PageData = {
      loaders: manifest.loaders,
      params: manifest.params,
      outlets: manifest.outlets,
    };
    history.replaceState({ data: initialData, scroll: [0, 0] }, "");

    addEventListener("popstate", async (e) => {
      const state = e.state as HistoryState;
      await render(state.data);
      scrollTo(state.scroll[0], state.scroll[1]);
    });
  }, []);

  return (
    <RouterContext.Provider value={router}>
      {props.children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error("Please nest your project inside <SlowCityProvider />");
  }
  return router;
}

export function useNavigate() {
  return useRouter().navigate;
}
