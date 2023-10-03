// import handler from "./app/entry.server.tsx";

import { buildSlowCity } from "./lib/build-common.ts";

// // start server in port 8080
// await Deno.serve({ handler, port: 8080 }).finished;

await buildSlowCity();

Deno.exit(0);
