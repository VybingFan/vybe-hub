import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const TEST_VERSION = "v24.76d9-repeatability-stability-validation";
const SOURCE_TEST = "src/broader-shadow-catalog-observation-self-test.mjs";
const REPEAT_COUNT = 3;
const RUN_TIMEOUT_MS = 10 * 60 * 1000;
const OUTPUT_LIMIT_BYTES = 8 * 1024 * 1024;

function runOnce(iteration) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SOURCE_TEST], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let bytes = 0;
    let settled = false;
    let timedOut = false;
    let outputExceeded = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, RUN_TIMEOUT_MS);

    const append = (which, chunk) => {
      bytes += chunk.length;
      if (bytes > OUTPUT_LIMIT_BYTES) {
        outputExceeded = true;
        child.kill("SIGKILL");
        return;
      }
      if (which === "stdout") stdout += chunk.toString();
      else stderr += chunk.toString();
    };

    child.stdout.on("data", c => append("stdout", c));
    child.stderr.on("data", c => append("stderr", c));
    child.on("error", err => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (outputExceeded) return reject(new Error(`repeat ${iteration} exceeded output limit`));
      if (timedOut) return reject(new Error(`repeat ${iteration} exceeded ${RUN_TIMEOUT_MS} ms`));
      if (code !== 0) return reject(new Error(`repeat ${iteration} exited ${code}: ${stderr.slice(-2000)}`));

      const lines = stdout.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      let parsed = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const candidate = JSON.parse(lines[i]);
          if (candidate && typeof candidate === "object") { parsed = candidate; break; }
        } catch {}
      }
      if (!parsed) return reject(new Error(`repeat ${iteration} did not emit a JSON result`));
      if (parsed.ok !== true) return reject(new Error(`repeat ${iteration} reported ok != true`));
      resolve({ iteration, parsed, stderr });
    });
  });
}

function normalize(value, key = "") {
  if (Array.isArray(value)) return value.map(v => normalize(v));
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      if (/warning/i.test(k)) continue;
      out[k] = normalize(value[k], k);
    }
    return out;
  }
  if (typeof value === "number" && Number.isFinite(value)) return Number(value.toFixed(12));
  return value;
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const runs = [];
for (let i = 1; i <= REPEAT_COUNT; i++) runs.push(await runOnce(i));

const normalized = runs.map(r => normalize(r.parsed));
const hashes = normalized.map(hash);
const baseline = JSON.stringify(normalized[0]);
const stable = normalized.every(v => JSON.stringify(v) === baseline);

const result = {
  ok: stable,
  testVersion: TEST_VERSION,
  mode: "controlled_read_only_repeatability_validation",
  sourceHarness: SOURCE_TEST,
  repeatCount: REPEAT_COUNT,
  semanticComparison: "full D8 JSON result normalized for object-key order, numeric precision to 12 decimals, and warning fields",
  stable,
  runHashes: hashes,
  allRunsReportedPass: runs.every(r => r.parsed.ok === true),
  sourceTestVersions: runs.map(r => r.parsed.testVersion ?? null),
  safeguards: {
    databaseWrites: false,
    jobClaims: false,
    jobRequeues: false,
    similarityMatchWrites: false,
    moderationCases: false,
    creatorStatusChanges: false,
    queueProcessing: false,
    sourceHarnessAlreadyVerifiesParticipatingJobStatePreservation: true
  },
  interpretation: stable
    ? "PASS: three independent executions of the existing D8 read-only validation produced the same normalized semantic result while each D8 run independently passed its own safety/state checks."
    : "FAIL: repeated D8 executions did not produce identical normalized semantic results. Review differences before closing V24.76.",
  limitations: [
    "This validates repeatability only for the controlled D8 sample and current runtime/environment.",
    "It does not establish copyright ownership, infringement, catalog-wide accuracy, or enforcement readiness.",
    "It does not authorize broad queue processing or automatic rights actions."
  ]
};

console.log(JSON.stringify(result));
if (!stable) process.exitCode = 1;
