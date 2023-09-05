import { useContext } from "preact/hooks";
import { createContext } from "preact";
import { Manager } from "./manager.ts";
import { ClientManager } from "./client.ts";
import { ServerManager } from "./server.ts";

export const ManagerContext = createContext<Manager | null>(null);

export function useManager() {
  const manager = useContext(ManagerContext);
  if (!manager) {
    throw new Error("Invalid call to useManager()");
  }
  return manager;
}

export function useClientManager() {
  const manager = useManager();
  if (!(manager instanceof ClientManager)) {
    throw new Error("Invalid call to useClientManager()");
  }
  return manager;
}

export function useServerManager() {
  const manager = useManager();
  if (!(manager instanceof ServerManager)) {
    throw new Error("Invalid call to useServerManager()");
  }
  return manager;
}
