import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GameCommand } from '../../../shared/game/commands'
import type { GameSnapshot } from '../../../shared/game/contracts'
import { LOGIN_BONUS } from '../../../shared/game/game'
import { createOperationId } from '../../lib/operationId'
import type { DemoCommand, GameGateway } from './gameGateway'
import { chooseLatestSnapshot } from './gameSnapshot'
import { SessionContext } from './useGameSession'

function useSession(gateway: GameGateway) {
  const client = useQueryClient()
  const [loginBonus, setLoginBonus] = useState<{ day: string; amount: number } | null>(null)
  const announcedLoginDays = useRef(new Set<string>())
  const dismissLoginBonus = useCallback(() => setLoginBonus(null), [])
  const key = ['game', gateway.identity] as const
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => gateway.load(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
    structuralSharing: chooseLatestSnapshot,
  })
  const publish = useCallback(
    (snapshot: GameSnapshot) => {
      client.setQueryData<GameSnapshot>(['game', gateway.identity], (current) =>
        chooseLatestSnapshot(current, snapshot),
      )
    },
    [client, gateway.identity],
  )
  const mutation = useMutation({
    mutationKey: ['game-command', gateway.identity],
    scope: { id: gateway.identity },
    retry: false,
    mutationFn: async ({ command, operationId }: { command: GameCommand; operationId: string }) => {
      await client.cancelQueries({ queryKey: key })
      return gateway.execute(command, operationId)
    },
    onSuccess: (result, { command }) => {
      publish(result.snapshot)
      if (command.type === 'resetProgress' || command.type === 'debugReset') {
        announcedLoginDays.current.clear()
        setLoginBonus(null)
      }
      if (command.type !== 'claimLogin') return
      const { state } = result.snapshot
      // Celebrate the saved claim, including a successful retry, never an optimistic balance.
      if (
        state.activeId &&
        state.claimedLoginDays.includes(state.today) &&
        !announcedLoginDays.current.has(state.today)
      ) {
        announcedLoginDays.current.add(state.today)
        setLoginBonus({ day: state.today, amount: LOGIN_BONUS })
      }
    },
  })
  const { mutateAsync } = mutation
  const execute = useCallback(
    (command: GameCommand, operationId = createOperationId()) =>
      mutateAsync({ command, operationId }),
    [mutateAsync],
  )
  const demoMutation = useMutation({
    mutationKey: ['game-demo', gateway.identity],
    scope: { id: gateway.identity },
    retry: false,
    mutationFn: async (command: DemoCommand) => {
      await client.cancelQueries({ queryKey: key })
      if (!gateway.demo) throw new Error('この操作はローカル体験でのみ使えます。')
      return gateway.demo(command)
    },
    onSuccess: (snapshot, command) => {
      publish(snapshot)
      if (command.type === 'reset') {
        announcedLoginDays.current.clear()
        setLoginBonus(null)
      }
    },
  })
  const state = query.data?.state
  const loginAttempt = useRef('')
  useEffect(() => {
    if (!state?.activeId || state.claimedLoginDays.includes(state.today)) {
      loginAttempt.current = ''
      return
    }
    const attempt = `${state.activeId}:${state.today}`
    if (loginAttempt.current === attempt) return
    loginAttempt.current = attempt
    void execute({ type: 'claimLogin' }).catch(() => {
      if (loginAttempt.current === attempt) loginAttempt.current = ''
    })
  }, [state?.activeId, state?.today, state?.claimedLoginDays, query.dataUpdatedAt, execute])
  useEffect(() => {
    if (gateway.mode !== 'local') return
    const sync = () => void client.invalidateQueries({ queryKey: ['game', gateway.identity] })
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [client, gateway])
  return {
    state,
    loginBonus: loginBonus?.day === state?.today ? loginBonus : null,
    dismissLoginBonus,
    gateway,
    query,
    execute,
    demo: demoMutation.mutateAsync,
    busy: mutation.isPending || demoMutation.isPending,
    error: mutation.error ?? demoMutation.error ?? query.error,
    dismissError: () => {
      mutation.reset()
      demoMutation.reset()
    },
    retry: () => {
      if (mutation.error && mutation.variables)
        void mutation.mutateAsync(mutation.variables).catch(() => undefined)
      else if (demoMutation.error && demoMutation.variables)
        void demoMutation.mutateAsync(demoMutation.variables).catch(() => undefined)
      else void query.refetch()
    },
  }
}

export type SessionValue = ReturnType<typeof useSession> & {
  state: NonNullable<ReturnType<typeof useSession>['state']>
}

export function GameSession({ gateway, children }: { gateway: GameGateway; children: ReactNode }) {
  const session = useSession(gateway)
  if (!session.state)
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
        {session.query.isPending ? (
          <p role="status">記録を読み込んでいます</p>
        ) : (
          <>
            <h1>記録を読み込めませんでした</h1>
            <p role="alert">{session.error?.message}</p>
            <button className="primary-button" onClick={() => void session.query.refetch()}>
              もう一度読み込む
            </button>
          </>
        )}
      </main>
    )
  return <SessionContext value={{ ...session, state: session.state }}>{children}</SessionContext>
}
