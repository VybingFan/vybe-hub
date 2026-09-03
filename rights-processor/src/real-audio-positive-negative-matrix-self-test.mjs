import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const AUDIO_BUCKET = "music-audio";
const TEST_VERSION = "v24.76d3-real-audio-positive-negative-matrix-self-test";
const SIMILARITY_THRESHOLD = 0.90;
const SAMPLE_RATE = 48000;
const MIN_UNIQUE_FRAME_RATIO = 0.12;
const SEARCH_FACTORS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995, 1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03];

const APPROVED = {
  reference: {
    trackId: "61748911-72b4-4a1c-a641-d045a228252f",
    expectedTitle: "Vybe Theme 1-2",
  },
  controls: [
    {
      trackId: "4982bec3-8f69-4100-940a-5ccedb921490",
      expectedTitle: "Yng Brizy - Lavar Ball ",
      expectedJobStatus: "queued",
      expectedAttemptCount: 0,
    },
    {
      trackId: "c2721d9d-b502-4016-8863-d19fbc77b8a7",
      expectedTitle: "Take It  - nomix",
      expectedJobStatus: "queued",
      expectedAttemptCount: 0,
    },
  ],
};

const POSITIVE_TRANSFORMS = [
  {
    name: "speed_plus_2pct",
    description: "Reference playback speed +2% with pitch changing naturally",
    filter: `asetrate=${SAMPLE_RATE}*1.02,aresample=${SAMPLE_RATE}`,
  },
  {
    name: "speed_minus_2pct",
    description: "Reference playback speed -2% with pitch changing naturally",
    filter: `asetrate=${SAMPLE_RATE}*0.98,aresample=${SAMPLE_RATE}`,
  },
  {
    name: "pitch_plus_1pct",
    description: "Reference pitch +1% while approximately preserving duration",
    filter: `asetrate=${SAMPLE_RATE}*1.01,aresample=${SAMPLE_RATE},atempo=0.99009901`,
  },
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

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

function fingerprintQuality(values) {
  const normalized = values.map((value) => Number(value) >>> 0);
  const uniqueFrames = new Set(normalized).size;
  const uniqueFrameRatio = normalized.length ? uniqueFrames / normalized.length : 0;
  return {
    frames: normalized.length,
    uniqueFrames,
    uniqueFrameRatio: Number(uniqueFrameRatio.toFixed(6)),
    transformEligible: uniqueFrameRatio >= MIN_UNIQUE_FRAME_RATIO,
  };
}

function bestSlidingSimilarity(referenceValues, candidateValues) {
  const reference = referenceValues.map((value) => Number(value) >>> 0);
  const candidate = candidateValues.map((value) => Number(value) >>> 0);
  if (!reference.length || !candidate.length) return { score: 0, offset: 0, compared: 0 };
  const shorterLength = Math.min(reference.length, candidate.length);
  const minimumCompared = Math.max(24, Math.floor(shorterLength * 0.75));
  let best = { score: 0, offset: 0, compared: 0 };
  const minOffset = -reference.length + minimumCompared;
  const maxOffset = candidate.length - minimumCompared;
  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    let compared = 0;
    let differingBits = 0;
    for (let i = 0; i < reference.length; i += 1) {
      const j = i + offset;
      if (j < 0 || j >= candidate.length) continue;
      differingBits += bitCount32((reference[i] ^ candidate[j]) >>> 0);
      compared += 1;
    }
    if (compared < minimumCompared) continue;
    const score = 1 - differingBits / (compared * 32);
    if (score > best.score) best = { score, offset, compared };
  }
  return best;
}

async function fetchTrack(supabase, trackId) {
  const { data: track, error: trackError } = await supabase.from("tracks").select("id,creator_id,title,audio_url,status,visibility,rights_basis,rights_confirmed,duration_sec").eq("id", trackId).single();
  if (trackError) throw trackError;
  if (!track?.audio_url) throw new Error(`Track ${trackId} has no private audio storage path`);
  const { data: job, error: jobError } = await supabase.from("audio_processing_jobs").select("id,track_id,status,attempt_count,processor_version").eq("track_id", trackId).single();
  if (jobError) throw jobError;
  return { track, job };
}

