import { useComputed } from "../../deps.ts";
import { useManifest } from "../manifest/index.ts";
import { resolveDependencies } from "../utils.ts";
import { useRouter } from "./router.tsx";

function Preloads() {
  const manifest = useManifest();
  const router = useRouter();

  const deps = useComputed(() => {
    return resolveDependencies(
      manifest.graph,
      router.preloads.value
        .map((ref) => manifest.imports.get(ref)!)
        .concat(
          manifest.stylePath
            ? [manifest.stylePath, manifest.entryPath]
            : [manifest.entryPath],
        ),
    );
  });

  return (
    <>
      {deps.value.map((dep) => {
        if (dep.endsWith(".js")) {
          return (
            <link
              key={dep}
              rel="modulepreload"
              href={manifest.basePath + dep}
            />
          );
        } else {
          const usage = dep.endsWith(".css")
            ? "style"
            : dep.endsWith(".jpg") || dep.endsWith(".jpeg") ||
                dep.endsWith(".png") || dep.endsWith(".svg") ||
                dep.endsWith(".webp") || dep.endsWith(".gif")
            ? "image"
            : dep.endsWith(".ttf") || dep.endsWith(".otf") ||
                dep.endsWith(".woff") || dep.endsWith(".woff2") ||
                dep.endsWith(".eot")
            ? "font"
            : undefined;

          return (
            <link
              key={dep}
              rel="preload"
              href={manifest.basePath + dep}
              as={usage}
            />
          );
        }
      })}

      {/* load global.css */}
      {manifest.stylePath &&
        <link rel="stylesheet" href={manifest.basePath + manifest.stylePath} />}
    </>
  );
}

export function RouterHead() {
  return (
    <>
      <title>233</title>

      <Preloads />
    </>
  );
}
