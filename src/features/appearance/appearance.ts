export type AppearanceChoice =
  | "vybe-dark"
  | "vybe-light"
  | "midnight-blue"
  | "warm-stage";

export const APPEARANCE_STORAGE_KEY = "vybe:appearance-choice";
export const EXTRA_APPEARANCE_STORAGE_KEY = "vybe:appearance-extra";

export const APPEARANCE_OPTIONS: Array<{
  code: AppearanceChoice;
  label: string;
  description: string;
  preview: { background: string; surface: string; primary: string; text: string };
}> = [
  {
    code: "vybe-dark",
    label: "VYBE Dark",
    description: "The original dark VYBE experience.",
    preview: {
      background: "#090611",
      surface: "#171124",
      primary: "#a855f7",
      text: "#f8f4ff",
    },
  },
  {
    code: "vybe-light",
    label: "VYBE Light",
    description: "The original light VYBE experience.",
    preview: {
      background: "#f8f6fc",
      surface: "#ffffff",
      primary: "#7c3aed",
      text: "#21172e",
    },
  },
  {
    code: "midnight-blue",
    label: "Midnight Blue",
    description: "Deep blue surfaces with cyan and violet accents.",
    preview: {
      background: "#07111f",
      surface: "#10233a",
      primary: "#38bdf8",
      text: "#eff8ff",
    },
  },
  {
    code: "warm-stage",
    label: "Warm Stage",
    description: "Warm dark surfaces with orange and gold accents.",
    preview: {
      background: "#17100d",
      surface: "#2a1c17",
      primary: "#f97316",
      text: "#fff7ed",
    },
  },
];

const EXTRA_THEME_VARS: Record<
  Extract<AppearanceChoice, "midnight-blue" | "warm-stage">,
  Record<string, string>
> = {
  "midnight-blue": {
    "--background": "#07111f",
    "--foreground": "#eff8ff",
    "--surface": "#10233a",
    "--surface-elevated": "#172e49",
    "--card": "#10233a",
    "--card-foreground": "#eff8ff",
    "--popover": "#172e49",
    "--popover-foreground": "#eff8ff",
    "--primary": "#38bdf8",
    "--primary-foreground": "#06111e",
    "--primary-glow": "#8b5cf6",
    "--secondary": "#8b5cf6",
    "--secondary-foreground": "#ffffff",
    "--muted": "#172e49",
    "--muted-foreground": "#a9c2d8",
    "--accent": "#8b5cf6",
    "--accent-foreground": "#ffffff",
    "--border": "#25415e",
    "--input": "#25415e",
    "--ring": "#38bdf8",
    "--sidebar": "#081827",
    "--sidebar-foreground": "#eff8ff",
    "--sidebar-primary": "#38bdf8",
    "--sidebar-primary-foreground": "#06111e",
    "--sidebar-accent": "#172e49",
    "--sidebar-accent-foreground": "#eff8ff",
    "--sidebar-border": "#25415e",
    "--sidebar-ring": "#38bdf8",
    "--gradient-brand": "linear-gradient(135deg, #38bdf8, #8b5cf6)",
    "--shadow-glow": "0 20px 60px -20px rgb(56 189 248 / .42)",
  },
  "warm-stage": {
    "--background": "#17100d",
    "--foreground": "#fff7ed",
    "--surface": "#2a1c17",
    "--surface-elevated": "#38251d",
    "--card": "#2a1c17",
    "--card-foreground": "#fff7ed",
    "--popover": "#38251d",
    "--popover-foreground": "#fff7ed",
    "--primary": "#f97316",
    "--primary-foreground": "#ffffff",
    "--primary-glow": "#eab308",
    "--secondary": "#eab308",
    "--secondary-foreground": "#17100d",
    "--muted": "#38251d",
    "--muted-foreground": "#d9bbaa",
    "--accent": "#eab308",
    "--accent-foreground": "#17100d",
    "--border": "#513327",
    "--input": "#513327",
    "--ring": "#f97316",
    "--sidebar": "#1d130f",
    "--sidebar-foreground": "#fff7ed",
    "--sidebar-primary": "#f97316",
    "--sidebar-primary-foreground": "#ffffff",
    "--sidebar-accent": "#38251d",
    "--sidebar-accent-foreground": "#fff7ed",
    "--sidebar-border": "#513327",
    "--sidebar-ring": "#f97316",
    "--gradient-brand": "linear-gradient(135deg, #f97316, #eab308)",
    "--shadow-glow": "0 20px 60px -20px rgb(249 115 22 / .4)",
  },
};

const EXTRA_VAR_NAMES = Array.from(
  new Set(Object.values(EXTRA_THEME_VARS).flatMap((vars) => Object.keys(vars))),
);

export function isAppearanceChoice(value: unknown): value is AppearanceChoice {
  return APPEARANCE_OPTIONS.some((option) => option.code === value);
}

export function readStoredAppearanceChoice(): AppearanceChoice {
  if (typeof window === "undefined") return "vybe-dark";

  const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (isAppearanceChoice(stored)) return stored;

  const legacyExtra = window.localStorage.getItem(EXTRA_APPEARANCE_STORAGE_KEY);
  if (legacyExtra === "midnight-blue" || legacyExtra === "warm-stage") {
    return legacyExtra;
  }

  return window.localStorage.getItem("vybe:theme") === "light"
    ? "vybe-light"
    : "vybe-dark";
}

export function applyAppearanceChoice(choice: AppearanceChoice) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  for (const name of EXTRA_VAR_NAMES) root.style.removeProperty(name);
  delete root.dataset.appearance;

  if (choice === "vybe-light" || choice === "vybe-dark") {
    const light = choice === "vybe-light";
    root.classList.toggle("light", light);
    root.classList.toggle("dark", !light);
    root.style.colorScheme = light ? "light" : "dark";
    return;
  }

  // Extra palettes use the dark structural mode, then replace the semantic
  // VYBE variables directly so every compatible surface changes immediately.
  root.classList.remove("light");
  root.classList.add("dark");
  root.style.colorScheme = "dark";
  root.dataset.appearance = choice;

  for (const [name, value] of Object.entries(EXTRA_THEME_VARS[choice])) {
    root.style.setProperty(name, value);
  }
}

export function storeAppearanceChoice(choice: AppearanceChoice) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, choice);

  if (choice === "vybe-light") {
    window.localStorage.setItem("vybe:theme", "light");
    window.localStorage.removeItem(EXTRA_APPEARANCE_STORAGE_KEY);
  } else if (choice === "vybe-dark") {
    window.localStorage.setItem("vybe:theme", "dark");
    window.localStorage.removeItem(EXTRA_APPEARANCE_STORAGE_KEY);
  } else {
    window.localStorage.setItem("vybe:theme", "dark");
    window.localStorage.setItem(EXTRA_APPEARANCE_STORAGE_KEY, choice);
  }
}
