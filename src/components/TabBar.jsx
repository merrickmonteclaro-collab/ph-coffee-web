import { Link, useLocation } from 'react-router-dom'
import styles from './TabBar.module.css'
import { getToken } from '../utils/auth'

const TABS = [
  { path: '/', label: 'Home', icon: '🗺️' },
  { path: '/map', label: 'Map', icon: '📍' },
  { path: '/favorites', label: 'Favorites', icon: '🤍' },
  { path: '/suggest', label: 'Suggest', icon: '💡' },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const isLoggedIn = !!getToken()
  const allTabs = [...TABS, isLoggedIn
    ? { path: '/account', label: 'Account', icon: '👤' }
    : { path: '/auth', label: 'Log In', icon: '👤' }
  ]
  return (
    <nav className={styles.tabBar}>
      {allTabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={styles.tab + ' ' + (pathname === tab.path ? styles.active : '')}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
