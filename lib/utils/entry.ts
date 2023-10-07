import { Entry } from "../scan.ts";

export function matchEntry(entries: Entry[], pathname: string) {
  for (const entry of entries) {
    const exec = entry.regex.exec(pathname);
    if (exec) {
      const params = entry.params
        .map((key, index) => [key, exec[index]] as [string, string]);
      return { params, entry };
    }
  }
  return null;
}
