import { Link, useLocation } from 'react-router-dom'
import styles from './TabBar.module.css'

// Account / Log In lives in the Home page header now (next to the country
// picker), matching the mobile app, so it's no longer a tab.
const TABS = [
  { path: '/', label: 'Home' },
  { path: '/favorites', label: 'Favorites' },
  { path: '/suggest', label: 'Suggest' },
]

export default function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => {
        const active = pathname === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={styles.tab + ' ' + (active ? styles.active : '')}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
