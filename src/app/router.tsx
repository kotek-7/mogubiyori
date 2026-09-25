import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import App from './App'
import { RoomPage } from '../features/room/RoomPage'
import { transitionView } from '../ui/journey/journeyTransition'
import { mealDaySchema } from '../../shared/meals/schemas'
import type { MealHistorySearch } from './gameUi'

function mealHistorySearch(search: Record<string, unknown>): MealHistorySearch {
  const day = mealDaySchema.safeParse(search.day)
  const end = mealDaySchema.safeParse(search.end)
  return {
    ...(day.success ? { day: day.data } : {}),
    ...(end.success ? { end: end.data } : {}),
  }
}

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: () => (
    <main className="p-8 text-center">
      <h1>ページが見つかりません</h1>
      <a href="/">ひろばへ</a>
    </main>
  ),
  errorComponent: ({ reset }) => (
    <main className="p-8 text-center">
      <h1>画面を開けませんでした</h1>
      <button onClick={reset}>もう一度試す</button>
    </main>
  ),
})
const room = createRoute({ getParentRoute: () => rootRoute, path: '/', component: RoomPage })
const book = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book',
  component: lazyRouteComponent(() => import('../features/collection/BookPage'), 'BookPage'),
})
const album = createRoute({
  getParentRoute: () => rootRoute,
  path: '/album',
  validateSearch: mealHistorySearch,
  component: lazyRouteComponent(() => import('../features/album/AlbumPage'), 'AlbumPage'),
})
const reports = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  validateSearch: mealHistorySearch,
  component: lazyRouteComponent(() => import('../features/nutrition/ReportsPage'), 'ReportsPage'),
})
const shop = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shop',
  component: lazyRouteComponent(() => import('../features/shop/ShopPage'), 'ShopPage'),
})
const callback = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
})

/** Preserve saved prototype links while using regular paths for all new navigation. */
export function migrateLegacyLocation() {
  const page = window.location.hash.slice(1)
  if (window.location.pathname === '/' && ['room', 'book', 'album', 'shop'].includes(page))
    window.history.replaceState(null, '', page === 'room' ? '/' : `/${page}`)
}

migrateLegacyLocation()
export const router = createRouter({
  routeTree: rootRoute.addChildren([room, album, reports, book, shop, callback]),
  defaultPreload: 'intent',
})

// Use the router's commit hook so lazy routes are ready before taking snapshots.
// Its default implementation only observes updateCallbackDone; a superseded
// transition's ready promise must also be handled during rapid/history navigation.
router.startViewTransition = (update) => {
  const enabled = router.shouldViewTransition !== false
  router.shouldViewTransition = undefined
  const from = router.state.resolvedLocation
  const to = router.latestLocation
  if (
    !enabled ||
    !from ||
    from.pathname === to.pathname ||
    document.querySelector('.journey-screen, dialog[open]')
  )
    return update()
  const pages = ['/', '/album', '/reports', '/book', '/shop']
  const direction =
    pages.indexOf(to.pathname) > pages.indexOf(from.pathname) ? 'forward' : 'backward'
  return transitionView(update, ['page', direction])
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
