export type LoaderKey = `${string}\0${string}\0${string}`;

/** join path, nick and name with '#'
 *
 * @example '/about\0user\0username'
 * @example '/\0\0username'
 */
export function convertLoaderKey(
  path: string,
  nick: string,
  name: string
): LoaderKey {
  return [path, nick, name].join("\0") as LoaderKey;
}
