import { Entry } from "../scan.ts";

export type Match = {
  index: number;
  params: string[];
};

export function matchEntries(
  entries: Entry[],
  pathname: string,
) {
  for (const [index, entry] of entries.entries()) {
    const exec = entry.regex.exec(pathname);
    if (exec) {
      const params = exec.slice(1);
      return { index, params } as Match;
    }
  }
  return null;
}

export function zip<T, R>(ts: T[], rs: R[]) {
  return ts.map((t, i) => [t, rs[i]] as [T, R]);
}
