import { Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import SuggestPage from './pages/SuggestPage'
import AuthPage from './pages/AuthPage'
import AccountPage from './pages/AccountPage'
import FavoritesPage from './pages/FavoritesPage'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', paddingBottom: 'var(--tab-height)' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
        <Route path="/suggest" element={<SuggestPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
      <TabBar />
    </div>
  )
}
