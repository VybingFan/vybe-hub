import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const CREATOR_MANIFEST = "/manifest.webmanifest";
const BACK_OFFICE_MANIFEST = "/back-office.webmanifest";
const CREATOR_ICON = "/pwa/icon-192-v24-38.png";
const BACK_OFFICE_ICON = "/pwa/back-office/icon-192.png";

function upsertMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

export function BackOfficePwaIdentity() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const isBackOffice = pathname.startsWith("/operations") || pathname.startsWith("/admin");

    let manifest = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement("link");
      manifest.rel = "manifest";
      document.head.appendChild(manifest);
    }

    let appleIcon = document.head.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }

    if (isBackOffice) {
      manifest.href = BACK_OFFICE_MANIFEST;
      appleIcon.href = BACK_OFFICE_ICON;
      upsertMeta("application-name", "VYBE Back Office");
      upsertMeta("apple-mobile-web-app-title", "VYBE Back Office");
      upsertMeta("theme-color", "#08070d");
      document.title = "VYBE Back Office";
    } else {
      manifest.href = CREATOR_MANIFEST;
      appleIcon.href = CREATOR_ICON;
      upsertMeta("application-name", "VYBE Creator");
      upsertMeta("apple-mobile-web-app-title", "VYBE Creator");
    }
  }, [pathname]);

  return null;
}
