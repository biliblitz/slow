import { Entry } from "../scan.ts";

export function matchEntry(entries: Entry[], pathname: string) {
  return entries.find(({ regex }) => regex.test(pathname));
}
