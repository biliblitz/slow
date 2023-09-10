import { esbuild } from "../../server-deps.ts";

export function replacePlugin(
  mapping: Map<string, string | Uint8Array>,
): esbuild.Plugin {
  return {
    name: "replace",
    setup(build) {
      build.onLoad({ filter: /.*/, namespace: "file" }, (args) => {
        if (mapping.has(args.path)) {
          return { contents: mapping.get(args.path), loader: "js" };
        }
        return null;
      });
    },
  };
}
