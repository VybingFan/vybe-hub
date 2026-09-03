import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import {
  createTransformShadowContext,
  fingerprintQuality,
  TRANSFORM_MIN_UNIQUE_FRAME_RATIO,
  TRANSFORM_SEARCH_FACTORS,
  TRANSFORM_SHADOW_THRESHOLD,
  TRANSFORM_SHADOW_VERSION,
  TRANSFORM_SAMPLE_RATE,
} from "./shadow-transform-matcher.mjs";

const AUDIO_BUCKET = "music-audio";
const TEST_VERSION = "v24.76d7-broader-read-only-shadow-validation";
const PROCESS_TIMEOUT_MS = positiveIntegerFromEnv("VYBE_RIGHTS_PROCESS_TIMEOUT_MS", 120000);
const PROCESS_OUTPUT_LIMIT_BYTES = positiveIntegerFromEnv("VYBE_RIGHTS_PROCESS_OUTPUT_LIMIT_BYTES", 4 * 1024 * 1024);
const MAX_AUDIO_BYTES = positiveIntegerFromEnv("VYBE_RIGHTS_MAX_AUDIO_BYTES", 250 * 1024 * 1024);

const REFERENCE = {
  trackId: "61748911-72b4-4a1c-a641-d045a228252f",
  jobId: "c47ab672-a2ee-4d04-9051-ab2e3dc2723d",
  expectedTitle: "Vybe Theme 1-2",
  expectedJobStatus: "flagged",
  expectedAttemptCount: 3,
  expectedProcessorVersion: "v24.76b0",
};

const DISTINCT_TRACK_CONTROLS = [
  { trackId: "7bc3ce5b-a381-4935-9ab7-bd1680ff1010", jobId: "27345aff-e546-469f-b433-3bd7bee4f06a", expectedTitle: "This That", expectedJobStatus: "skipped", expectedAttemptCount: 0, expectedProcessorVersion: null },
  { trackId: "89e39506-e6b7-4241-9959-c36d5da59442", jobId: "508e6f19-cebb-4e02-a8e9-e42a08e307a9", expectedTitle: "Poppa", expectedJobStatus: "skipped", expectedAttemptCount: 0, expectedProcessorVersion: null },
  { trackId: "162ac4d1-c66c-4a9d-9c26-998ac9f05f31", jobId: "8b761e82-50f8-4e6f-afcf-68db4c4b2163", expectedTitle: "Soul Bleed", expectedJobStatus: "skipped", expectedAttemptCount: 0, expectedProcessorVersion: null },
  { trackId: "0279d8c9-7b4a-491a-b01d-02c9af93fcf1", jobId: "9792eb10-e26c-4397-87b5-adeb2a57d568", expectedTitle: "DIfferent - Nomix", expectedJobStatus: "skipped", expectedAttemptCount: 0, expectedProcessorVersion: null },
  { trackId: "2dcdd1a7-9446-47b5-923f-2a29b5314eca", jobId: "bef41698-9809-479c-928d-de2c30b2735f", expectedTitle: "Black Woman", expectedJobStatus: "skipped", expectedAttemptCount: 0, expectedProcessorVersion: null },
  { trackId: "77983d0c-277d-4c44-afee-e16a3abe7711", jobId: "c71f2f38-6874-448f-90e3-10ed262db638", expectedTitle: "Resume", expectedJobStatus: "completed", expectedAttemptCount: 4, expectedProcessorVersion: "v24.76d6d" },
  { trackId: "4982bec3-8f69-4100-940a-5ccedb921490", jobId: "f423cdf3-d313-41d8-ac0e-349222796a3b", expectedTitle: "Yng Brizy - Lavar Ball ", expectedJobStatus: "completed", expectedAttemptCount: 2, expectedProcessorVersion: "v24.76d6" },
];

