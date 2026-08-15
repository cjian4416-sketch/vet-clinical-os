import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const ignored = new Set([".git", ".openai", "dist", "node_modules"]);
if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const entry of readdirSync(".")) {
  if (!ignored.has(entry)) cpSync(entry, `dist/${entry}`, { recursive: true });
}
