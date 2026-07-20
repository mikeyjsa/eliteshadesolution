const fs = require("fs");
const path = require("path");

const standaloneServerPath = path.join(__dirname, "server.js");
const safeHost = process.env.APP_HOST || "0.0.0.0";

if (fs.existsSync(standaloneServerPath)) {
  process.env.HOSTNAME = safeHost;
  require(standaloneServerPath);
} else {
  const http = require("http");
  const next = require("next");

  const port = Number(process.env.PORT || process.env.APP_PORT || 3000);
  const host = safeHost;
  const dev = false;

  const app = next({ dev, hostname: host, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, host, () => {
        console.log(`Elite Shade app listening on http://${host}:${port}`);
      });
  }).catch((error) => {
    console.error("Could not start Next.js app", error);
    process.exit(1);
  });
}
