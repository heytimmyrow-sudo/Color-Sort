import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const textFileNames = [
  "index.html",
  "styles.css",
  "game.js",
  "app-icon.svg",
  "qr-code.svg",
  "manifest.webmanifest"
];
const binaryFileNames = [
  "app-icon-180.png"
];

const textFiles = Object.fromEntries(await Promise.all(
  textFileNames.map(async (name) => [name, await readFile(name, "utf8")])
));
const binaryFiles = Object.fromEntries(await Promise.all(
  binaryFileNames.map(async (name) => [name, (await readFile(name)).toString("base64")])
));

const worker = `const textFiles = ${JSON.stringify(textFiles)};
const binaryFiles = ${JSON.stringify(binaryFiles)};

const contentTypes = {
  "index.html": "text/html; charset=utf-8",
  "styles.css": "text/css; charset=utf-8",
  "game.js": "text/javascript; charset=utf-8",
  "app-icon.svg": "image/svg+xml; charset=utf-8",
  "qr-code.svg": "image/svg+xml; charset=utf-8",
  "app-icon-180.png": "image/png",
  "manifest.webmanifest": "application/manifest+json; charset=utf-8"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname);

    if (path === "/" || path === "") {
      path = "/index.html";
    }

    const key = path.replace(/^\\//, "");
    const textBody = textFiles[key];

    if (textBody !== undefined) {
      return new Response(textBody, {
        headers: {
          "content-type": contentTypes[key] || "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    const binaryBody = binaryFiles[key];
    if (binaryBody !== undefined) {
      const bytes = Uint8Array.from(atob(binaryBody), (char) => char.charCodeAt(0));
      return new Response(bytes, {
        headers: {
          "content-type": contentTypes[key] || "application/octet-stream",
          "cache-control": "no-store"
        }
      });
    }

    return new Response(textFiles["index.html"], {
      headers: {
        "content-type": contentTypes["index.html"],
        "cache-control": "no-store"
      }
    });
  }
};
`;

await mkdir("dist/server", { recursive: true });
await writeFile("dist/server/index.js", worker);
await Promise.all([...textFileNames, ...binaryFileNames].map((name) => copyFile(name, `dist/${name}`)));
