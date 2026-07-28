import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("VYBE Creator service worker registration failed", error);
    });
  }, []);

  return null;
}
