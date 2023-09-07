import { createContext, useContext } from "../deps.ts";
import { ComponentReference } from "./utils.ts";
import { useManager } from "./manager/index.ts";

export const OutletContext = createContext<ComponentReference[]>([]);

export function Outlet() {
  const context = useContext(OutletContext);

  // if (context.length > 0) {
  //   const [value, ...remain] = context;
  //   const manager = useManager();
  //   const Component = manager.imports.get(value);

  //   return (
  //     <OutletContext.Provider value={remain}>
  //       <Component />
  //     </OutletContext.Provider>
  //   );
  // }

  return null;
}
