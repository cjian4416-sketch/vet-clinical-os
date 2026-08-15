import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";

const ignored = new Set([".git", ".openai", "dist", "node_modules"]);
if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/client", { recursive: true });
for (const entry of readdirSync(".")) {
  if (!ignored.has(entry)) cpSync(entry, `dist/client/${entry}`, { recursive: true });
}
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });
cpSync(".openai/hosting.json", "dist/.openai/hosting.json");
writeFileSync("dist/server/index.js", `export default { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/") url.pathname = "/index.html";
  return env.ASSETS.fetch(new Request(url, request));
} };\n`);
