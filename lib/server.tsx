import { VNode } from "../deps.ts";
import { SlowCity } from "./build-common.ts";

const LOGO = `
 ____  _                ____ _ _         
/ ___|| | _____      __/ ___(_) |_ _   _ 
\\___ \\| |/ _ \\ \\ /\\ / / |   | | __| | | |
 ___) | | (_) \\ V  V /| |___| | |_| |_| |
|____/|_|\\___/ \\_/\\_/  \\____|_|\\__|\\__, |
                                   |___/ 
`;

export function createSlowCity(city: SlowCity, vnode: VNode) {
  console.log(LOGO);

  return async (req: Request) => {
    return new Response(null, { status: 501 });
  };
}
