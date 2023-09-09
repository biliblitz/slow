import { createContext, useContext } from "../../deps.ts";
import { serializeManifest, useManifest } from "../manifest/index.ts";
import { ComponentReference } from "../utils.ts";
import { useRouter } from "./router.tsx";

function ManifestSerializer() {
  const manifest = useManifest();

  return (
    <script
      type="application/json"
      data-slow
      dangerouslySetInnerHTML={{ __html: serializeManifest(manifest) }}
    />
  );
}

const OutletContext = createContext<ComponentReference[]>([]);

export function RouterOutlet() {
  const manifest = useManifest();
  const router = useRouter();

  const entryUrl = manifest.basePath + manifest.entryPath;

  return (
    <OutletContext.Provider value={router.outlets.value}>
      <Outlet />
      <ManifestSerializer />
      <script type="module" src={entryUrl}></script>
    </OutletContext.Provider>
  );
}

export function Outlet() {
  const manifest = useManifest();
  const outlets = useContext(OutletContext);

  if (outlets.length > 0) {
    const [current, ...remains] = outlets;
    const Component = manifest.components.get(current)!;
    return (
      <OutletContext.Provider value={remains}>
        <Component />
      </OutletContext.Provider>
    );
  }

  return null;
}