async function downloadTrack(supabase, record, destinationPath) {
  const { data: blob, error } = await supabase.storage.from(AUDIO_BUCKET).download(record.track.audio_url);
  if (error) throw error;
  const bytes = Buffer.from(await blob.arrayBuffer());
  if (!bytes.length) throw new Error(`Downloaded audio is empty for ${record.track.id}`);
  await writeFile(destinationPath, bytes);
  return bytes.length;
}

async function fingerprintFile(path, warnings, label) {
  const fp = await rawChromaprint(path);
  if (fp.warning) warnings.push(`${label}: ${fp.warning}`);
  return fp.values;
}

async function renderTransform(inputPath, outputPath, filter) {
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
}

async function searchNormalization({ inputPath, referenceFingerprint, workDir, prefix, warnings }) {
  let best = { score: 0, mode: null, factor: null, offset: 0, compared: 0 };
  let transformsEvaluated = 0;
  for (const mode of ["rate", "pitch"]) {
    for (const factor of SEARCH_FACTORS) {
      const outputPath = join(workDir, `${prefix}-${mode}-${String(factor).replace(".", "_")}.mp3`);
      const filter = mode === "rate"
        ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}`
        : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
      await renderTransform(inputPath, outputPath, filter);
      const fp = await fingerprintFile(outputPath, warnings, `${prefix}/${mode}/${factor}`);
      transformsEvaluated += 1;
      const similarity = bestSlidingSimilarity(referenceFingerprint, fp);
      if (similarity.score > best.score) best = { score: similarity.score, mode, factor, offset: similarity.offset, compared: similarity.compared };
    }
  }
  return { best, transformsEvaluated };
}

async function main() {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const warnings = [];
  const referenceRecord = await fetchTrack(supabase, APPROVED.reference.trackId);
  if (referenceRecord.track.title !== APPROVED.reference.expectedTitle) throw new Error(`Reference title mismatch for approved track ${APPROVED.reference.trackId}`);

  const controlRecords = [];
  for (const approved of APPROVED.controls) {
    const record = await fetchTrack(supabase, approved.trackId);
    if (record.track.title !== approved.expectedTitle) throw new Error(`Control title mismatch for approved track ${approved.trackId}`);
    if (record.job.status !== approved.expectedJobStatus || record.job.attempt_count !== approved.expectedAttemptCount) {
      throw new Error(`Control job safety precondition changed for ${approved.trackId}: expected ${approved.expectedJobStatus}/attempt ${approved.expectedAttemptCount}, found ${record.job.status}/attempt ${record.job.attempt_count}`);
    }
    controlRecords.push(record);
  }

  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-real-matrix-"));
    const referencePath = join(workDir, "reference.mp3");
    const referenceBytes = await downloadTrack(supabase, referenceRecord, referencePath);
    const referenceFingerprint = await fingerprintFile(referencePath, warnings, "reference");
    const referenceQuality = fingerprintQuality(referenceFingerprint);

    const positives = [];
    for (const transform of POSITIVE_TRANSFORMS) {
      const transformedPath = join(workDir, `${transform.name}.mp3`);
      await renderTransform(referencePath, transformedPath, transform.filter);
      const transformedFingerprint = await fingerprintFile(transformedPath, warnings, transform.name);
      const transformedQuality = fingerprintQuality(transformedFingerprint);
      const direct = bestSlidingSimilarity(referenceFingerprint, transformedFingerprint);
      const search = referenceQuality.transformEligible && transformedQuality.transformEligible
        ? await searchNormalization({ inputPath: transformedPath, referenceFingerprint, workDir, prefix: transform.name, warnings })
        : { best: { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared }, transformsEvaluated: 0 };
      const recovered = search.best.score > direct.score ? search.best : { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };
      positives.push({
        name: transform.name,
        description: transform.description,
        quality: transformedQuality,
        directSimilarityScore: Number(direct.score.toFixed(6)),
        recoveredSimilarityScore: Number(recovered.score.toFixed(6)),
        recoveredMode: recovered.mode,
        recoveredFactor: recovered.factor,
        transformsEvaluated: search.transformsEvaluated,
        expectedMatch: true,
        matched: recovered.score >= SIMILARITY_THRESHOLD,
      });
    }

    const negatives = [];
    for (const record of controlRecords) {
      const controlPath = join(workDir, `${record.track.id}.mp3`);
      const downloadedBytes = await downloadTrack(supabase, record, controlPath);
      const controlFingerprint = await fingerprintFile(controlPath, warnings, record.track.title);
      const quality = fingerprintQuality(controlFingerprint);
      const direct = bestSlidingSimilarity(referenceFingerprint, controlFingerprint);
      const search = referenceQuality.transformEligible && quality.transformEligible
        ? await searchNormalization({ inputPath: controlPath, referenceFingerprint, workDir, prefix: record.track.id, warnings })
        : { best: { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared }, transformsEvaluated: 0 };
      const best = search.best.score > direct.score ? search.best : { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };
      negatives.push({
        trackId: record.track.id,
        title: record.track.title,
        jobId: record.job.id,
        sourceJobStatus: record.job.status,
        sourceAttemptCount: record.job.attempt_count,
        downloadedBytes,
        quality,
        directSimilarityScore: Number(direct.score.toFixed(6)),
        bestSimilarityScore: Number(best.score.toFixed(6)),
        bestMode: best.mode,
        bestFactor: best.factor,
        transformsEvaluated: search.transformsEvaluated,
        expectedMatch: false,
        matched: best.score >= SIMILARITY_THRESHOLD,
      });
    }

    const positiveGuardPassed = referenceQuality.transformEligible && positives.every((item) => item.quality.transformEligible && item.matched);
    const negativeGuardPassed = referenceQuality.transformEligible && negatives.every((item) => item.quality.transformEligible && !item.matched);
    const passed = positiveGuardPassed && negativeGuardPassed;
    const weakestPositive = positives.reduce((worst, item) => item.recoveredSimilarityScore < worst.score ? { score: item.recoveredSimilarityScore, name: item.name } : worst, { score: 1, name: null });
    const strongestNegative = negatives.reduce((best, item) => item.bestSimilarityScore > best.score ? { score: item.bestSimilarityScore, trackId: item.trackId, title: item.title } : best, { score: 0, trackId: null, title: null });
    const separationMargin = weakestPositive.score - strongestNegative.score;

    console.log(JSON.stringify({
      ok: passed,
      testVersion: TEST_VERSION,
      mutationPerformed: false,
      databaseRead: true,
      databaseWrite: false,
      productionAudioRead: true,
      processingJobsClaimed: false,
      processingJobsUpdated: false,
      audioMatchCandidatesWritten: false,
      moderationCasesWritten: false,
      threshold: SIMILARITY_THRESHOLD,
      minUniqueFrameRatio: MIN_UNIQUE_FRAME_RATIO,
      searchFactors: SEARCH_FACTORS,
      reference: {
        trackId: referenceRecord.track.id,
        title: referenceRecord.track.title,
        jobId: referenceRecord.job.id,
        sourceJobStatus: referenceRecord.job.status,
        sourceAttemptCount: referenceRecord.job.attempt_count,
        durationSec: referenceRecord.track.duration_sec,
        downloadedBytes: referenceBytes,
        quality: referenceQuality,
      },
      positives,
      negatives,
      weakestPositiveSimilarityScore: Number(weakestPositive.score.toFixed(6)),
      weakestPositiveName: weakestPositive.name,
      strongestNegativeSimilarityScore: Number(strongestNegative.score.toFixed(6)),
      strongestNegativeTrackId: strongestNegative.trackId,
      strongestNegativeTitle: strongestNegative.title,
      observedSeparationMargin: Number(separationMargin.toFixed(6)),
      positiveGuardPassed,
      negativeGuardPassed,
      matrixGuardPassed: passed,
      warnings,
    }));

    if (!passed) process.exitCode = 2;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
