import {
  createContext,
  ReadonlySignal,
  signal,
  useComputed,
  useContext,
} from "../../deps.ts";
import { useManifest } from "../manifest/context.tsx";
import { ManifestInjector } from "../manifest/injector.tsx";
import { useRouter } from "./router.tsx";

const OutletContext = createContext<ReadonlySignal<number[]>>(signal([]));

export function RouterOutlet() {
  const manifest = useManifest();
  const router = useRouter();

  const entryPath = manifest.basePath +
    manifest.assetNames[manifest.entryIndex];

  return (
    <OutletContext.Provider value={router.outlets}>
      <Outlet />
      <ManifestInjector />
      <script type="module" src={entryPath}></script>
    </OutletContext.Provider>
  );
}

export function Outlet() {
  const manifest = useManifest();
  const outlets = useContext(OutletContext);
  const children = useComputed(() => outlets.value.slice(1));

  if (outlets.value.length > 0) {
    const Component = manifest.components[outlets.value[0]];
    console.log("outlet", Component);
    return (
      <OutletContext.Provider value={children}>
        <Component />
      </OutletContext.Provider>
    );
  }

  return null;
}
