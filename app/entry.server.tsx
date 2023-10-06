import { buildSlowCity, createSlowCity } from "slow/server";
import Root from "./root.tsx";

// Note: You'd better use `npm:` prefix for tailwindcss
// Note: esm.sh doesn't work for tailwindcss at all
import tailwindcss from "npm:tailwindcss@3.3.3";
import postcssPresetEnv from "npm:postcss-preset-env@9.1.3";

// postcss plugins & esbuild plugins should put here!
const project = await buildSlowCity({
  postcssPlugins: [
    tailwindcss(),
    postcssPresetEnv(),
  ],
  esbuildPlugins: [],
});

export default createSlowCity(project, <Root />);
