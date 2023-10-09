export function longestCommonPrefix<T>(a: T[], b: T[]): T[] {
  const length = Math.min(a.length, b.length);
  const result = [];

  for (let i = 0; i < length; i++) {
    if (a[i] === b[i]) result.push(a[i]);
    else break;
  }

  return result;
}
