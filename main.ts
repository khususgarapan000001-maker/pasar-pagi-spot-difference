// main.ts — the entrypoint: hands the game in.
// Copies game/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with the kit's buildDossier.
// Node 22 standard library only; no network; no deletion of the output dir.
//
// Revision 2 (after the first test run): the run is now self-checking —
// after writing dossier.json it is read back and parsed, and the run
// prints the byte counts it produced, so a bad dossier fails loudly here
// instead of silently reaching the grader.
import { cpSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, "game"), join(outDir, "game"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
});
const dossierPath = join(outDir, "dossier.json");
writeFileSync(dossierPath, dossier);

// Self-check: the dossier must parse back as JSON, and its size must fit
// the gate's 1.5 MiB cap. Throwing here fails the run loudly.
const written = readFileSync(dossierPath, "utf8");
const parsed = JSON.parse(written);
if (!parsed || typeof parsed !== "object" || !("text" in parsed)) {
  throw new Error("dossier.json did not parse back as a dossier");
}
const dossierBytes = statSync(dossierPath).size;
if (dossierBytes > 1572864) {
  throw new Error(`dossier.json is ${dossierBytes} bytes, over the 1.5 MiB cap`);
}
console.log(`PASAR PAGI handed in: dossier.json ${dossierBytes} bytes, ` +
  `game/ + screenshots/ copied to ${outDir}`);
