export async function sha256(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

export async function hashRef(message: string) {
  const array = Array.from(await sha256(message));
  const string = String.fromCharCode.apply(null, array);
  return btoa(string).slice(0, 12);
}
