import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const TEST_VERSION = "v24.76d1b-sequence-negative-control-self-test";
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
  const uniqueFrames = new Set(values.map((value) => Number(value) >>> 0)).size;
  const uniqueFrameRatio = values.length ? uniqueFrames / values.length : 0;
  return { frames: values.length, uniqueFrames, uniqueFrameRatio: Number(uniqueFrameRatio.toFixed(6)), transformEligible: uniqueFrameRatio >= MIN_UNIQUE_FRAME_RATIO };
}

function sequenceGraph(chords) {
  const pieces = [];
  const labels = [];
  chords.forEach((chord, i) => {
    const toneLabels = [];
    chord.forEach((freq, j) => {
      const label = `s${i}_${j}`;
      pieces.push(`sine=frequency=${freq}:sample_rate=${SAMPLE_RATE}:duration=5,volume=${j === 0 ? 0.55 : 0.35}[${label}]`);
      toneLabels.push(`[${label}]`);
    });
    const mixed = `m${i}`;
    pieces.push(`${toneLabels.join("")}amix=inputs=${toneLabels.length}:normalize=0,afade=t=in:st=0:d=0.08,afade=t=out:st=4.92:d=0.08[${mixed}]`);
    labels.push(`[${mixed}]`);
  });
  pieces.push(`${labels.join("")}concat=n=${labels.length}:v=0:a=1,volume=0.8[out]`);
  return pieces.join(";");
}

async function makeAudio(path, chords) {
  await run("ffmpeg", ["-v", "error", "-y", "-filter_complex", sequenceGraph(chords), "-map", "[out]", "-codec:a", "libmp3lame", "-b:a", "128k", path]);
}

async function normalizeAndFingerprint(inputPath, outputPath, factor, mode) {
  const filter = mode === "rate" ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}` : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return rawChromaprint(outputPath);
}

async function main() {
  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-sequence-negative-control-"));
    const warnings = [];
    const definitions = {
      reference: [[220,277.18,329.63],[196,246.94,293.66],[261.63,329.63,392],[174.61,220,261.63],[233.08,293.66,349.23],[196,246.94,293.66]],
      control_a: [[277.18,349.23,415.30],[246.94,311.13,369.99],[329.63,415.30,493.88],[220,277.18,329.63],[293.66,369.99,440],[246.94,311.13,369.99]],
      control_b: [[164.81,207.65,246.94],[220,277.18,329.63],[185,233.08,277.18],[246.94,311.13,369.99],[196,246.94,293.66],[261.63,329.63,392]],
      control_c: [[311.13,392,466.16],[233.08,293.66,349.23],[174.61,220,261.63],[277.18,349.23,415.30],[207.65,261.63,311.13],[293.66,369.99,440]]
    };

    const files = {};
    const fps = {};
    for (const [name, chords] of Object.entries(definitions)) {
      const path = join(workDir, `${name}.mp3`);
      await makeAudio(path, chords);
      const fp = await rawChromaprint(path);
      if (fp.warning) warnings.push(`${name}: ${fp.warning}`);
      files[name] = path;
      fps[name] = fp.values;
    }

    const referenceQuality = fingerprintQuality(fps.reference);
    const controls = [];
    let globalBest = { score: 0, control: null, mode: null, factor: null };

    for (const name of ["control_a", "control_b", "control_c"]) {
      const quality = fingerprintQuality(fps[name]);
      const direct = fingerprintSimilarity(fps.reference, fps[name]);
      let best = { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };
      if (referenceQuality.transformEligible && quality.transformEligible) {
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
      const wouldFalseMatch = referenceQuality.transformEligible && quality.transformEligible && best.score >= SIMILARITY_THRESHOLD;
      if (best.score > globalBest.score) globalBest = { score: best.score, control: name, mode: best.mode, factor: best.factor };
      controls.push({ name, quality, directSimilarityScore: Number(direct.score.toFixed(6)), bestSearchSimilarityScore: Number(best.score.toFixed(6)), bestMode: best.mode, bestFactor: best.factor, wouldFalseMatch, transformSearchSkipped: !referenceQuality.transformEligible || !quality.transformEligible });
    }

    const passed = referenceQuality.transformEligible && controls.every((control) => control.quality.transformEligible && !control.wouldFalseMatch);
    console.log(JSON.stringify({ ok: passed, testVersion: TEST_VERSION, mutationPerformed: false, dataSource: "locally generated time-varying synthetic chord sequences only", productionAudioRead: false, databaseRead: false, databaseWrite: false, threshold: SIMILARITY_THRESHOLD, minUniqueFrameRatio: MIN_UNIQUE_FRAME_RATIO, searchFactors: SEARCH_FACTORS, referenceQuality, controls, globalBestSimilarityScore: Number(globalBest.score.toFixed(6)), globalBestControl: globalBest.control, globalBestMode: globalBest.mode, globalBestFactor: globalBest.factor, falsePositiveGuardPassed: passed, warnings }));
    if (!passed) process.exitCode = 2;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : error); process.exitCode = 1; });
