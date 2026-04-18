import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Activity, BarChart3, LayoutDashboard, UploadCloud } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle.jsx'
import Button from '../ui/Button.jsx'
import { getUserName, isAuthenticated, logoutUser } from '../../utils/auth.js'

const navItems = [
  { to: '/', label: 'Beyond', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Resume', icon: UploadCloud },
  { to: '/results', label: 'Dashboard', icon: BarChart3 },
  { to: '/progress', label: 'Progress', icon: Activity },
]

const protectedPaths = ['/upload', '/results', '/progress', '/interview']

export default function Sidebar() {
  const navigate = useNavigate()
  const displayName = getUserName()

  function handleNavClick(to, e) {
    if (protectedPaths.includes(to) && !isAuthenticated()) {
      e.preventDefault()
      navigate('/auth')
    }
  }

  function handleLogout() {
    logoutUser()
    navigate('/auth')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div className="border-b border-white/10 px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_14px_2px_rgba(232,121,249,0.8)]" />
          <span className="text-base font-bold text-text-primary">Beyond</span>
        </Link>
        {isAuthenticated() ? (
          <p className="mt-2 text-xs text-text-secondary">
            Welcome, <span className="text-text-primary">{displayName || 'Guest'}</span>
          </p>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={(e) => handleNavClick(to, e)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-300 ${
                isActive
                  ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-text-secondary hover:bg-white/6 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0 opacity-90" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col gap-2 border-t border-white/10 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/login"
            className="rounded-lg border border-border/80 px-3 py-2 text-xs font-medium text-text-secondary transition duration-300 hover:border-fuchsia-400/40 hover:text-text-primary"
          >
            Sign In
          </Link>
          <ThemeToggle />
        </div>
        {isAuthenticated() ? (
          <Button type="button" variant="secondary" className="w-full text-xs" onClick={handleLogout}>
            Log out
          </Button>
        ) : null}
      </div>
    </aside>
  )
}
