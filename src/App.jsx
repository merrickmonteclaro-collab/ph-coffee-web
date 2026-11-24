import { useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import TabBar from './components/TabBar'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import SuggestPage from './pages/SuggestPage'
import AuthPage from './pages/AuthPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  // HomePage stays mounted once it has been shown, and is only hidden while
  // another page is open. That keeps the map, shop list, filters and sheet
  // position intact when the user goes to a shop or Favorites and back. It is
  // not mounted before the first visit, so deep links to other pages don't
  // trigger its location prompt or data fetches.
  const homeShown = useRef(onHome)
  if (onHome) homeShown.current = true

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative', paddingBottom: 'var(--tab-height)' }}>
      {homeShown.current && (
        <div style={{ display: onHome ? 'block' : 'none' }}>
          <HomePage active={onHome} />
        </div>
      )}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
        <Route path="/suggest" element={<SuggestPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
      <TabBar />
    </div>
  )
}
