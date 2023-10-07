import handler from "./app/entry.server.tsx";

// start server in port 8080
await Deno.serve({ handler, port: 8080 }).finished;
