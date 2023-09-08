import { useManager } from "./manager/index.ts";
import { createContext, JSX as JSXInternal, useContext } from "../deps.ts";
import { ComponentReference, resolveDependencies } from "./utils.ts";

export function SlowCityProvider(
  props: JSXInternal.HTMLAttributes<HTMLHtmlElement>,
) {
  return <html {...props} />;
}

function ManagerStorage() {
  const manager = useManager();

  const loaders = Array.from(manager.loaders);
  const actions = Array.from(manager.actions);
  const basePath = manager.basePath;
  const entryPath = manager.entryPath;
  const imports = Array.from(manager.imports);
  const buildGraph = Array.from(manager.buildGraph);
  const renderTree = manager.renderTree;

  return (
    <script
      type="application/json"
      data-slow="manager"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          loaders,
          actions,
          basePath,
          entryPath,
          imports,
          buildGraph,
          renderTree,
        }).replaceAll("/", "\\/"),
      }}
    />
  );
}

export function RouterHead() {
  const manager = useManager();

  const deps = resolveDependencies(
    manager.buildGraph,
    manager.renderTree
      .map((ref) => manager.imports.get(ref)!)
      .concat(manager.entryPath),
  );

  return (
    <>
      <title>233</title>
      {deps.map((dep) => (
        <link
          rel="modulepreload"
          href={manager.basePath + dep}
          key={dep}
        />
      ))}
    </>
  );
}

const OutletContext = createContext<ComponentReference[]>([]);

export function RouterOutlet() {
  const manager = useManager();

  return (
    <OutletContext.Provider value={manager.renderTree}>
      <Outlet />
      <ManagerStorage />
      <script type="module" src={manager.basePath + manager.entryPath}></script>
    </OutletContext.Provider>
  );
}

// TODO
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
