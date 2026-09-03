import { join } from "node:path";

export const TRANSFORM_SHADOW_VERSION = "v24.76d6";
export const TRANSFORM_SHADOW_THRESHOLD = 0.90;
export const TRANSFORM_MIN_UNIQUE_FRAME_RATIO = 0.12;
export const TRANSFORM_SAMPLE_RATE = 48000;
export const TRANSFORM_SEARCH_FACTORS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995, 1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03];

function bitCount32(value) {
  let v = value >>> 0;
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function fingerprintQuality(values) {
  const normalized = values.map((value) => Number(value) >>> 0);
  const uniqueFrames = new Set(normalized).size;
  const uniqueFrameRatio = normalized.length ? uniqueFrames / normalized.length : 0;
  return {
    frames: normalized.length,
    uniqueFrames,
    uniqueFrameRatio: Number(uniqueFrameRatio.toFixed(6)),
    transformEligible: uniqueFrameRatio >= TRANSFORM_MIN_UNIQUE_FRAME_RATIO,
  };
}

export function bestSlidingSimilarity(leftValues, rightValues) {
  const left = leftValues.map((value) => Number(value) >>> 0);
  const right = rightValues.map((value) => Number(value) >>> 0);
  if (!left.length || !right.length) return { score: 0, offset: 0, compared: 0 };
  const shorterLength = Math.min(left.length, right.length);
  const minimumCompared = Math.max(24, Math.floor(shorterLength * 0.75));
  let best = { score: 0, offset: 0, compared: 0 };
  const minOffset = -left.length + minimumCompared;
  const maxOffset = right.length - minimumCompared;
  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    let compared = 0;
    let differingBits = 0;
    for (let i = 0; i < left.length; i += 1) {
      const j = i + offset;
      if (j < 0 || j >= right.length) continue;
      differingBits += bitCount32((left[i] ^ right[j]) >>> 0);
      compared += 1;
    }
    if (compared < minimumCompared) continue;
    const score = 1 - differingBits / (compared * 32);
    if (score > best.score) best = { score, offset, compared };
  }
  return best;
}

async function rawChromaprint(filePath, runProcess) {
  const result = await runProcess("fpcalc", ["-raw", "-json", filePath], { acceptNonZero: true });
  let parsed;
  try { parsed = JSON.parse(result.stdout || "{}"); }
  catch { throw new Error(`shadow fpcalc returned invalid JSON: ${result.stderr.slice(-1500)}`); }
  if (!parsed.fingerprint) throw new Error(`shadow fpcalc did not return a fingerprint${result.code === 0 ? "" : ` (exit ${result.code}: ${result.stderr.slice(-1500)})`}`);
  const values = Array.isArray(parsed.fingerprint)
    ? parsed.fingerprint.map(Number)
    : String(parsed.fingerprint).split(",").filter(Boolean).map(Number);
  if (!values.length || values.some((value) => !Number.isInteger(value))) throw new Error("Shadow raw Chromaprint was not a valid integer sequence");
  return { values, warning: result.code === 0 ? null : result.stderr.trim() || `fpcalc exited ${result.code}` };
}

async function renderTransform(sourcePath, outputPath, mode, factor, runProcess) {
  const filter = mode === "rate"
    ? `asetrate=${TRANSFORM_SAMPLE_RATE}*${factor},aresample=${TRANSFORM_SAMPLE_RATE}`
    : `asetrate=${TRANSFORM_SAMPLE_RATE}*${factor},aresample=${TRANSFORM_SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
  await runProcess("ffmpeg", ["-v", "error", "-y", "-i", sourcePath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return rawChromaprint(outputPath, runProcess);
}

export async function createTransformShadowContext({ sourcePath, sourceRawFingerprint, workDir, runProcess }) {
  if (typeof runProcess !== "function") throw new Error("Transform shadow requires the hardened worker process runner");
  const sourceQuality = fingerprintQuality(sourceRawFingerprint);
  const warnings = [];
  const transforms = [];

  if (sourceQuality.transformEligible) {
    for (const mode of ["rate", "pitch"]) {
      for (const factor of TRANSFORM_SEARCH_FACTORS) {
        const outputPath = join(workDir, `shadow-${mode}-${String(factor).replace(".", "_")}.mp3`);
        const fp = await renderTransform(sourcePath, outputPath, mode, factor, runProcess);
        if (fp.warning) warnings.push(`${mode}/${factor}: ${fp.warning}`);
        transforms.push({ mode, factor, values: fp.values });
      }
    }
  }

  return {
    sourceQuality,
    warnings,
    transformsEvaluatedPerEligibleCandidate: transforms.length,
    evaluateCandidate(candidateRawFingerprint) {
      const candidateQuality = fingerprintQuality(candidateRawFingerprint);
      const direct = bestSlidingSimilarity(sourceRawFingerprint, candidateRawFingerprint);
      let best = { ...direct, mode: "direct", factor: 1 };
      let transformsEvaluated = 0;

      if (sourceQuality.transformEligible && candidateQuality.transformEligible) {
        for (const transform of transforms) {
          transformsEvaluated += 1;
          const result = bestSlidingSimilarity(transform.values, candidateRawFingerprint);
          if (result.score > best.score) best = { ...result, mode: transform.mode, factor: transform.factor };
        }
      }

      return {
        candidateQuality,
        directSimilarityScore: Number(direct.score.toFixed(6)),
        shadowBestSimilarityScore: Number(best.score.toFixed(6)),
        shadowBestMode: best.mode,
        shadowBestFactor: best.factor,
        shadowBestOffset: best.offset,
        comparedFrames: best.compared,
        transformsEvaluated,
        directWouldMatch: direct.score >= TRANSFORM_SHADOW_THRESHOLD,
        shadowWouldMatch: sourceQuality.transformEligible && candidateQuality.transformEligible && best.score >= TRANSFORM_SHADOW_THRESHOLD,
      };
    },
  };
}
