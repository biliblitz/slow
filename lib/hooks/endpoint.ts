import { RequestEvent } from "./mod.ts";

export type Endpoint = (event: RequestEvent) => Response | Promise<Response>;

export function endpoint$(endpoint: Endpoint) {
  return endpoint;
}
