import { mkdir, readFile, writeFile } from "node:fs/promises";

const textFileNames = [
  "index.html",
  "styles.css",
  "game.js"
];

const textFiles = Object.fromEntries(await Promise.all(
  textFileNames.map(async (name) => [name, await readFile(name, "utf8")])
));

const worker = `const textFiles = ${JSON.stringify(textFiles)};

const contentTypes = {
  "index.html": "text/html; charset=utf-8",
  "styles.css": "text/css; charset=utf-8",
  "game.js": "text/javascript; charset=utf-8"
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
