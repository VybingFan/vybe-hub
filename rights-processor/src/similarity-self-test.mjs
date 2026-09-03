import { createClient } from "@supabase/supabase-js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const AUDIO_BUCKET = "music-audio";
const TEST_VERSION = "v24.76b0-self-test";
const SIMILARITY_THRESHOLD = 0.90;

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
    throw new Error("Self-test requires --job-id <uuid>.");
  }
  return value;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exited ${code}: ${stderr.slice(-1500)}`)));
  });
}

function runWithExitCode(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

async function rawChromaprint(filePath) {
  const result = await runWithExitCode("fpcalc", ["-raw", "-json", filePath]);
  let parsed;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    throw new Error(`fpcalc raw returned invalid JSON${result.code === 0 ? "" : ` (exit ${result.code})`}: ${result.stderr.slice(-1500)}`);
  }
  if (!parsed.fingerprint) {
    throw new Error(`fpcalc raw did not return a fingerprint${result.code === 0 ? "" : ` (exit ${result.code}: ${result.stderr.slice(-1500)})`}`);
  }
  const values = Array.isArray(parsed.fingerprint)
    ? parsed.fingerprint.map(Number)
    : String(parsed.fingerprint).split(",").filter(Boolean).map(Number);
  if (!values.length || values.some((value) => !Number.isInteger(value))) {
    throw new Error("Raw Chromaprint was not a valid integer sequence");
  }
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

async function main() {
  const jobId = parseJobId();
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: job, error: jobError } = await supabase
    .from("audio_processing_jobs")
    .select("id,track_id,creator_id,status")
    .eq("id", jobId)
    .single();
  if (jobError) throw jobError;

  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("id,creator_id,audio_url,title")
    .eq("id", job.track_id)
    .single();
  if (trackError) throw trackError;
  if (!track?.audio_url) throw new Error("Track has no private audio storage path");
  if (track.creator_id !== job.creator_id) throw new Error("Job creator does not match track creator");

  let workDir;
  try {
    const { data: audioBlob, error: downloadError } = await supabase.storage.from(AUDIO_BUCKET).download(track.audio_url);
    if (downloadError) throw downloadError;
    const bytes = Buffer.from(await audioBlob.arrayBuffer());
    if (!bytes.length) throw new Error("Downloaded audio is empty");

    workDir = await mkdtemp(join(tmpdir(), "vybe-similarity-self-test-"));
    const originalPath = join(workDir, "original.mp3");
    const reencodedPath = join(workDir, "reencoded.mp3");
    await writeFile(originalPath, bytes);

    await run("ffmpeg", ["-v", "error", "-y", "-i", originalPath, "-map", "0:a:0", "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "2", reencodedPath]);

    const [original, reencoded] = await Promise.all([rawChromaprint(originalPath), rawChromaprint(reencodedPath)]);
    const result = fingerprintSimilarity(original.values, reencoded.values);
    const rounded = Number(result.score.toFixed(6));

    console.log(JSON.stringify({
      ok: true,
      testVersion: TEST_VERSION,
      jobId,
      trackId: track.id,
      title: track.title,
      sourceJobStatus: job.status,
      mutationPerformed: false,
      reencode: { codec: "mp3", bitrate: "128k", sampleRate: 44100, channels: 2 },
      originalFingerprintFrames: original.values.length,
      reencodedFingerprintFrames: reencoded.values.length,
      similarityScore: rounded,
      threshold: SIMILARITY_THRESHOLD,
      wouldMatch: rounded >= SIMILARITY_THRESHOLD,
      bestOffset: result.offset,
      comparedFrames: result.compared,
      warnings: [original.warning, reencoded.warning].filter(Boolean),
    }));
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
