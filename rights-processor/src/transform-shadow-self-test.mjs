import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const AUDIO_BUCKET = "music-audio";
const TEST_VERSION = "v24.76d4-transform-shadow-self-test";
const SIMILARITY_THRESHOLD = 0.90;
const SAMPLE_RATE = 48000;
const MIN_UNIQUE_FRAME_RATIO = 0.12;
const SEARCH_FACTORS = [0.97, 0.975, 0.98, 0.985, 0.99, 0.995, 1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseJobId() {
  const flagIndex = process.argv.indexOf("--job-id");
  const inline = process.argv.find((arg) => arg.startsWith("--job-id="));
  const value = inline?.slice("--job-id=".length) || (flagIndex >= 0 ? process.argv[flagIndex + 1] : "");
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Shadow mode requires --job-id <uuid>. It never claims the processing queue.");
  }
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

async function renderAndFingerprint(inputPath, outputPath, mode, factor, warnings, label) {
  const filter = mode === "rate"
    ? `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE}`
    : `asetrate=${SAMPLE_RATE}*${factor},aresample=${SAMPLE_RATE},atempo=${(1 / factor).toFixed(8)}`;
  await run("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-map", "0:a:0", "-filter:a", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath]);
  const fp = await rawChromaprint(outputPath);
  if (fp.warning) warnings.push(`${label}: ${fp.warning}`);
  return fp.values;
}

async function main() {
  const jobId = parseJobId();
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const warnings = [];

  const { data: job, error: jobError } = await supabase.from("audio_processing_jobs").select("id,track_id,creator_id,status,attempt_count,processor_version").eq("id", jobId).single();
  if (jobError) throw jobError;
  const originalJobState = { status: job.status, attemptCount: job.attempt_count, processorVersion: job.processor_version };

  const { data: track, error: trackError } = await supabase.from("tracks").select("id,creator_id,title,audio_url,status,visibility,duration_sec").eq("id", job.track_id).single();
  if (trackError) throw trackError;
  if (!track?.audio_url) throw new Error("Selected track has no private audio storage path");
  if (track.creator_id !== job.creator_id) throw new Error("Processing job creator does not match track creator");

  const { data: candidates, error: candidatesError } = await supabase.rpc("get_audio_similarity_candidates", { source_track_id: track.id, duration_tolerance: 0.10 });
  if (candidatesError) throw candidatesError;

  let workDir;
  try {
    workDir = await mkdtemp(join(tmpdir(), "vybe-transform-shadow-"));
    const sourcePath = join(workDir, "source.mp3");
    const { data: sourceBlob, error: downloadError } = await supabase.storage.from(AUDIO_BUCKET).download(track.audio_url);
    if (downloadError) throw downloadError;
    const sourceBytes = Buffer.from(await sourceBlob.arrayBuffer());
    if (!sourceBytes.length) throw new Error("Selected source audio is empty");
    await writeFile(sourcePath, sourceBytes);

    const sourceFp = await rawChromaprint(sourcePath);
    if (sourceFp.warning) warnings.push(`source: ${sourceFp.warning}`);
    const sourceQuality = fingerprintQuality(sourceFp.values);

    const transformedSources = [];
    if (sourceQuality.transformEligible) {
      for (const mode of ["rate", "pitch"]) {
        for (const factor of SEARCH_FACTORS) {
          const outputPath = join(workDir, `source-${mode}-${String(factor).replace(".", "_")}.mp3`);
          const values = await renderAndFingerprint(sourcePath, outputPath, mode, factor, warnings, `source/${mode}/${factor}`);
          transformedSources.push({ mode, factor, values });
        }
      }
    }

    const evaluations = [];
    for (const candidate of candidates || []) {
      const candidateRaw = String(candidate.raw_fingerprint || "").split(",").filter(Boolean).map(Number);
      if (!candidateRaw.length || candidateRaw.some((value) => !Number.isInteger(value))) {
        evaluations.push({ candidateTrackId: candidate.candidate_track_id, skipped: true, reason: "missing_or_invalid_raw_fingerprint" });
        continue;
      }
      const candidateQuality = fingerprintQuality(candidateRaw);
      const direct = bestSlidingSimilarity(sourceFp.values, candidateRaw);
      let best = { score: direct.score, mode: "direct", factor: 1, offset: direct.offset, compared: direct.compared };
      let transformsEvaluated = 0;
      if (sourceQuality.transformEligible && candidateQuality.transformEligible) {
        for (const transformed of transformedSources) {
          transformsEvaluated += 1;
          const result = bestSlidingSimilarity(transformed.values, candidateRaw);
          if (result.score > best.score) best = { score: result.score, mode: transformed.mode, factor: transformed.factor, offset: result.offset, compared: result.compared };
        }
      }
      evaluations.push({
        candidateTrackId: candidate.candidate_track_id,
        skipped: false,
        candidateQuality,
        directSimilarityScore: Number(direct.score.toFixed(6)),
        shadowBestSimilarityScore: Number(best.score.toFixed(6)),
        shadowBestMode: best.mode,
        shadowBestFactor: best.factor,
        shadowBestOffset: best.offset,
        comparedFrames: best.compared,
        transformsEvaluated,
        directWouldMatch: direct.score >= SIMILARITY_THRESHOLD,
        shadowWouldMatch: sourceQuality.transformEligible && candidateQuality.transformEligible && best.score >= SIMILARITY_THRESHOLD,
      });
    }

    const { data: jobAfter, error: jobAfterError } = await supabase.from("audio_processing_jobs").select("status,attempt_count,processor_version").eq("id", jobId).single();
    if (jobAfterError) throw jobAfterError;
    const jobStateUnchanged = jobAfter.status === originalJobState.status && jobAfter.attempt_count === originalJobState.attemptCount && jobAfter.processor_version === originalJobState.processorVersion;
    if (!jobStateUnchanged) throw new Error("Shadow safety check failed: selected processing job changed during read-only evaluation");

    const directMatches = evaluations.filter((item) => !item.skipped && item.directWouldMatch).length;
    const shadowMatches = evaluations.filter((item) => !item.skipped && item.shadowWouldMatch).length;
    const newlyRecoveredByShadow = evaluations.filter((item) => !item.skipped && !item.directWouldMatch && item.shadowWouldMatch).length;

    console.log(JSON.stringify({
      ok: true,
      testVersion: TEST_VERSION,
      mode: "shadow_read_only",
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
      selectedJob: {
        jobId: job.id,
        trackId: track.id,
        title: track.title,
        status: originalJobState.status,
        attemptCount: originalJobState.attemptCount,
        processorVersion: originalJobState.processorVersion,
        jobStateUnchanged,
      },
      sourceQuality,
      candidateCount: (candidates || []).length,
      evaluatedCandidateCount: evaluations.filter((item) => !item.skipped).length,
      directMatches,
      shadowMatches,
      newlyRecoveredByShadow,
      evaluations,
      interpretation: "Similarity is a review signal only. Shadow output does not establish copyright ownership or infringement.",
      warnings,
    }));
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
