interface SessionUser {
  id: string
  email: string
  tenantId: string | null
  rol: string | null
  nombre?: string
  tenant?: any
  profile?: any
  memberships?: any[]
}

class SessionManager {
  private tabId: string
  private readonly TAB_SESSION_KEY = 'seedor_tab_session'
  private readonly TAB_ID_KEY = 'seedor_tab_id'

  constructor() {
    this.tabId = this.generateTabId()
  }

  private generateTabId(): string {
    if (typeof window !== 'undefined') {
      let tabId = sessionStorage.getItem(this.TAB_ID_KEY)
      if (!tabId) {
        tabId = crypto.randomUUID()
        sessionStorage.setItem(this.TAB_ID_KEY, tabId)
      }
      return tabId
    }
    return crypto.randomUUID()
  }

  getTabId(): string {
    return this.tabId
  }

  setCurrentUser(user: SessionUser, accessToken?: string): void {
    if (typeof window === 'undefined') return

    const sessionData = {
      user,
      accessToken,
      lastActivity: Date.now(),
      tabId: this.tabId
    }

    sessionStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(sessionData))
  }

  getCurrentUser(): SessionUser | null {
    if (typeof window === 'undefined') return null

    try {
      const sessionData = sessionStorage.getItem(this.TAB_SESSION_KEY)
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)
      
      // Update last activity
      parsed.lastActivity = Date.now()
      sessionStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(parsed))
      
      return parsed.user
    } catch (error) {
      return null
    }
  }

  peekCurrentUser(): SessionUser | null {
    if (typeof window === 'undefined') return null

    try {
      const sessionData = sessionStorage.getItem(this.TAB_SESSION_KEY)
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)
      return parsed.user
    } catch (error) {
      return null
    }
  }

  clearCurrentTabSession(): void {
    if (typeof window === 'undefined') return

    sessionStorage.removeItem(this.TAB_SESSION_KEY)
    sessionStorage.removeItem(this.TAB_ID_KEY)
  }

  async logoutCurrentTab(): Promise<void> {
    this.clearCurrentTabSession()
  }

  isSessionValid(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const sessionData = sessionStorage.getItem(this.TAB_SESSION_KEY)
      if (!sessionData) return false

      const parsed = JSON.parse(sessionData)
      const now = Date.now()
      const lastActivity = parsed.lastActivity || 0
      
      // Session expires after 24 hours of inactivity
      const SESSION_TIMEOUT = 24 * 60 * 60 * 1000
      
      return (now - lastActivity) < SESSION_TIMEOUT
    } catch (error) {
      return false
    }
  }
}

let sessionManagerInstance: SessionManager | null = null

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager()
  }
  return sessionManagerInstance
}

export type { SessionUser }
