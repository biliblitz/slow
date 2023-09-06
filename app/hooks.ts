import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Project } from "./utils.ts";

export type CityContext = {
  project: Project;
  url: URL;
};

export const SlowCityContext = createContext<CityContext | null>(null);

export function useSlowCity() {
  const context = useContext(SlowCityContext);
  if (!context) {
    throw new Error("invalid call to useSlowCity");
  }
  return context;
}
