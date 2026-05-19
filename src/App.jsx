import { Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import MapPage from './pages/MapPage'
import SuggestPage from './pages/SuggestPage'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', paddingBottom: 'var(--tab-height)' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/suggest" element={<SuggestPage />} />
      </Routes>
      <TabBar />
    </div>
  )
}
