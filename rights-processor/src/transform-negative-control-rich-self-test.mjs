import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const TEST_VERSION = "v24.76d1a-rich-negative-control-self-test";
const SIMILARITY_THRESHOLD = 0.90;
const SAMPLE_RATE = 48000;
const SEARCH_FACTORS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995, 1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03];
const MIN_UNIQUE_FRAME_RATIO = 0.12;

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

function fingerprintQuality(values) {
  const unique = new Set(values.map((value) => Number(value) >>> 0)).size;
  const uniqueFrameRatio = values.length ? unique / values.length : 0;
  return { frames: values.length, uniqueFrames: unique, uniqueFrameRatio: Number(uniqueFrameRatio.toFixed(6)), transformEligible: uniqueFrameRatio >= MIN_UNIQUE_FRAME_RATIO };
}

async function makeAudio(path, graph) {
  await run("ffmpeg", ["-v", "error", "-y", "-filter_complex", graph, "-map", "[out]", "-codec:a", "libmp3lame", "-b:a", "128k", path]);
}

async function normalizeAndFingerprint(inputPath, outputPath, factor, mode) {
  const filter = mode === "rate" ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}` : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return rawChromaprint(outputPath);
}

async function main() {
  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-rich-negative-control-"));
    const warnings = [];
    const definitions = {
      reference: "sine=frequency=220:sample_rate=48000:duration=30[a];sine=frequency=329.63:sample_rate=48000:duration=30[b];sine=frequency=493.88:sample_rate=48000:duration=30[c];anoisesrc=color=white:sample_rate=48000:duration=30:amplitude=0.025[d];[a][b][c][d]amix=inputs=4:weights='1 0.7 0.45 0.08',tremolo=f=3.7:d=0.35,volume=0.8[out]",
      control_a: "sine=frequency=277.18:sample_rate=48000:duration=30[a];sine=frequency=415.30:sample_rate=48000:duration=30[b];sine=frequency=622.25:sample_rate=48000:duration=30[c];anoisesrc=color=pink:sample_rate=48000:duration=30:amplitude=0.03[d];[a][b][c][d]amix=inputs=4:weights='1 0.6 0.35 0.08',tremolo=f=5.1:d=0.25,volume=0.8[out]",
      control_b: "sine=frequency=196:sample_rate=48000:duration=30[a];sine=frequency=293.66:sample_rate=48000:duration=30[b];sine=frequency=440:sample_rate=48000:duration=30[c];anoisesrc=color=brown:sample_rate=48000:duration=30:amplitude=0.035[d];[a][b][c][d]amix=inputs=4:weights='1 0.75 0.5 0.1',tremolo=f=2.3:d=0.4,volume=0.8[out]",
      low_information_tone: "sine=frequency=997:sample_rate=48000:duration=30,volume=0.8[out]"
    };

    const files = {};
    const fps = {};
    for (const [name, graph] of Object.entries(definitions)) {
      const path = join(workDir, `${name}.mp3`);
      await makeAudio(path, graph);
      const fp = await rawChromaprint(path);
      if (fp.warning) warnings.push(`${name}: ${fp.warning}`);
      files[name] = path;
      fps[name] = fp.values;
    }

    const referenceQuality = fingerprintQuality(fps.reference);
    const controls = [];
    let globalBestEligible = { score: 0, control: null, mode: null, factor: null };

    for (const name of ["control_a", "control_b", "low_information_tone"]) {
      const quality = fingerprintQuality(fps[name]);
      const direct = fingerprintSimilarity(fps.reference, fps[name]);
      let best = { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };
      if (quality.transformEligible && referenceQuality.transformEligible) {
        for (const mode of ["rate", "pitch"]) {
          for (const factor of SEARCH_FACTORS) {
            const outputPath = join(workDir, `${name}-${mode}-${String(factor).replace(".", "_")}.mp3`);
            const fp = await normalizeAndFingerprint(files[name], outputPath, factor, mode);
            if (fp.warning) warnings.push(`${name}/${mode}/${factor}: ${fp.warning}`);
            const similarity = fingerprintSimilarity(fps.reference, fp.values);
            if (similarity.score > best.score) best = { score: similarity.score, mode, factor, offset: similarity.offset, compared: similarity.compared };
          }
        }
      }
      const wouldFalseMatch = quality.transformEligible && referenceQuality.transformEligible && best.score >= SIMILARITY_THRESHOLD;
      if (quality.transformEligible && best.score > globalBestEligible.score) globalBestEligible = { score: best.score, control: name, mode: best.mode, factor: best.factor };
      controls.push({ name, quality, directSimilarityScore: Number(direct.score.toFixed(6)), bestSearchSimilarityScore: Number(best.score.toFixed(6)), bestMode: best.mode, bestFactor: best.factor, wouldFalseMatch, transformSearchSkipped: !quality.transformEligible || !referenceQuality.transformEligible });
    }

    const eligibleControls = controls.filter((control) => control.quality.transformEligible && referenceQuality.transformEligible);
    const passed = referenceQuality.transformEligible && eligibleControls.length >= 2 && eligibleControls.every((control) => !control.wouldFalseMatch);
    console.log(JSON.stringify({ ok: passed, testVersion: TEST_VERSION, mutationPerformed: false, dataSource: "locally generated synthetic audio only", productionAudioRead: false, databaseRead: false, databaseWrite: false, threshold: SIMILARITY_THRESHOLD, minUniqueFrameRatio: MIN_UNIQUE_FRAME_RATIO, searchFactors: SEARCH_FACTORS, referenceQuality, controls, globalBestEligibleSimilarityScore: Number(globalBestEligible.score.toFixed(6)), globalBestEligibleControl: globalBestEligible.control, globalBestEligibleMode: globalBestEligible.mode, globalBestEligibleFactor: globalBestEligible.factor, falsePositiveGuardPassed: passed, warnings }));
    if (!passed) process.exitCode = 2;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : error); process.exitCode = 1; });
