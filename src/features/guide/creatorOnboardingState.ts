export type CreatorOnboardingState = {
  status: "offered" | "active" | "paused" | "completed";
  step: number;
  mode?: "setup" | "review";
};

const LEGACY_STATE_KEY = "vybe:creator-onboarding-v2";
const LEGACY_LAUNCH_KEY = "vybe:creator-onboarding-launch-v2";

function stateKey(userId: string) {
  return `${LEGACY_STATE_KEY}:${userId}`;
}

function launchKey(userId: string) {
  return `${LEGACY_LAUNCH_KEY}:${userId}`;
}

function parseState(raw: string | null): CreatorOnboardingState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CreatorOnboardingState;
    if (
      ["offered", "active", "paused", "completed"].includes(parsed.status) &&
      Number.isInteger(parsed.step)
    ) return parsed;
  } catch {}
  return null;
}

export function readCreatorOnboardingState(userId: string): CreatorOnboardingState {
  const scoped = parseState(window.localStorage.getItem(stateKey(userId)));
  if (scoped) return scoped;

  const legacy = parseState(window.localStorage.getItem(LEGACY_STATE_KEY));
  if (legacy) {
    window.localStorage.setItem(stateKey(userId), JSON.stringify(legacy));
    return legacy;
  }

  return { status: "completed", step: 0, mode: "setup" };
}

export function saveCreatorOnboardingState(userId: string, state: CreatorOnboardingState) {
  window.localStorage.setItem(stateKey(userId), JSON.stringify(state));
}

export function requestCreatorOnboardingLaunch(userId?: string) {
  const offered: CreatorOnboardingState = { status: "offered", step: 0, mode: "setup" };
  if (userId) {
    saveCreatorOnboardingState(userId, offered);
    window.localStorage.setItem(launchKey(userId), "1");
    return;
  }
  window.localStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(offered));
  window.localStorage.setItem(LEGACY_LAUNCH_KEY, "1");
}

export function consumeCreatorOnboardingLaunch(userId: string): boolean {
  const scopedKey = launchKey(userId);
  if (window.localStorage.getItem(scopedKey)) {
    window.localStorage.removeItem(scopedKey);
    return true;
  }
  if (window.localStorage.getItem(LEGACY_LAUNCH_KEY)) {
    window.localStorage.removeItem(LEGACY_LAUNCH_KEY);
    return true;
  }
  return false;
}
