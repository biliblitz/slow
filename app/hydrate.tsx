import { render, VNode } from "../deps.ts";
import { createClientManager, loadComponents } from "./manager/client.ts";
import { ManagerContext } from "./manager/index.ts";

export async function hydrate(root: VNode) {
  const manager = createClientManager();
  await loadComponents(manager, manager.renderTree);
  console.log(manager);

  render(
    <ManagerContext.Provider value={manager}>
      {root}
    </ManagerContext.Provider>,
    document,
    document.documentElement,
  );
}
