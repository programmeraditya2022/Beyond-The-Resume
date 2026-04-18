import { MoonStar, Sun } from 'lucide-react'
import useTheme from '../../context/useTheme.js'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-2 text-text-secondary transition duration-300 cursor-pointer hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:text-text-primary"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? <MoonStar size={16} /> : <Sun size={16} />}
    </button>
  )
}
