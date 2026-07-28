import { createContext, useContext } from "react";

export interface PwaInstallContextValue {
  canInstall: boolean;
  isIos: boolean;
  install: () => Promise<void>;
}

export const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined);

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  return context;
}
