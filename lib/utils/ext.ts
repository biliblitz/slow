import { extname } from "../../server-deps.ts";

const JAVASCRIPT_FILE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".cjs",
  ".cjsx",
  ".mjs",
  ".mjsx",
  ".ts",
  ".tsx",
  ".cts",
  ".ctsx",
  ".mts",
  ".mtsx",
];

const MDX_FILE_EXTENSIONS = [
  ".md",
  ".mdx",
];

const STYLE_FILE_EXTENSIONS = [
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".styl",
  ".stylus",
  ".pcss",
  ".sss",
];

const IMAGE_FILE_EXTENSIONS = [
  ".apng",
  ".png",
  ".jpg",
  ".jpeg",
  ".jfif",
  ".pjpeg",
  ".pjp",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".avif",
];

const MEDIA_FILE_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".opus",
];

const FONT_FILE_EXTENSIONS = [
  ".woff",
  ".woff2",
  ".eot",
  ".ttf",
  ".otf",
];

export function isJs(filename: string) {
  return JAVASCRIPT_FILE_EXTENSIONS.includes(extname(filename));
}

export function isJsOrMdx(filename: string) {
  const ext = extname(filename);
  return JAVASCRIPT_FILE_EXTENSIONS.includes(ext) ||
    MDX_FILE_EXTENSIONS.includes(ext);
}

export function isMdx(filename: string) {
  return MDX_FILE_EXTENSIONS.includes(extname(filename));
}

export function isCss(filename: string) {
  return STYLE_FILE_EXTENSIONS.includes(extname(filename));
}

export function isAssert(filename: string) {
  const ext = extname(filename);
  return IMAGE_FILE_EXTENSIONS.includes(ext) ||
    MEDIA_FILE_EXTENSIONS.includes(ext) ||
    FONT_FILE_EXTENSIONS.includes(ext);
}