const POSITIVE_VARIANTS = [
  { name: "speed_plus_2pct", filter: `asetrate=${TRANSFORM_SAMPLE_RATE}*1.02,aresample=${TRANSFORM_SAMPLE_RATE}` },
  { name: "speed_minus_2pct", filter: `asetrate=${TRANSFORM_SAMPLE_RATE}*0.98,aresample=${TRANSFORM_SAMPLE_RATE}` },
  { name: "pitch_plus_1pct", filter: `asetrate=${TRANSFORM_SAMPLE_RATE}*1.01,aresample=${TRANSFORM_SAMPLE_RATE},atempo=0.99009901` },
];

function positiveIntegerFromEnv(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function runProcess(command, args, { acceptNonZero = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let settled = false;
    let timedOut = false;
    let outputExceeded = false;

    const finishReject = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };
    const finishResolve = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const append = (streamName, chunk) => {
      if (settled) return;
      outputBytes += chunk.length;
      if (outputBytes > PROCESS_OUTPUT_LIMIT_BYTES) {
        outputExceeded = true;
        child.kill("SIGKILL");
        return;
      }
      if (streamName === "stdout") stdout += chunk.toString();
      else stderr += chunk.toString();
    };

    child.stdout.on("data", (chunk) => append("stdout", chunk));
    child.stderr.on("data", (chunk) => append("stderr", chunk));
    child.on("error", finishReject);

    const timer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      child.kill("SIGKILL");
    }, PROCESS_TIMEOUT_MS);

    child.on("close", (code, signal) => {
      if (outputExceeded) return finishReject(new Error(`${command} exceeded ${PROCESS_OUTPUT_LIMIT_BYTES} bytes of output and was terminated`));
      if (timedOut) return finishReject(new Error(`${command} exceeded ${PROCESS_TIMEOUT_MS} ms and was terminated`));
      const result = { code: code ?? -1, signal: signal || null, stdout, stderr };
      if (acceptNonZero || code === 0) return finishResolve(result);
      return finishReject(new Error(`${command} exited ${code}${signal ? ` (${signal})` : ""}: ${stderr.slice(-1500)}`));
    });
  });
}

async function rawChromaprint(filePath) {
  const result = await runProcess("fpcalc", ["-raw", "-json", filePath], { acceptNonZero: true });
  let parsed;
  try { parsed = JSON.parse(result.stdout || "{}"); }
  catch { throw new Error(`fpcalc raw returned invalid JSON: ${result.stderr.slice(-1500)}`); }
  if (!parsed.fingerprint) throw new Error(`fpcalc raw did not return a fingerprint${result.code === 0 ? "" : ` (exit ${result.code}: ${result.stderr.slice(-1500)})`}`);
  const values = Array.isArray(parsed.fingerprint)
    ? parsed.fingerprint.map(Number)
    : String(parsed.fingerprint).split(",").filter(Boolean).map(Number);
  if (!values.length || values.some((value) => !Number.isInteger(value))) throw new Error("Raw Chromaprint was not a valid integer sequence");
  return { values, warning: result.code === 0 ? null : result.stderr.trim() || `fpcalc exited ${result.code}` };
}

async function loadTrackAndJob(supabase, spec) {
  const { data: job, error: jobError } = await supabase.from("audio_processing_jobs")
    .select("id,track_id,creator_id,status,attempt_count,processor_version")
    .eq("id", spec.jobId).single();
  if (jobError) throw jobError;
  const { data: track, error: trackError } = await supabase.from("tracks")
    .select("id,creator_id,title,audio_url,status,visibility,duration_sec,rights_basis,rights_confirmed")
    .eq("id", spec.trackId).single();
  if (trackError) throw trackError;
  if (job.track_id !== track.id) throw new Error(`Safety precondition failed for ${spec.expectedTitle}: job/track mismatch`);
  if (job.creator_id !== track.creator_id) throw new Error(`Safety precondition failed for ${spec.expectedTitle}: creator mismatch`);
  if (track.title !== spec.expectedTitle) throw new Error(`Safety precondition failed for ${spec.trackId}: title changed`);
  if (job.status !== spec.expectedJobStatus || job.attempt_count !== spec.expectedAttemptCount || job.processor_version !== spec.expectedProcessorVersion) {
    throw new Error(`Safety precondition failed for ${track.title}: job state changed`);
  }
  if (!track.audio_url) throw new Error(`Track ${track.title} has no private audio storage path`);
  return {
    spec, job, track,
    initialState: { status: job.status, attemptCount: job.attempt_count, processorVersion: job.processor_version },
  };
}

