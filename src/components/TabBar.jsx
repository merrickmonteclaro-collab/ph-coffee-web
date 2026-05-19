import { Link, useLocation } from 'react-router-dom'
import styles from './TabBar.module.css'

const TABS = [
  { path: '/', label: 'Home', icon: '☕' },
  { path: '/map', label: 'Map', icon: '🗺️' },
  { path: '/suggest', label: 'Suggest', icon: '💡' },
]

export default function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`${styles.tab} ${pathname === tab.path ? styles.active : ''}`}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
