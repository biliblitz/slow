import { useContext } from "preact/hooks";
import { FunctionComponent, createContext } from "preact";
import {
  ActionReference,
  ComponentReference,
  LoaderReference,
} from "../utils.ts";

export interface Manager {
  getLoaderData(key: LoaderReference): any;
  getActionData(key: ActionReference): any;
  getComponent(key: ComponentReference): FunctionComponent;
}

export const ManagerContext = createContext<Manager | null>(null);

export function useManager() {
  const manager = useContext(ManagerContext);
  if (!manager) {
    throw new Error("Invalid call to useManager()");
  }
  return manager;
}
