import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";

export const OutletContext = createContext<ComponentChildren[]>([]);

export function Outlet() {
  const context = useContext(OutletContext);

  if (context.length > 0) {
    const [value, ...remain] = context;

    return (
      <OutletContext.Provider value={remain}>{value}</OutletContext.Provider>
    );
  }

  return null;
}
