import { endpoint$ } from "blitz";

export default endpoint$(({ headers, params }) => {
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(params), { headers });
});
