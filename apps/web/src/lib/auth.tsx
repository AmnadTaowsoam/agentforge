'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SessionState {
  token: string | null
  userId: string | null
  workspaceId: string | null
  role: string | null
}

interface SessionContextValue extends SessionState {
  login: (token: string, userId: string, workspaceId: string, role: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

const TOKEN_KEY = 'agentforge_token'
const USER_ID_KEY = 'agentforge_userId'
const WORKSPACE_ID_KEY = 'agentforge_workspaceId'
const ROLE_KEY = 'agentforge_role'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    token: null,
    userId: null,
    workspaceId: null,
    role: null,
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userId = localStorage.getItem(USER_ID_KEY)
    const workspaceId = localStorage.getItem(WORKSPACE_ID_KEY)
    const role = localStorage.getItem(ROLE_KEY)
    if (token && userId && workspaceId) {
      setSession({ token, userId, workspaceId, role })
    }
  }, [])

  const login = useCallback(
    (token: string, userId: string, workspaceId: string, role: string) => {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_ID_KEY, userId)
      localStorage.setItem(WORKSPACE_ID_KEY, workspaceId)
      localStorage.setItem(ROLE_KEY, role)
      setSession({ token, userId, workspaceId, role })
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(WORKSPACE_ID_KEY)
    localStorage.removeItem(ROLE_KEY)
    setSession({ token: null, userId: null, workspaceId: null, role: null })
    router.push('/login')
  }, [router])

  const value: SessionContextValue = {
    ...session,
    login,
    logout,
    isAuthenticated: !!session.token,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
