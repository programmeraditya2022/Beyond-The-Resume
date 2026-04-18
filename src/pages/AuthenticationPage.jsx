import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import GlassCard from '../components/ui/GlassCard.jsx'
import { hasSessionAccess, loginAsGuest, loginUser, registerUser } from '../utils/auth.js'

function validateAuth(email, password) {
  if (!email.includes('@')) return 'Enter a valid email address.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

function validateRegister(name, email, password, confirmPassword) {
  if (!name.trim()) return 'Name is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim())) return 'Enter a valid email'
  if ((password || '').length < 6) return 'Password must be at least 6 characters'
  if (password !== confirmPassword) return 'Passwords do not match'
  return ''
}

export default function AuthenticationPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)

  useEffect(() => {
    if (hasSessionAccess()) {
      navigate('/upload', { replace: true })
    }
  }, [navigate])

  function handleRegister(e) {
    e.preventDefault()
    setAuthError('')
    setRegisterSuccess(false)
    const err = validateRegister(name, email, password, confirmPassword)
    if (err) {
      setAuthError(err)
      return
    }
    const em = email.trim()
    const nm = name.trim()
    const res = registerUser(nm, em, password)
    if (!res.success) {
      setAuthError(res.error || 'Registration failed')
      return
    }
    const loginRes = loginUser(em, password)
    if (!loginRes.success) {
      setAuthError('Could not complete sign-in. Please try logging in.')
      return
    }
    setRegisterSuccess(true)
    setTimeout(() => {
      navigate('/upload')
    }, 1300)
  }

  function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    setRegisterSuccess(false)
    const err = validateAuth(email, password)
    if (err) {
      setAuthError(err)
      return
    }
    const res = loginUser(email.trim(), password)
    if (res.success) {
      navigate('/upload')
    } else {
      setAuthError('Invalid email or password.')
    }
  }

  function handleGuest() {
    setAuthError('')
    setRegisterSuccess(false)
    loginAsGuest()
    navigate('/upload')
  }

  return (
    <div className="relative grid min-h-[82vh] place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl animate-[float_13s_linear_infinite]" />
        <div className="absolute -right-12 top-24 h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl animate-[float_15s_linear_infinite_reverse]" />
      </div>
      <GlassCard className="relative z-10 w-full max-w-md space-y-6 border-violet-400/25 bg-slate-950/45 p-8 text-center backdrop-blur-2xl">
        <h1 className="text-2xl font-bold text-text-primary">Authentication Required</h1>
        <p className="text-sm text-text-secondary">Sign in or create an account to continue to verification.</p>
        <form className="space-y-4 text-left" onSubmit={(e) => e.preventDefault()}>
          <input
            className="input w-full border-white/10 bg-white/5 text-white placeholder:text-slate-400"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setRegisterSuccess(false)
            }}
            autoComplete="name"
          />
          <input
            className="input w-full border-white/10 bg-white/5 text-white placeholder:text-slate-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setRegisterSuccess(false)
            }}
            autoComplete="email"
          />
          <input
            className="input w-full border-white/10 bg-white/5 text-white placeholder:text-slate-400"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setRegisterSuccess(false)
            }}
            autoComplete="new-password"
          />
          <input
            className="input w-full border-white/10 bg-white/5 text-white placeholder:text-slate-400"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setRegisterSuccess(false)
            }}
            autoComplete="new-password"
          />
          {authError ? <p className="text-sm text-rose-400">{authError}</p> : null}
          {registerSuccess ? (
            <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-300">
              Registration successful ✓
            </p>
          ) : null}
          <div className="flex flex-col gap-3 pt-1">
            <Button type="button" className="w-full" onClick={handleLogin}>
              Login
            </Button>
            <Button type="button" className="w-full" variant="secondary" onClick={handleRegister}>
              Register
            </Button>
            <Button type="button" className="w-full" variant="secondary" onClick={handleGuest}>
              Continue as Guest
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
