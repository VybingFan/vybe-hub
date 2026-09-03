import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const WORKER_VERSION = process.env.VYBE_RIGHTS_PROCESSOR_VERSION || "v24.76b2";
const AUDIO_BUCKET = "music-audio";
const SIMILARITY_THRESHOLD = 0.90;

function positiveIntegerFromEnv(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

const PROCESS_TIMEOUT_MS = positiveIntegerFromEnv("VYBE_RIGHTS_PROCESS_TIMEOUT_MS", 120000);
const PROCESS_OUTPUT_LIMIT_BYTES = positiveIntegerFromEnv("VYBE_RIGHTS_PROCESS_OUTPUT_LIMIT_BYTES", 4 * 1024 * 1024);
const MAX_AUDIO_BYTES = positiveIntegerFromEnv("VYBE_RIGHTS_MAX_AUDIO_BYTES", 250 * 1024 * 1024);

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

function run(command, args) {
  return runProcess(command, args);
}

function runWithExitCode(command, args) {
  return runProcess(command, args, { acceptNonZero: true });
}

async function assertBinary(command, args) { await run(command, args); }

async function doctor() {
  required("SUPABASE_URL");
  required("SUPABASE_SERVICE_ROLE_KEY");
  await assertBinary("ffprobe", ["-version"]);
  await assertBinary("fpcalc", ["-version"]);
  console.log(JSON.stringify({
    ok: true,
    workerVersion: WORKER_VERSION,
    ffprobe: true,
    chromaprint: true,
    similarityThreshold: SIMILARITY_THRESHOLD,
    processTimeoutMs: PROCESS_TIMEOUT_MS,
    processOutputLimitBytes: PROCESS_OUTPUT_LIMIT_BYTES,
    maxAudioBytes: MAX_AUDIO_BYTES,
  }));
}

function parseJobId() {
  const flagIndex = process.argv.indexOf("--job-id");
  const inline = process.argv.find((arg) => arg.startsWith("--job-id="));
  const value = inline?.slice("--job-id=".length) || (flagIndex >= 0 ? process.argv[flagIndex + 1] : "");
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Controlled mode requires --job-id <uuid>. The worker will not automatically claim the queue.");
  }
  return value;
}

async function probe(filePath) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration,bit_rate,format_name:stream=sample_rate:format_tags=title,artist,album,ISRC,UPC", "-of", "json", filePath]);
  const parsed = JSON.parse(stdout || "{}");
  const format = parsed.format || {};
  const audioStream = Array.isArray(parsed.streams) ? parsed.streams.find((stream) => stream.sample_rate) : null;
  const tags = format.tags || {};
  return {
    duration: Number(format.duration || 0) || null,
    bitrate: Number(format.bit_rate || 0) || null,
    sampleRate: Number(audioStream?.sample_rate || 0) || null,
    fileType: String(format.format_name || "").split(",")[0] || null,
    metadata: { title: tags.title || null, artist: tags.artist || null, album: tags.album || null, isrc: tags.ISRC || tags.isrc || null, upc: tags.UPC || tags.upc || null },
  };
}

async function chromaprint(filePath) {
  const encoded = await runWithExitCode("fpcalc", ["-json", filePath]);
  const raw = await runWithExitCode("fpcalc", ["-raw", "-json", filePath]);
  let parsed;
  let rawParsed;
  try { parsed = JSON.parse(encoded.stdout || "{}"); } catch { throw new Error(`fpcalc returned invalid JSON${encoded.code === 0 ? "" : ` (exit ${encoded.code})`}: ${encoded.stderr.slice(-1500)}`); }
  try { rawParsed = JSON.parse(raw.stdout || "{}"); } catch { throw new Error(`fpcalc raw returned invalid JSON${raw.code === 0 ? "" : ` (exit ${raw.code})`}: ${raw.stderr.slice(-1500)}`); }
  if (!parsed.fingerprint) throw new Error(`Chromaprint did not return a fingerprint${encoded.code === 0 ? "" : ` (fpcalc exit ${encoded.code}: ${encoded.stderr.slice(-1500)})`}`);
  if (!rawParsed.fingerprint) throw new Error(`Chromaprint did not return a raw fingerprint${raw.code === 0 ? "" : ` (fpcalc raw exit ${raw.code}: ${raw.stderr.slice(-1500)})`}`);
  const rawFingerprint = Array.isArray(rawParsed.fingerprint) ? rawParsed.fingerprint.map(Number) : String(rawParsed.fingerprint).split(",").filter(Boolean).map(Number);
  if (!rawFingerprint.length || rawFingerprint.some((value) => !Number.isInteger(value))) throw new Error("Chromaprint raw fingerprint was not a valid integer sequence");
  const warnings = [encoded, raw].filter((result) => result.code !== 0).map((result) => result.stderr.trim()).filter(Boolean);
  if (warnings.length) console.warn(`fpcalc returned valid fingerprints with warning: ${warnings.join(" | ").slice(-1500)}`);
  return { fingerprint: String(parsed.fingerprint), rawFingerprint, algorithm: Number(parsed.algorithm || rawParsed.algorithm || 1) || 1, warning: warnings.length ? warnings.join(" | ").slice(-1500) : null };
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
  if (!a.length || !b.length) return 0;
  const maxOffset = Math.min(12, Math.max(0, Math.abs(a.length - b.length) + 4));
  let best = 0;
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
    if (score > best) best = score;
  }
  return Math.max(0, Math.min(1, best));
}

