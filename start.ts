// import handler from "./app/entry.server.tsx";

import { buildSlowCity } from "./lib/build-common.ts";

// // start server in port 8080
// await Deno.serve({ handler, port: 8080 }).finished;

const built = await buildSlowCity();

console.log(built);

Deno.exit(0);
