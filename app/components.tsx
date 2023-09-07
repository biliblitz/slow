import { useManager } from "./manager/index.ts";

export function Scripts() {
  const manager = useManager();

  return (
    <script type="module" src={manager.basePath + manager.entryPath}></script>
  );
}

function ManagerScript() {
  const manager = useManager();

  const loaders = Array.from(manager.loaders);
  const actions = Array.from(manager.actions);
  const basePath = manager.basePath;
  const entryPath = manager.entryPath;
  const imports = Array.from(manager.imports);
  const buildGraph = Array.from(manager.buildGraph);

  return (
    <script
      type="application/json"
      data-slow="manager"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          loaders,
          actions,
          basePath,
          entryPath,
          imports,
          buildGraph,
        }).replaceAll("/", "\\/"),
      }}
    />
  );
}

export function RouterHead() {
  return (
    <>
      <title>233</title>

      <ManagerScript />
    </>
  );
}
