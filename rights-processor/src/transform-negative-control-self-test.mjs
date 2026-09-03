import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const TEST_VERSION = "v24.76d1-negative-control-self-test";
const SIMILARITY_THRESHOLD = 0.90;
const SAMPLE_RATE = 48000;
const SEARCH_FACTORS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995, 1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03];

function run(command, args, acceptNonZero = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = { code: code ?? -1, stdout, stderr };
      if (acceptNonZero || code === 0) resolve(result);
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-1500)}`));
    });
  });
}

async function rawChromaprint(filePath) {
  const result = await run("fpcalc", ["-raw", "-json", filePath], true);
  let parsed;
  try { parsed = JSON.parse(result.stdout || "{}"); } catch { throw new Error(`fpcalc raw returned invalid JSON: ${result.stderr.slice(-1500)}`); }
  if (!parsed.fingerprint) throw new Error(`fpcalc raw did not return a fingerprint${result.code === 0 ? "" : ` (exit ${result.code}: ${result.stderr.slice(-1500)})`}`);
  const values = Array.isArray(parsed.fingerprint) ? parsed.fingerprint.map(Number) : String(parsed.fingerprint).split(",").filter(Boolean).map(Number);
  if (!values.length || values.some((value) => !Number.isInteger(value))) throw new Error("Raw Chromaprint was not a valid integer sequence");
  return { values, warning: result.code === 0 ? null : result.stderr.trim() || `fpcalc exited ${result.code}` };
}

function bitCount32(value) {
  let v = value >>> 0;
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function fingerprintSimilarity(left, right) {
  const a = left.map((value) => Number(value) >>> 0);
  const b = right.map((value) => Number(value) >>> 0);
  if (!a.length || !b.length) return { score: 0, offset: 0, compared: 0 };
  const maxOffset = Math.min(12, Math.max(4, Math.abs(a.length - b.length) + 4));
  let best = { score: 0, offset: 0, compared: 0 };
  for (let offset = -maxOffset; offset <= maxOffset; offset += 1) {
    let compared = 0;
    let differingBits = 0;
    for (let i = 0; i < a.length; i += 1) {
      const j = i + offset;
      if (j < 0 || j >= b.length) continue;
      differingBits += bitCount32((a[i] ^ b[j]) >>> 0);
      compared += 1;
    }
    if (compared < Math.min(a.length, b.length) * 0.75) continue;
    const score = 1 - differingBits / (compared * 32);
    if (score > best.score) best = { score, offset, compared };
  }
  return best;
}

async function makeSynthetic(path, kind) {
  let filter;
  if (kind === "reference") filter = "sine=frequency=440:sample_rate=48000:duration=30,volume=0.8";
  else if (kind === "tone") filter = "sine=frequency=997:sample_rate=48000:duration=30,volume=0.8";
  else if (kind === "dual") filter = "sine=frequency=261.63:sample_rate=48000:duration=30[a];sine=frequency=392:sample_rate=48000:duration=30[b];[a][b]amix=inputs=2:normalize=0";
  else if (kind === "noise") filter = "anoisesrc=color=pink:sample_rate=48000:duration=30:amplitude=0.35";
  else throw new Error(`Unknown synthetic kind: ${kind}`);
  await run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", filter, "-codec:a", "libmp3lame", "-b:a", "128k", path]);
}

async function normalizeAndFingerprint(inputPath, outputPath, factor, mode) {
  const filter = mode === "rate"
    ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}`
    : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return rawChromaprint(outputPath);
}

async function main() {
  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-negative-control-"));
    const warnings = [];
    const referencePath = join(workDir, "reference.mp3");
    await makeSynthetic(referencePath, "reference");
    const reference = await rawChromaprint(referencePath);
    if (reference.warning) warnings.push(`reference: ${reference.warning}`);

    const controls = [
      { name: "unrelated_tone_997hz", kind: "tone" },
      { name: "unrelated_dual_tone", kind: "dual" },
      { name: "unrelated_pink_noise", kind: "noise" },
    ];
    const results = [];
    let globalBest = { score: 0, control: null, mode: null, factor: null };

    for (const control of controls) {
      const inputPath = join(workDir, `${control.name}.mp3`);
      await makeSynthetic(inputPath, control.kind);
      const inputFp = await rawChromaprint(inputPath);
      if (inputFp.warning) warnings.push(`${control.name}: ${inputFp.warning}`);
      const direct = fingerprintSimilarity(reference.values, inputFp.values);
      let best = { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };

      for (const mode of ["rate", "pitch"]) {
        for (const factor of SEARCH_FACTORS) {
          const outputPath = join(workDir, `${control.name}-${mode}-${String(factor).replace(".", "_")}.mp3`);
          const fp = await normalizeAndFingerprint(inputPath, outputPath, factor, mode);
          if (fp.warning) warnings.push(`${control.name}/${mode}/${factor}: ${fp.warning}`);
          const similarity = fingerprintSimilarity(reference.values, fp.values);
          if (similarity.score > best.score) best = { score: similarity.score, mode, factor, offset: similarity.offset, compared: similarity.compared };
        }
      }

      if (best.score > globalBest.score) globalBest = { score: best.score, control: control.name, mode: best.mode, factor: best.factor };
      results.push({
        name: control.name,
        directSimilarityScore: Number(direct.score.toFixed(6)),
        bestSearchSimilarityScore: Number(best.score.toFixed(6)),
        bestMode: best.mode,
        bestFactor: best.factor,
        wouldFalseMatch: best.score >= SIMILARITY_THRESHOLD,
        bestOffset: best.offset,
        comparedFrames: best.compared,
      });
    }

    const passed = globalBest.score < SIMILARITY_THRESHOLD && results.every((result) => !result.wouldFalseMatch);
    console.log(JSON.stringify({
      ok: passed,
      testVersion: TEST_VERSION,
      mutationPerformed: false,
      dataSource: "locally generated synthetic audio only",
      productionAudioRead: false,
      databaseRead: false,
      databaseWrite: false,
      threshold: SIMILARITY_THRESHOLD,
      searchFactors: SEARCH_FACTORS,
      reference: "440 Hz synthetic tone, 30 seconds",
      controls: results,
      globalBestSimilarityScore: Number(globalBest.score.toFixed(6)),
      globalBestControl: globalBest.control,
      globalBestMode: globalBest.mode,
      globalBestFactor: globalBest.factor,
      falsePositiveGuardPassed: passed,
      warnings,
    }));
    if (!passed) process.exitCode = 2;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : error); process.exitCode = 1; });
