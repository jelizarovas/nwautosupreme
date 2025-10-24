import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { WebSocketServer } from "ws";

const ROOT = path.resolve("src");
const OUT = "dist/index.html";

async function bundle(dev = false) {
  await fs.rm("dist", { recursive: true, force: true });
  await fs.mkdir("dist", { recursive: true });

  // Build JS to dist/app.js
  const jsOut = "dist/app.js";
  await build({
    entryPoints: [path.join(ROOT, "app.js")],
    bundle: true,
    minify: false,
    sourcemap: true,
    format: "iife",
    outfile: jsOut,
  });

  // Combine CSS and write single styles.css into dist
  const cssFiles = ["base.css", "layout.css", "components.css"].map((f) =>
    path.join(ROOT, "styles", f)
  );
  const css = (
    await Promise.all(cssFiles.map((f) => fs.readFile(f, "utf8")))
  ).join("\n");
  await fs.writeFile(path.join("dist", "styles.css"), css, "utf8");

  // Read source HTML and rewrite asset links to point to dist files
  let html = await fs.readFile(path.join(ROOT, "index.html"), "utf8");

  // Remove any stylesheet links that point to ./src/styles/*
  html = html.replace(
    /<link[^>]+href=(["'])\.\/src\/styles\/[^"']+\1[^>]*>\s*/g,
    ""
  );

  // Inject single stylesheet link into head (before closing </head>)
  html = html.replace(
    "</head>",
    `  <link rel="stylesheet" href="./styles.css" />\n</head>`
  );

  // Replace module script that pointed to src with the bundled app.js
  html = html.replace(
    /<script[^>]+src=(["'])\.\/src\/app\.js\1[^>]*><\/script>/,
    `<script src="./app.js"></script>`
  );

  // For dev mode, append a small live-reload client before </body>
  if (dev) {
    const reloadClient = `<script>
      (() => { const s = new WebSocket('ws://localhost:35729'); s.onmessage = () => location.reload(); })();
    </script>\n`;
    html = html.replace("</body>", `${reloadClient}</body>`);
  }

  await fs.writeFile(OUT, html, "utf8");
}

async function serve() {
  await bundle(true);

  // Simple static server
  const server = http
    .createServer(async (req, res) => {
      let file = OUT; // single-file site
      const data = await fs.readFile(file);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(data);
    })
    .listen(5173, () => console.log("Dev server http://localhost:5173"));

  // WebSocket for reload
  const wss = new WebSocketServer({ port: 35729 });
  function broadcast() {
    wss.clients.forEach((c) => c.readyState === 1 && c.send("reload"));
  }

  // Watch src
  // esbuild watcher: use build() with watch.onRebuild to trigger bundle + broadcast
  // Do not use esbuild's "watch" option (unsupported in this esbuild version).
  // The chokidar watcher below handles watching and will call bundle() + broadcast().

  // Also watch HTML/CSS
  const chokidar = (await import("chokidar")).default;
  chokidar
    .watch([path.join(ROOT, "**/*.{html,css,js}")], { ignoreInitial: true })
    .on("all", async () => {
      await bundle(true);
      broadcast();
    });
}
if (process.argv.includes("--dev")) serve().catch(console.error);
else
  (async () => {
    await bundle();
    console.log("Built dist/index.html");
  })();
