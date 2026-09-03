const DEFAULT_MAX_AUDIO_BYTES = 250 * 1024 * 1024;

function positiveIntegerFromEnv(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

const maxAudioBytes = positiveIntegerFromEnv("VYBE_RIGHTS_MAX_AUDIO_BYTES", DEFAULT_MAX_AUDIO_BYTES);

function assertAudioSize(size) {
  if (!Number.isSafeInteger(size) || size < 0) throw new Error("Audio size must be a non-negative safe integer");
  if (size > maxAudioBytes) throw new Error(`Downloaded audio is ${size} bytes, exceeding the ${maxAudioBytes}-byte processing limit`);
  return true;
}

const allowedSize = maxAudioBytes;
const rejectedSize = maxAudioBytes + 1;

let allowedAtLimit = false;
let rejectedOverLimit = false;
let rejectionMessage = null;

try {
  allowedAtLimit = assertAudioSize(allowedSize) === true;
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
}

try {
  assertAudioSize(rejectedSize);
} catch (error) {
  rejectedOverLimit = true;
  rejectionMessage = error instanceof Error ? error.message : String(error);
}

if (!allowedAtLimit || !rejectedOverLimit) {
  console.error(JSON.stringify({
    ok: false,
    testVersion: "v24.76b2-limits-self-test",
    mutationPerformed: false,
    maxAudioBytes,
    allowedAtLimit,
    rejectedOverLimit,
    rejectionMessage,
  }));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  testVersion: "v24.76b2-limits-self-test",
  mutationPerformed: false,
  maxAudioBytes,
  allowedSize,
  rejectedSize,
  allowedAtLimit,
  rejectedOverLimit,
  rejectionMessage,
}));
