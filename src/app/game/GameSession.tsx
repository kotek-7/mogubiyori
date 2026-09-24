import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GameCommand } from '../../../shared/game/commands'
import type { GameSnapshot } from '../../../shared/game/contracts'
import { createOperationId } from '../../lib/operationId'
import type { DemoCommand, GameGateway } from './gameGateway'
import { chooseLatestSnapshot } from './gameSnapshot'
import { SessionContext } from './useGameSession'

function useSession(gateway: GameGateway) {
  const client = useQueryClient()
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
    onSuccess: (result) => publish(result.snapshot),
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
    onSuccess: publish,
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
