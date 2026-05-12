import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.brand}>☕ PH Coffee Crawler</Link>
      <div className={styles.links}>
        <Link to="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>Shops</Link>
        <Link to="/map" className={`${styles.link} ${pathname === '/map' ? styles.active : ''}`}>Map</Link>
        <Link to="/suggest" className={`${styles.link} ${pathname === '/suggest' ? styles.active : ''}`}>Suggest a Shop</Link>
      </div>
    </nav>
  )
}
