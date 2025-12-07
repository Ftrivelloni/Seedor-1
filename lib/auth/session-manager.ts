import { SessionUser } from './types';

const SESSION_KEY = 'seedor_tab_session';
const TAB_ID_KEY = 'seedor_tab_id';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getTabId(): string {
  if (typeof window === 'undefined') return '';

  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

interface StoredSession {
  user: SessionUser;
  timestamp: number;
  tabId: string;
}

class SessionManager {
  private listeners: Set<() => void> = new Set();

  getCurrentUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const session: StoredSession = JSON.parse(stored);

      // Check if session has expired
      if (Date.now() - session.timestamp > SESSION_TIMEOUT_MS) {
        this.clearCurrentTabSession();
        return null;
      }

      return session.user;
    } catch {
      return null;
    }
  }

  /**
   * Alias for getCurrentUser - does not refresh timestamp
   * Used for checking session without side effects
   */
  peekCurrentUser(): SessionUser | null {
    return this.getCurrentUser();
  }

  setCurrentUser(user: SessionUser): void {
    if (typeof window === 'undefined') return;

    const session: StoredSession = {
      user,
      timestamp: Date.now(),
      tabId: getTabId(),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Notify listeners
    this.notifyListeners();

    // Dispatch custom event for cross-component communication
    window.dispatchEvent(new CustomEvent('seedor:session-updated'));
  }

  clearCurrentTabSession(): void {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TAB_ID_KEY);

    // Notify listeners
    this.notifyListeners();

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('seedor:session-updated'));
  }

  updateUserPartial(updates: Partial<SessionUser>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    this.setCurrentUser({
      ...currentUser,
      ...updates,
    });
  }

  refreshTimestamp(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return;

      const session: StoredSession = JSON.parse(stored);
      session.timestamp = Date.now();

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore errors
    }
  }

  getSessionAge(): number | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const session: StoredSession = JSON.parse(stored);
      return Date.now() - session.timestamp;
    } catch {
      return null;
    }
  }

  isSessionExpired(): boolean {
    const age = this.getSessionAge();
    if (age === null) return true;
    return age > SESSION_TIMEOUT_MS;
  }

  // Subscribe to session changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    });
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export default sessionManager;