async function recordSimilarityMatches(supabase, trackId, rawFingerprint) {
  const { data: candidates, error: candidatesError } = await supabase.rpc("get_audio_similarity_candidates", { source_track_id: trackId, duration_tolerance: 0.10 });
  if (candidatesError) throw candidatesError;
  const matches = [];
  for (const candidate of candidates || []) {
    const candidateRaw = String(candidate.raw_fingerprint || "").split(",").filter(Boolean).map(Number);
    if (!candidateRaw.length || candidateRaw.some((value) => !Number.isInteger(value))) continue;
    const score = fingerprintSimilarity(rawFingerprint, candidateRaw);
    if (score < SIMILARITY_THRESHOLD) continue;
    const rounded = Number(score.toFixed(6));
    const { data: matchId, error: matchError } = await supabase.rpc("record_audio_similarity_match", { source_track_id: trackId, candidate_track_id: candidate.candidate_track_id, similarity_score: rounded, worker_version: WORKER_VERSION });
    if (matchError) throw matchError;
    matches.push({ candidateTrackId: candidate.candidate_track_id, score: rounded, matchId });
  }
  return matches;
}

async function recordFailure(supabase, jobId, message, fingerprintCompleted) {
  const rpcName = fingerprintCompleted ? "fail_audio_post_processing_job" : "fail_audio_processing_job";
  const args = fingerprintCompleted
    ? { target_job_id: jobId, failure: message, worker_version: WORKER_VERSION }
    : { target_job_id: jobId, failure: message };
  const { error } = await supabase.rpc(rpcName, args);
  if (error) console.error(`Could not record ${fingerprintCompleted ? "post-processing" : "processing"} failure: ${error.message}`);
}

async function main() {
  if (process.argv.includes("--doctor")) return doctor();
  const jobId = parseJobId();
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claimedRows, error: claimError } = await supabase.rpc("claim_audio_processing_job_by_id", { target_job_id: jobId, worker_version: WORKER_VERSION });
  if (claimError) throw claimError;
  const job = claimedRows?.[0];
  if (!job) throw new Error("The selected job was not queued or could not be claimed. No other job was touched.");

  let workDir;
  let fingerprintCompleted = false;
  try {
    const { data: track, error: trackError } = await supabase.from("tracks").select("id,creator_id,audio_url,title").eq("id", job.track_id).single();
    if (trackError) throw trackError;
    if (!track?.audio_url) throw new Error("Track has no private audio storage path");
    if (track.creator_id !== job.creator_id) throw new Error("Processing job creator does not match track creator");

    const { data: audioBlob, error: downloadError } = await supabase.storage.from(AUDIO_BUCKET).download(track.audio_url);
    if (downloadError) throw downloadError;
    if (audioBlob.size > MAX_AUDIO_BYTES) throw new Error(`Downloaded audio is ${audioBlob.size} bytes, exceeding the ${MAX_AUDIO_BYTES}-byte processing limit`);
    const bytes = Buffer.from(await audioBlob.arrayBuffer());
    if (!bytes.length) throw new Error("Downloaded audio is empty");

    workDir = await mkdtemp(join(tmpdir(), "vybe-rights-"));
    const audioPath = join(workDir, "source-audio");
    await writeFile(audioPath, bytes);
    const [measured, fp] = await Promise.all([probe(audioPath), chromaprint(audioPath)]);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const metadata = { ...measured.metadata, chromaprint_raw: fp.rawFingerprint.join(",") };

    const { error: completeError } = await supabase.rpc("complete_audio_processing_job", {
      target_job_id: job.id,
      file_sha256: sha256,
      audio_chromaprint: fp.fingerprint,
      audio_chromaprint_algorithm: fp.algorithm,
      measured_duration: measured.duration,
      measured_sample_rate: measured.sampleRate,
      measured_bitrate: measured.bitrate,
      measured_file_type: measured.fileType,
      embedded_metadata: metadata,
      worker_version: WORKER_VERSION,
    });
    if (completeError) throw completeError;
    fingerprintCompleted = true;

    const similarityMatches = await recordSimilarityMatches(supabase, job.track_id, fp.rawFingerprint);
    console.log(JSON.stringify({ ok: true, jobId: job.id, trackId: job.track_id, title: track.title, workerVersion: WORKER_VERSION, chromaprintWarning: fp.warning, similarityMatches }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordFailure(supabase, job.id, message, fingerprintCompleted);
    throw error;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : error); process.exitCode = 1; });
