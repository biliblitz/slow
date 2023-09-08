import { serializeManager, useManager } from "./manager/index.ts";
import {
  createContext,
  JSX as JSXInternal,
  useContext,
  useEffect,
} from "../deps.ts";
import {
  ComponentReference,
  resolveDependencies,
  ServerDataResponse,
} from "./utils.ts";
import { loadComponents } from "./manager/client.ts";

export function SlowCityProvider(
  props: JSXInternal.HTMLAttributes<HTMLHtmlElement>,
) {
  // register history.popState
  useEffect(() => {
    addEventListener("popstate", (e) => {
      // TODO: restore session here
      console.log(e);
    });
  }, []);

  return <html {...props} />;
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

interface LinkProps extends JSXInternal.HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const manager = useManager();

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
        history.pushState({ url: location.href }, "", targetUrl);
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
    console.log("now sending request to " + dataUrl.href);
    const response = await fetch(dataUrl);
    const data = await response.json() as ServerDataResponse;

    if (data.ok === "data") {
      await loadComponents(manager, data.renderTree);
      manager.renderTree = data.renderTree;
      for (const [ref, value] of data.loaders) {
        manager.loaders.set(ref, value);
      }
      for (const [ref, value] of data.actions) {
        manager.actions.set(ref, value);
      }
      console.log("updated");
    }
  };

  return (
    <a
      onClick={(e) => {
        e.preventDefault();
        navigate(e.currentTarget.href);
      }}
      {...props}
    />
  );
}
