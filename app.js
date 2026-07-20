const fs = require("fs");
const path = require("path");

const standaloneServerPath = path.join(__dirname, "server.js");
const safeHost = process.env.APP_HOST || "0.0.0.0";
const resolvedPort =
  process.env.PORT ||
  process.env.APP_PORT ||
  process.env.PASSENGER_APP_PORT ||
  process.env.NODEJS_PORT ||
  process.env.CPANEL_APP_PORT ||
  "";

process.env.NODE_ENV = "production";
process.env.HOSTNAME = safeHost;
if (resolvedPort) process.env.PORT = resolvedPort;

if (fs.existsSync(standaloneServerPath)) {
  require(standaloneServerPath);
} else {
  const http = require("http");
  const next = require("next");

  const port = Number(process.env.PORT || 3000);
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
