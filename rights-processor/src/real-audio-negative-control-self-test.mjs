import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const AUDIO_BUCKET = "music-audio";
const TEST_VERSION = "v24.76d2-real-audio-negative-control-self-test";
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

async function transformAndFingerprint(inputPath, outputPath, factor, mode, warnings, label) {
  const filter = mode === "rate"
    ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}`
    : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return fingerprintFile(outputPath, warnings, label);
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
    controlRecords.push({ approved, ...record });
  }

  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-real-negative-control-"));
    const referencePath = join(workDir, "reference.mp3");
    const referenceBytes = await downloadTrack(supabase, referenceRecord, referencePath);
    const referenceFingerprint = await fingerprintFile(referencePath, warnings, "reference");
    const referenceQuality = fingerprintQuality(referenceFingerprint);

    const results = [];
    for (const record of controlRecords) {
      const safeName = record.track.id;
      const controlPath = join(workDir, `${safeName}.mp3`);
      const downloadedBytes = await downloadTrack(supabase, record, controlPath);
      const controlFingerprint = await fingerprintFile(controlPath, warnings, record.track.title);
      const quality = fingerprintQuality(controlFingerprint);
      const direct = bestSlidingSimilarity(referenceFingerprint, controlFingerprint);
      let best = { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };
      let transformsEvaluated = 0;

      if (referenceQuality.transformEligible && quality.transformEligible) {
        for (const mode of ["rate", "pitch"]) {
          for (const factor of SEARCH_FACTORS) {
            const outputPath = join(workDir, `${safeName}-${mode}-${String(factor).replace(".", "_")}.mp3`);
            const transformedFingerprint = await transformAndFingerprint(controlPath, outputPath, factor, mode, warnings, `${record.track.title}/${mode}/${factor}`);
            transformsEvaluated += 1;
            const similarity = bestSlidingSimilarity(referenceFingerprint, transformedFingerprint);
            if (similarity.score > best.score) best = { score: similarity.score, mode, factor, offset: similarity.offset, compared: similarity.compared };
          }
        }
      }

      const wouldFalseMatch = referenceQuality.transformEligible && quality.transformEligible && best.score >= SIMILARITY_THRESHOLD;
      results.push({
        trackId: record.track.id,
        title: record.track.title,
        jobId: record.job.id,
        sourceJobStatus: record.job.status,
        sourceAttemptCount: record.job.attempt_count,
        trackStatus: record.track.status,
        visibility: record.track.visibility,
        rightsBasis: record.track.rights_basis,
        rightsConfirmed: record.track.rights_confirmed,
        durationSec: record.track.duration_sec,
        downloadedBytes,
        quality,
        directSimilarityScore: Number(direct.score.toFixed(6)),
        directBestOffset: direct.offset,
        directComparedFrames: direct.compared,
        bestSearchSimilarityScore: Number(best.score.toFixed(6)),
        bestMode: best.mode,
        bestFactor: best.factor,
        bestOffset: best.offset,
        comparedFrames: best.compared,
        transformsEvaluated,
        transformSearchSkipped: !referenceQuality.transformEligible || !quality.transformEligible,
        wouldFalseMatch,
      });
    }

    const passed = referenceQuality.transformEligible && results.every((result) => result.quality.transformEligible && !result.wouldFalseMatch);
    const globalBest = results.reduce((best, result) => result.bestSearchSimilarityScore > best.score ? { score: result.bestSearchSimilarityScore, trackId: result.trackId, title: result.title, mode: result.bestMode, factor: result.bestFactor } : best, { score: 0, trackId: null, title: null, mode: null, factor: null });

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
      controls: results,
      globalBestSimilarityScore: globalBest.score,
      globalBestTrackId: globalBest.trackId,
      globalBestTitle: globalBest.title,
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

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
