import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");
const outDir = path.join(root, "cpanel-deploy");
const archivePath = path.join(root, "cpanel-deploy.tar.gz");

if (!existsSync(standaloneDir)) {
  throw new Error("Missing .next/standalone. Run a standalone production build first.");
}

await rm(outDir, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(outDir, { recursive: true });

await cp(standaloneDir, outDir, { recursive: true });
await mkdir(path.join(outDir, ".next"), { recursive: true });
await cp(staticDir, path.join(outDir, ".next", "static"), { recursive: true });
await rm(path.join(outDir, ".data"), { recursive: true, force: true });

if (existsSync(publicDir)) {
  await cp(publicDir, path.join(outDir, "public"), { recursive: true });
  await rm(path.join(outDir, "public", ".DS_Store"), { force: true });
}

await mkdir(path.join(outDir, "tmp"), { recursive: true });
await writeFile(
  path.join(outDir, "DEPLOY-README.txt"),
  [
    "Elite Shade Solutions cPanel deploy bundle",
    "",
    "Upload and extract this bundle into the live Node.js application root.",
    "Expected cPanel startup file: server.js",
    "Expected persistent runtime folder in the live root: .data/",
    "",
    "This bundle contains:",
    "- Next.js standalone server output",
    "- .next/static assets",
    "- public assets",
    "",
    "This bundle intentionally does not include .data/ so live data is preserved.",
  ].join("\n"),
  "utf8"
);

execFileSync("tar", ["-czf", archivePath, "-C", outDir, "."], { stdio: "inherit" });

console.log(`Created ${path.relative(root, outDir)}`);
console.log(`Created ${path.relative(root, archivePath)}`);
