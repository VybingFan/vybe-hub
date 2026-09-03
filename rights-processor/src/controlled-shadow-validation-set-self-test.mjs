import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const AUDIO_BUCKET = "music-audio";
const TEST_VERSION = "v24.76d5-controlled-shadow-validation-set-self-test";
const SIMILARITY_THRESHOLD = 0.90;
const SAMPLE_RATE = 48000;
const MIN_UNIQUE_FRAME_RATIO = 0.12;
const SEARCH_FACTORS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995, 1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03];

const REFERENCE = {
  trackId: "61748911-72b4-4a1c-a641-d045a228252f",
  jobId: "c47ab672-a2ee-4d04-9051-ab2e3dc2723d",
  expectedTitle: "Vybe Theme 1-2",
  expectedJobStatus: "flagged",
  expectedAttemptCount: 3,
};

const NEGATIVE_CONTROLS = [
  { trackId: "7bc3ce5b-a381-4935-9ab7-bd1680ff1010", jobId: "27345aff-e546-469f-b433-3bd7bee4f06a", expectedTitle: "This That", expectedJobStatus: "skipped", expectedAttemptCount: 0 },
  { trackId: "89e39506-e6b7-4241-9959-c36d5da59442", jobId: "508e6f19-cebb-4e02-a8e9-e42a08e307a9", expectedTitle: "Poppa", expectedJobStatus: "skipped", expectedAttemptCount: 0 },
  { trackId: "162ac4d1-c66c-4a9d-9c26-998ac9f05f31", jobId: "8b761e82-50f8-4e6f-afcf-68db4c4b2163", expectedTitle: "Soul Bleed", expectedJobStatus: "skipped", expectedAttemptCount: 0 },
  { trackId: "0279d8c9-7b4a-491a-b01d-02c9af93fcf1", jobId: "9792eb10-e26c-4397-87b5-adeb2a57d568", expectedTitle: "DIfferent - Nomix", expectedJobStatus: "skipped", expectedAttemptCount: 0 },
  { trackId: "2dcdd1a7-9446-47b5-923f-2a29b5314eca", jobId: "bef41698-9809-479c-928d-de2c30b2735f", expectedTitle: "Black Woman", expectedJobStatus: "skipped", expectedAttemptCount: 0 },
  { trackId: "77983d0c-277d-4c44-afee-e16a3abe7711", jobId: "c71f2f38-6874-448f-90e3-10ed262db638", expectedTitle: "Resume", expectedJobStatus: "skipped", expectedAttemptCount: 0 },
  { trackId: "4982bec3-8f69-4100-940a-5ccedb921490", jobId: "f423cdf3-d313-41d8-ac0e-349222796a3b", expectedTitle: "Yng Brizy - Lavar Ball ", expectedJobStatus: "queued", expectedAttemptCount: 0 },
  { trackId: "c2721d9d-b502-4016-8863-d19fbc77b8a7", jobId: "fd07b88f-f5c9-4075-800b-6b8c51d77085", expectedTitle: "Take It  - nomix", expectedJobStatus: "queued", expectedAttemptCount: 0 },
];

const POSITIVE_VARIANTS = [
  { name: "speed_plus_2pct", filter: `asetrate=${SAMPLE_RATE}*1.02,aresample=${SAMPLE_RATE}` },
  { name: "speed_minus_2pct", filter: `asetrate=${SAMPLE_RATE}*0.98,aresample=${SAMPLE_RATE}` },
  { name: "pitch_plus_1pct", filter: `asetrate=${SAMPLE_RATE}*1.01,aresample=${SAMPLE_RATE},atempo=0.99009901` },
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
  return { frames: normalized.length, uniqueFrames, uniqueFrameRatio: Number(uniqueFrameRatio.toFixed(6)), transformEligible: uniqueFrameRatio >= MIN_UNIQUE_FRAME_RATIO };
}

