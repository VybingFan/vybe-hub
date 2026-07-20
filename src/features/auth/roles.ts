import { z } from "zod";

export const APP_ROLES = ["creator", "supporter", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Creator access is invitation-only. Public signups may only self-enroll as supporters. */
export const SELECTABLE_ROLES = ["supporter"] as const;
export type SelectableRole = (typeof SELECTABLE_ROLES)[number];

export const emailSchema = z.string().trim().email({ message: "Enter a valid email" }).max(255);

export const passwordSchema = z
  .string()
  .min(8, { message: "At least 8 characters" })
  .max(72, { message: "Password too long" });

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, { message: "At least 2 characters" })
  .max(60, { message: "Keep it under 60 characters" });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }).max(72),
  rememberMe: z.boolean().default(true),
});

export const signUpSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ password: passwordSchema });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Landing route per role. */
export const DEFAULT_ROUTE_FOR_ROLE: Record<AppRole, string> = {
  creator: "/dashboard",
  supporter: "/discover",
  admin: "/admin",
};

/** Which roles are allowed to view each protected surface. */
export const ROUTE_ROLE_ACCESS = {
  dashboard: ["creator", "admin"],
  discover: ["supporter", "creator", "admin"],
  admin: ["admin"],
  settings: ["creator", "supporter", "admin"],
} satisfies Record<string, AppRole[]>;
