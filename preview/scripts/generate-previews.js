import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const edge = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const preview = resolve("preview");
const source = join(preview, "src", "16-9");
const output = join(preview, "renders", "16-9");

mkdirSync(output, { recursive: true });
for (const page of readdirSync(source).filter((file) => file.endsWith(".html"))) {
  execFileSync(edge, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--allow-file-access-from-files",
    "--virtual-time-budget=3000", "--window-size=1920,1080",
    "--screenshot=" + join(output, page.replace(".html", ".png")),
    pathToFileURL(join(source, page)).href,
  ]);
}