function bestSlidingSimilarity(leftValues, rightValues) {
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

async function loadTrackAndJob(supabase, spec) {
  const { data: job, error: jobError } = await supabase.from("audio_processing_jobs").select("id,track_id,creator_id,status,attempt_count,processor_version").eq("id", spec.jobId).single();
  if (jobError) throw jobError;
  const { data: track, error: trackError } = await supabase.from("tracks").select("id,creator_id,title,audio_url,status,visibility,duration_sec,rights_basis,rights_confirmed").eq("id", spec.trackId).single();
  if (trackError) throw trackError;
  if (job.track_id !== track.id) throw new Error(`Safety precondition failed for ${spec.expectedTitle}: job/track mismatch`);
  if (job.creator_id !== track.creator_id) throw new Error(`Safety precondition failed for ${spec.expectedTitle}: creator mismatch`);
  if (track.title !== spec.expectedTitle) throw new Error(`Safety precondition failed for ${spec.trackId}: title changed`);
  if (job.status !== spec.expectedJobStatus || job.attempt_count !== spec.expectedAttemptCount) throw new Error(`Safety precondition failed for ${track.title}: job state changed`);
  if (!track.audio_url) throw new Error(`Track ${track.title} has no private audio storage path`);
  return { spec, job, track, initialState: { status: job.status, attemptCount: job.attempt_count, processorVersion: job.processor_version } };
}

async function downloadFingerprint(supabase, entry, workDir, label, warnings) {
  const { data: blob, error } = await supabase.storage.from(AUDIO_BUCKET).download(entry.track.audio_url);
  if (error) throw error;
  const bytes = Buffer.from(await blob.arrayBuffer());
  if (!bytes.length) throw new Error(`${entry.track.title} downloaded as an empty object`);
  const path = join(workDir, `${label}.audio`);
  await writeFile(path, bytes);
  const fp = await rawChromaprint(path);
  if (fp.warning) warnings.push(`${label}: ${fp.warning}`);
  return { path, bytes: bytes.length, values: fp.values, quality: fingerprintQuality(fp.values) };
}

async function transformFingerprint(inputPath, outputPath, filter, warnings, label) {
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  const fp = await rawChromaprint(outputPath);
  if (fp.warning) warnings.push(`${label}: ${fp.warning}`);
  return fp.values;
}

async function buildNormalizationSearch(referencePath, workDir, warnings) {
  const transformed = [];
  for (const mode of ["rate", "pitch"]) {
    for (const factor of SEARCH_FACTORS) {
      const outputPath = join(workDir, `normalization-${mode}-${String(factor).replace(".", "_")}.mp3`);
      const filter = mode === "rate"
        ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}`
        : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
      const values = await transformFingerprint(referencePath, outputPath, filter, warnings, `normalization/${mode}/${factor}`);
      transformed.push({ mode, factor, values });
    }
  }
  return transformed;
}

function bestAgainstSearch(candidateValues, referenceValues, search) {
  const direct = bestSlidingSimilarity(referenceValues, candidateValues);
  let best = { ...direct, mode: "direct", factor: 1 };
  for (const item of search) {
    const result = bestSlidingSimilarity(item.values, candidateValues);
    if (result.score > best.score) best = { ...result, mode: item.mode, factor: item.factor };
  }
  return { direct, best };
}

async function verifyStatesUnchanged(supabase, entries) {
  const checks = [];
  for (const entry of entries) {
    const { data: after, error } = await supabase.from("audio_processing_jobs").select("status,attempt_count,processor_version").eq("id", entry.job.id).single();
    if (error) throw error;
    const unchanged = after.status === entry.initialState.status && after.attempt_count === entry.initialState.attemptCount && after.processor_version === entry.initialState.processorVersion;
    checks.push({ jobId: entry.job.id, trackId: entry.track.id, title: entry.track.title, unchanged });
  }
  return checks;
}

async function main() {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const warnings = [];
  const referenceEntry = await loadTrackAndJob(supabase, REFERENCE);
  const controlEntries = [];
  for (const spec of NEGATIVE_CONTROLS) controlEntries.push(await loadTrackAndJob(supabase, spec));
  const allEntries = [referenceEntry, ...controlEntries];

  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-d5-shadow-set-"));
    const referenceFp = await downloadFingerprint(supabase, referenceEntry, workDir, "reference", warnings);
    if (!referenceFp.quality.transformEligible) throw new Error("Reference failed the controlled transform quality gate");

    const normalizationSearch = await buildNormalizationSearch(referenceFp.path, workDir, warnings);

    const positives = [];
    for (const positive of POSITIVE_VARIANTS) {
      const positivePath = join(workDir, `positive-${positive.name}.mp3`);
      const positiveValues = await transformFingerprint(referenceFp.path, positivePath, positive.filter, warnings, `positive/${positive.name}`);
      const quality = fingerprintQuality(positiveValues);
      const result = bestAgainstSearch(positiveValues, referenceFp.values, normalizationSearch);
      positives.push({
        name: positive.name,
        quality,
        directSimilarityScore: Number(result.direct.score.toFixed(6)),
        recoveredSimilarityScore: Number(result.best.score.toFixed(6)),
        recoveredMode: result.best.mode,
        recoveredFactor: result.best.factor,
        expectedMatch: true,
        matched: quality.transformEligible && result.best.score >= SIMILARITY_THRESHOLD,
      });
    }

    const negatives = [];
    for (let i = 0; i < controlEntries.length; i += 1) {
      const entry = controlEntries[i];
      const fp = await downloadFingerprint(supabase, entry, workDir, `negative-${i}`, warnings);
      const result = bestAgainstSearch(fp.values, referenceFp.values, normalizationSearch);
      negatives.push({
        trackId: entry.track.id,
        title: entry.track.title,
        jobId: entry.job.id,
        sourceJobStatus: entry.job.status,
        sourceAttemptCount: entry.job.attempt_count,
        trackStatus: entry.track.status,
        visibility: entry.track.visibility,
        durationSec: entry.track.duration_sec,
        rightsBasis: entry.track.rights_basis,
        rightsConfirmed: entry.track.rights_confirmed,
        downloadedBytes: fp.bytes,
        quality: fp.quality,
        directSimilarityScore: Number(result.direct.score.toFixed(6)),
        bestSimilarityScore: Number(result.best.score.toFixed(6)),
        bestMode: result.best.mode,
        bestFactor: result.best.factor,
        expectedMatch: false,
        matched: fp.quality.transformEligible && result.best.score >= SIMILARITY_THRESHOLD,
      });
    }

    const stateChecks = await verifyStatesUnchanged(supabase, allEntries);
    const allJobStatesUnchanged = stateChecks.every((item) => item.unchanged);
    const positiveGuardPassed = positives.every((item) => item.quality.transformEligible && item.matched);
    const negativeGuardPassed = negatives.every((item) => item.quality.transformEligible && !item.matched);
    const weakestPositive = positives.reduce((best, item) => !best || item.recoveredSimilarityScore < best.recoveredSimilarityScore ? item : best, null);
    const strongestNegative = negatives.reduce((best, item) => !best || item.bestSimilarityScore > best.bestSimilarityScore ? item : best, null);
    const observedSeparationMargin = weakestPositive && strongestNegative ? Number((weakestPositive.recoveredSimilarityScore - strongestNegative.bestSimilarityScore).toFixed(6)) : null;
    const matrixGuardPassed = positiveGuardPassed && negativeGuardPassed && allJobStatesUnchanged;

    console.log(JSON.stringify({
      ok: matrixGuardPassed,
      testVersion: TEST_VERSION,
      mode: "controlled_shadow_validation_set_read_only",
      mutationPerformed: false,
      databaseRead: true,
      databaseWrite: false,
      productionAudioRead: true,
      processingJobsClaimed: false,
      processingJobsUpdated: false,
      audioFingerprintsWritten: false,
      audioMatchCandidatesWritten: false,
      moderationCasesWritten: false,
      threshold: SIMILARITY_THRESHOLD,
      minUniqueFrameRatio: MIN_UNIQUE_FRAME_RATIO,
      searchFactors: SEARCH_FACTORS,
      reference: {
        trackId: referenceEntry.track.id,
        title: referenceEntry.track.title,
        jobId: referenceEntry.job.id,
        sourceJobStatus: referenceEntry.job.status,
        sourceAttemptCount: referenceEntry.job.attempt_count,
        downloadedBytes: referenceFp.bytes,
        quality: referenceFp.quality,
      },
      positiveCount: positives.length,
      negativeCount: negatives.length,
      positives,
      negatives,
      weakestPositiveSimilarityScore: weakestPositive?.recoveredSimilarityScore ?? null,
      weakestPositiveName: weakestPositive?.name ?? null,
      strongestNegativeSimilarityScore: strongestNegative?.bestSimilarityScore ?? null,
      strongestNegativeTrackId: strongestNegative?.trackId ?? null,
      strongestNegativeTitle: strongestNegative?.title ?? null,
      observedSeparationMargin,
      positiveGuardPassed,
      negativeGuardPassed,
      allJobStatesUnchanged,
      matrixGuardPassed,
      stateChecks,
      interpretation: "Controlled shadow calibration only. Similarity is a human-review signal and does not establish copyright ownership or infringement.",
      warnings,
    }));

    if (!matrixGuardPassed) process.exitCode = 2;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
