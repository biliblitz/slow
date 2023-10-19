import { buildBlitzCity, createBlitzCity } from "blitz/server";
import Root from "./root.tsx";

// Note: You'd better use `npm:` prefix for tailwindcss
// Note: esm.sh doesn't work for tailwindcss at all
import tailwindcss from "npm:tailwindcss@3.3.3";
import postcssPresetEnv from "npm:postcss-preset-env@9.1.3";

// postcss plugins & esbuild plugins should put here!
const project = await buildBlitzCity({
  postcssPlugins: [
    // https://github.com/denoland/deno/issues/20854
    tailwindcss(),
    // https://github.com/denoland/deno/issues/19096
    postcssPresetEnv(),
  ],
});

export default createBlitzCity(project, <Root />);
