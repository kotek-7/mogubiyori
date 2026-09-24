import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import App from './App'
import { RoomPage } from '../features/room/RoomPage'

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
  component: lazyRouteComponent(() => import('../features/album/AlbumPage'), 'AlbumPage'),
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
  routeTree: rootRoute.addChildren([room, book, album, shop, callback]),
  defaultPreload: 'intent',
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
