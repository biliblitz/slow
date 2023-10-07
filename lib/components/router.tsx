// deno-lint-ignore-file no-explicit-any
import {
  batch,
  ComponentChildren,
  ComponentType,
  createContext,
  ReadonlySignal,
  useComputed,
  useEffect,
  useRef,
  useSignal,
} from "../../deps.ts";
import { useManifest } from "../manifest/context.tsx";
import { Manifest } from "../manifest/mod.ts";
import { LoaderStore, ServerResponse } from "../utils/api.ts";
import { useContextOrThrows } from "../utils/hooks.ts";
import { matchEntry } from "../utils/entry.ts";

type Navigate = (href: string) => Promise<void>;
type Render = (pathname: string, loaders: LoaderStore) => Promise<void>;

type Router = {
  preloads: ReadonlySignal<number[]>;
  outlets: ReadonlySignal<number[]>;
  stores: ReadonlySignal<ReadonlyMap<string, any>>;
  params: ReadonlySignal<ReadonlyMap<string, string>>;
  navigate: Navigate;
  render: Render;
};

type HistoryState = {
  stores: LoaderStore;
  scroll: [number, number];
};

const RouterContext = createContext<Router | null>(null);

function replaceState(state: Partial<HistoryState>) {
  history.replaceState({ ...history.state, ...state }, "");
}

function pushState(state: HistoryState, url: string | URL) {
  history.pushState(state, "", url);
}

async function importComponent(
  manifest: Manifest,
  components: ComponentType[],
  index: number,
) {
  if (index in components) {
    return components[index];
  }
  const path = manifest.basePath +
    manifest.assetNames[manifest.componentIndexes[index]];
  const { default: component } = await import(path);
  components[index] = component as ComponentType;
}

async function importComponents(
  manifest: Manifest,
  components: ComponentType[],
  indexes: number[],
) {
  await Promise.all(
    indexes.map((index) => {
      return importComponent(manifest, components, index);
    }),
  );
}

type RouterProviderProps = {
  children?: ComponentChildren;
};

export function RouterProvider(props: RouterProviderProps) {
  const manifest = useManifest();

  const stores = useSignal(manifest.store);
  const components = useRef(manifest.components);

  const params = useSignal<[string, string][]>([]);
  const outlets = useSignal<number[]>([]);
  const preloads = useSignal<number[]>([]);

  const render = async (pathname: string, store: LoaderStore) => {
    const entry = matchEntry(manifest.entries, pathname);
    if (!entry) {
      console.error("Navigation 404!!");
      return;
    }

    // Start preload modules
    preloads.value = entry.components;

    // Import every components
    await importComponents(manifest, components.current, entry.components);

    // Trigger render
    batch(() => {
      stores.value = store;
      params.value = entry.regex.exec(pathname)!.slice(1)
        .map((value, index) => [entry.params[index], value]);
      outlets.value = entry.components;
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
        document.getElementById(targetAnchor.slice(1))
          ?.scrollIntoView({ behavior: "smooth" });
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
    const data = await response.json() as ServerResponse;

    if (data.ok === "data") {
      // save current scroll before leave
      replaceState({ scroll: [scrollX, scrollY] });
      pushState({ stores: data.store, scroll: [0, 0] }, targetUrl);
      // update DOM due to data
      await render(targetUrl.pathname, data.store);
    } else if (data.ok === "redirect") {
      await navigate(data.redirect);
    }
  };

  useEffect(() => {
    // TODO
    replaceState({ stores: manifest.store });

    addEventListener("popstate", async (e) => {
      const state = e.state as HistoryState;
      await render(location.pathname, state.stores);
      scrollTo(state.scroll[0], state.scroll[1]);
    });
  }, []);

  const storesMap = useComputed(() => new Map(stores.value));
  const paramsMap = useComputed(() => new Map(params.value));

  return (
    <RouterContext.Provider
      value={{
        stores: storesMap,
        params: paramsMap,
        render,
        outlets,
        navigate,
        preloads,
      }}
    >
      {props.children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContextOrThrows(
    RouterContext,
    "Please nest your project inside <SlowCityProvider />",
  );
}

export function useNavigate() {
  return useRouter().navigate;
}
