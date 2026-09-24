import { createContext, useContext } from 'react'
import type { SessionValue } from './GameSession'

export const SessionContext = createContext<SessionValue | null>(null)

export function useGameSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('GameSession is missing')
  return value
}
