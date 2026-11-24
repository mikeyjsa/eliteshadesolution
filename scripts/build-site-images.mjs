import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";

const source = "public/site-photos";
const destination = "public/site-images";
mkdirSync(destination, { recursive: true });

for (const file of readdirSync(source).filter((name) => name.endsWith(".jpg"))) {
  for (const width of [640, 1080, 1600]) {
    execFileSync("cwebp", [
      "-quiet", "-q", "74", "-resize", String(width), "0",
      `${source}/${file}`, "-o", `${destination}/${file.slice(0, -4)}-${width}.webp`,
    ]);
  }
}

execFileSync("cwebp", [
  "-quiet", "-q", "82", "-resize", "640", "0",
  "public/logo.png", "-o", `${destination}/logo.webp`,
]);
