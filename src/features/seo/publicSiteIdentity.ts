import { createMiddleware } from "@tanstack/react-start";

export type PublicSiteIdentity = "supporters" | "creators" | "business";

const CREATOR_HOST = "creators.vybewithvybe.com";
const BUSINESS_HOST = "businessads.vybewithvybe.com";

function identityForHost(host: string): PublicSiteIdentity {
  const hostname = host.toLowerCase().split(":")[0];
  if (hostname === CREATOR_HOST) return "creators";
  if (hostname === BUSINESS_HOST) return "business";
  return "supporters";
}

export const publicSiteIdentityMiddleware = createMiddleware({ type: "request" }).server(
  async ({ request, next }) => {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host") || new URL(request.url).host;
    return next({ context: { publicSiteIdentity: identityForHost(host) } });
  },
);