async function downloadAudioAndFingerprint(supabase, entry, workDir, label, warnings) {
  const { data: blob, error } = await supabase.storage.from(AUDIO_BUCKET).download(entry.track.audio_url);
  if (error) throw error;
  if (blob.size > MAX_AUDIO_BYTES) throw new Error(`${entry.track.title} is ${blob.size} bytes, exceeding the ${MAX_AUDIO_BYTES}-byte validation limit`);
  const bytes = Buffer.from(await blob.arrayBuffer());
  if (!bytes.length) throw new Error(`${entry.track.title} downloaded as an empty object`);
  const path = join(workDir, `${label}.audio`);
  await writeFile(path, bytes);
  const fp = await rawChromaprint(path);
  if (fp.warning) warnings.push(`${label}: ${fp.warning}`);
  return { path, bytes: bytes.length, values: fp.values, quality: fingerprintQuality(fp.values) };
}

async function renderPositive(referencePath, outputPath, filter) {
  await runProcess("ffmpeg", ["-v", "error", "-y", "-i", referencePath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  return rawChromaprint(outputPath);
}

async function verifyStatesUnchanged(supabase, entries) {
  const checks = [];
  for (const entry of entries) {
    const { data: after, error } = await supabase.from("audio_processing_jobs")
      .select("status,attempt_count,processor_version").eq("id", entry.job.id).single();
    if (error) throw error;
    checks.push({
      jobId: entry.job.id,
      trackId: entry.track.id,
      title: entry.track.title,
      before: entry.initialState,
      after: { status: after.status, attemptCount: after.attempt_count, processorVersion: after.processor_version },
      unchanged: after.status === entry.initialState.status
        && after.attempt_count === entry.initialState.attemptCount
        && after.processor_version === entry.initialState.processorVersion,
    });
  }
  return checks;
}

async function main() {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const warnings = [];
  const referenceEntry = await loadTrackAndJob(supabase, REFERENCE);
  const controls = [];
  for (const spec of DISTINCT_TRACK_CONTROLS) controls.push(await loadTrackAndJob(supabase, spec));
  const allEntries = [referenceEntry, ...controls];

  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-d7-shadow-validation-"));
    const reference = await downloadAudioAndFingerprint(supabase, referenceEntry, workDir, "reference", warnings);
    if (!reference.quality.transformEligible) throw new Error("Reference failed the shared production transform quality gate");

    const shadowContext = await createTransformShadowContext({
      sourcePath: reference.path,
      sourceRawFingerprint: reference.values,
      workDir,
      runProcess,
    });
    warnings.push(...shadowContext.warnings);

    const positives = [];
    for (const variant of POSITIVE_VARIANTS) {
      const outputPath = join(workDir, `positive-${variant.name}.mp3`);
      const fp = await renderPositive(reference.path, outputPath, variant.filter);
      if (fp.warning) warnings.push(`positive/${variant.name}: ${fp.warning}`);
      const evaluation = shadowContext.evaluateCandidate(fp.values);
      positives.push({
        name: variant.name,
        quality: fingerprintQuality(fp.values),
        ...evaluation,
        expectedMatch: true,
        matched: evaluation.shadowWouldMatch,
      });
    }

    const distinctTrackObservations = [];
    const qualityGateExclusions = [];
    for (let i = 0; i < controls.length; i += 1) {
      const entry = controls[i];
      const fp = await downloadAudioAndFingerprint(supabase, entry, workDir, `control-${i}`, warnings);
      const evaluation = shadowContext.evaluateCandidate(fp.values);
      const observation = {
        trackId: entry.track.id,
        jobId: entry.job.id,
        title: entry.track.title,
        sourceJobStatus: entry.job.status,
        sourceAttemptCount: entry.job.attempt_count,
        sourceProcessorVersion: entry.job.processor_version,
        trackStatus: entry.track.status,
        visibility: entry.track.visibility,
        durationSec: entry.track.duration_sec,
        rightsBasis: entry.track.rights_basis,
        rightsConfirmed: entry.track.rights_confirmed,
        downloadedBytes: fp.bytes,
        ...evaluation,
        expectedMatch: false,
        matched: evaluation.shadowWouldMatch,
        interpretation: "Selected distinct-track observation only; not proof that the works are musically unrelated and not a copyright determination.",
      };
      distinctTrackObservations.push(observation);
      if (!evaluation.candidateQuality.transformEligible) {
        qualityGateExclusions.push({ trackId: entry.track.id, title: entry.track.title, quality: evaluation.candidateQuality });
      }
    }

    const stateChecks = await verifyStatesUnchanged(supabase, allEntries);
    const positiveFailures = positives.filter((item) => !item.matched);
    const distinctTrackThresholdCrossings = distinctTrackObservations.filter((item) => item.matched);
    const stateMutations = stateChecks.filter((item) => !item.unchanged);

    const pass = positiveFailures.length === 0
      && distinctTrackThresholdCrossings.length === 0
      && stateMutations.length === 0;

    console.log(JSON.stringify({
      ok: pass,
      testVersion: TEST_VERSION,
      mode: "controlled_read_only",
      matcher: {
        version: TRANSFORM_SHADOW_VERSION,
        threshold: TRANSFORM_SHADOW_THRESHOLD,
        minUniqueFrameRatio: TRANSFORM_MIN_UNIQUE_FRAME_RATIO,
        searchFactors: TRANSFORM_SEARCH_FACTORS,
        implementation: "shared_production_shadow_transform_matcher",
      },
      operationalSafeguards: {
        processTimeoutMs: PROCESS_TIMEOUT_MS,
        processOutputLimitBytes: PROCESS_OUTPUT_LIMIT_BYTES,
        maxAudioBytes: MAX_AUDIO_BYTES,
      },
      safety: {
        databaseWrites: false,
        jobClaims: false,
        jobRequeues: false,
        similarityMatchWrites: false,
        moderationCases: false,
        creatorStatusChanges: false,
        excludedQueuedTrackIds: ["c2721d9d-b502-4016-8863-d19fbc77b8a7"],
        excludedQueuedTrackTitles: ["Take It  - nomix"],
      },
      reference: {
        trackId: referenceEntry.track.id,
        jobId: referenceEntry.job.id,
        title: referenceEntry.track.title,
        quality: reference.quality,
      },
      positiveTransformRecovery: positives,
      selectedDistinctTrackObservations: distinctTrackObservations,
      qualityGateExclusions,
      stateMutationChecks: stateChecks,
      summary: {
        positiveCount: positives.length,
        positiveFailures: positiveFailures.length,
        distinctTrackCount: distinctTrackObservations.length,
        distinctTrackThresholdCrossings: distinctTrackThresholdCrossings.length,
        qualityGateExclusions: qualityGateExclusions.length,
        stateMutationFailures: stateMutations.length,
      },
      warnings,
      interpretation: "PASS means the current shared production shadow matcher behaved as expected on this limited controlled set. It does not establish copyright ownership, infringement, catalog-wide accuracy, or readiness for enforcement.",
    }));

    if (!pass) process.exitCode = 1;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
