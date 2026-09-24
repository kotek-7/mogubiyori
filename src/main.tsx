import './app/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { AuthGate } from './features/auth/AuthGate'
import { GameSession } from './app/game/GameSession'
import { router } from './app/router'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        {(gateway) => (
          <GameSession key={gateway.identity} gateway={gateway}>
            <RouterProvider router={router} />
          </GameSession>
        )}
      </AuthGate>
    </QueryClientProvider>
  </StrictMode>,
)
