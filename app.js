const http = require("http");
const next = require("next");

const port = Number(process.env.PORT || process.env.APP_PORT || 3000);
const host = process.env.HOSTNAME || "127.0.0.1";
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
