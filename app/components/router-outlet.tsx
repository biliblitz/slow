import { createContext, useContext } from "../../deps.ts";
import { serializeManager, useManager } from "../manager/index.ts";
import { ComponentReference } from "../utils.ts";
import { useRouter } from "./router.tsx";

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

const OutletContext = createContext<ComponentReference[]>([]);

export function RouterOutlet() {
  const manager = useManager();
  const router = useRouter();

  return (
    <OutletContext.Provider value={router.outlets.value}>
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
