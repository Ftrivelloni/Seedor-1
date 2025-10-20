import { getSessionManager } from "../sessionManager";

export const isDemoModeClient = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  if ((window as any).__SEEDOR_DEMO_ACTIVE) {
    return true;
  }

  try {
    const sessionManager = getSessionManager();
    const user = sessionManager.peekCurrentUser();
    if (user && (user as any).isDemo) {
      (window as any).__SEEDOR_DEMO_ACTIVE = true;
      return true;
    }
  } catch {
    // ignore
  }

  return false;
};
