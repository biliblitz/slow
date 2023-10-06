function extname(filename: string) {
  const index = filename.lastIndexOf(".");
  return index > -1 ? filename.slice(index) : filename;
}

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

const VIDEO_FILE_EXTENSIONS = [
  ".ogg",
  ".mp4",
  ".webm",
];

const AUDIO_FILE_EXTENSIONS = [
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

export function isImage(filename: string) {
  return IMAGE_FILE_EXTENSIONS.includes(extname(filename));
}

export function isFont(filename: string) {
  return FONT_FILE_EXTENSIONS.includes(extname(filename));
}

export function isAudio(filename: string) {
  return AUDIO_FILE_EXTENSIONS.includes(extname(filename));
}

export function isVideo(filename: string) {
  return VIDEO_FILE_EXTENSIONS.includes(extname(filename));
}

export function isAssert(filename: string) {
  const ext = extname(filename);
  return IMAGE_FILE_EXTENSIONS.includes(ext) ||
    AUDIO_FILE_EXTENSIONS.includes(ext) ||
    VIDEO_FILE_EXTENSIONS.includes(ext) ||
    FONT_FILE_EXTENSIONS.includes(ext);
}

export function getLinkPreloadAs(filename: string) {
  if (isJs(filename)) return "script";
  if (isCss(filename)) return "style";
  if (isFont(filename)) return "font";
  if (isImage(filename)) return "image";
  if (isAudio(filename)) return "audio";
  if (isVideo(filename)) return "video";
  console.error("Unknown preload file type: ", filename);
}
