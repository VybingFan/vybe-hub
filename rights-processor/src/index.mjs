import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const WORKER_VERSION = process.env.VYBE_RIGHTS_PROCESSOR_VERSION || "v24.76a1";
const AUDIO_BUCKET = "music-audio";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
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

async function assertBinary(command, args) {
  await run(command, args);
}

async function doctor() {
  required("SUPABASE_URL");
  required("SUPABASE_SERVICE_ROLE_KEY");
  await assertBinary("ffprobe", ["-version"]);
  await assertBinary("fpcalc", ["-version"]);
  console.log(JSON.stringify({ ok: true, workerVersion: WORKER_VERSION, ffprobe: true, chromaprint: true }));
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
    metadata: {
      title: tags.title || null,
      artist: tags.artist || null,
      album: tags.album || null,
      isrc: tags.ISRC || tags.isrc || null,
      upc: tags.UPC || tags.upc || null,
    },
  };
}

async function chromaprint(filePath) {
  const { code, stdout, stderr } = await runWithExitCode("fpcalc", ["-json", filePath]);
  let parsed;
  try {
    parsed = JSON.parse(stdout || "{}");
  } catch {
    throw new Error(`fpcalc returned invalid JSON${code === 0 ? "" : ` (exit ${code})`}: ${stderr.slice(-1500)}`);
  }
  if (!parsed.fingerprint) {
    throw new Error(`Chromaprint did not return a fingerprint${code === 0 ? "" : ` (fpcalc exit ${code}: ${stderr.slice(-1500)})`}`);
  }
  if (code !== 0) {
    console.warn(`fpcalc exited ${code} after returning a valid fingerprint; accepting fingerprint. Warning: ${stderr.trim().slice(-1500)}`);
  }
  return { fingerprint: String(parsed.fingerprint), algorithm: Number(parsed.algorithm || 1) || 1, warning: code === 0 ? null : stderr.trim() || `fpcalc exited ${code}` };
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
  try {
    const { data: track, error: trackError } = await supabase.from("tracks").select("id,creator_id,audio_url,title").eq("id", job.track_id).single();
    if (trackError) throw trackError;
    if (!track?.audio_url) throw new Error("Track has no private audio storage path");
    if (track.creator_id !== job.creator_id) throw new Error("Processing job creator does not match track creator");

    const { data: audioBlob, error: downloadError } = await supabase.storage.from(AUDIO_BUCKET).download(track.audio_url);
    if (downloadError) throw downloadError;
    const bytes = Buffer.from(await audioBlob.arrayBuffer());
    if (!bytes.length) throw new Error("Downloaded audio is empty");

    workDir = await mkdtemp(join(tmpdir(), "vybe-rights-"));
    const audioPath = join(workDir, "source-audio");
    await writeFile(audioPath, bytes);
    const [measured, fp] = await Promise.all([probe(audioPath), chromaprint(audioPath)]);
    const sha256 = createHash("sha256").update(await readFile(audioPath)).digest("hex");

    const { error: completeError } = await supabase.rpc("complete_audio_processing_job", {
      target_job_id: job.id,
      file_sha256: sha256,
      audio_chromaprint: fp.fingerprint,
      audio_chromaprint_algorithm: fp.algorithm,
      measured_duration: measured.duration,
      measured_sample_rate: measured.sampleRate,
      measured_bitrate: measured.bitrate,
      measured_file_type: measured.fileType,
      embedded_metadata: measured.metadata,
      worker_version: WORKER_VERSION,
    });
    if (completeError) throw completeError;
    console.log(JSON.stringify({ ok: true, jobId: job.id, trackId: job.track_id, title: track.title, workerVersion: WORKER_VERSION, chromaprintWarning: fp.warning }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const { error: failError } = await supabase.rpc("fail_audio_processing_job", { target_job_id: job.id, failure: message });
    if (failError) console.error(`Could not record failed job: ${failError.message}`);
    throw error;
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
