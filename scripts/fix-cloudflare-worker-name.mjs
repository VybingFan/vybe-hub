import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const workerName = "vybe-hub";
const configPath = resolve(process.cwd(), ".output", "server", "wrangler.json");

try {
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);
  const previousName = config.name;

  config.name = workerName;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  console.log(`[vybe] Cloudflare Worker name normalized: ${previousName ?? "(none)"} -> ${workerName}`);
} catch (error) {
  console.error(`[vybe] Could not normalize Cloudflare Worker name at ${configPath}`);
  throw error;
}
