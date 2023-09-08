import { serializeManager, useManager } from "./manager/index.ts";
import { createContext, JSX, useContext, useEffect, useMemo } from "../deps.ts";
import { ComponentReference, resolveDependencies } from "./utils.ts";
import { RouterProvider, useRouter } from "./components/router.tsx";

export function SlowCityProvider(
  props: JSX.HTMLAttributes<HTMLHtmlElement>,
) {
  // register history.popState
  useEffect(() => {
    addEventListener("popstate", (e) => {
      // TODO: restore session here
      console.log(e);
    });
  }, []);

  return (
    <RouterProvider>
      <html {...props} />
    </RouterProvider>
  );
}

function ManagerSerializer() {
  const manager = useManager();

  return (
    <script
      type="application/json"
      data-slow="manager"
      dangerouslySetInnerHTML={{ __html: serializeManager(manager) }}
    />
  );
}

export function RouterHead() {
  const manager = useManager();
  const router = useRouter();

  const deps = useMemo(() => {
    return resolveDependencies(
      manager.buildGraph,
      router.preloads
        .map((ref) => manager.imports.get(ref)!)
        .concat(manager.entryPath),
    );
  }, [manager, router.preloads]);

  return (
    <>
      <title>233</title>
      {deps.map((dep) => (
        <link key={dep} rel="modulepreload" href={manager.basePath + dep} />
      ))}
    </>
  );
}

const OutletContext = createContext<ComponentReference[]>([]);

export function RouterOutlet() {
  const manager = useManager();
  const router = useRouter();

  return (
    <OutletContext.Provider value={router.outlets}>
      <Outlet />
      <ManagerSerializer />
      <script type="module" src={manager.basePath + manager.entryPath}></script>
    </OutletContext.Provider>
  );
}

export function Outlet() {
  const manager = useManager();
  const outlets = useContext(OutletContext);

  if (outlets.length > 0) {
    const [current, ...remains] = outlets;
    const Component = manager.components.get(current)!;
    return (
      <OutletContext.Provider value={remains}>
        <Component />
      </OutletContext.Provider>
    );
  }

  return null;
}

export { Link } from "./components/link.tsx";
