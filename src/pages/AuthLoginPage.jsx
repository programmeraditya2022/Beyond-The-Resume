import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import GlassCard from '../components/ui/GlassCard.jsx'

export default function AuthLoginPage() {
  return (
    <div className="relative grid min-h-[82vh] place-items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl animate-[float_13s_linear_infinite]" />
        <div className="absolute -right-12 top-24 h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl animate-[float_15s_linear_infinite_reverse]" />
        <div className="absolute bottom-8 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      <GlassCard className="relative z-10 w-full max-w-md space-y-6 border-violet-400/25 bg-slate-950/45 p-8 backdrop-blur-2xl">
        <div className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/10 shadow-[0_0_26px_-10px_rgba(232,121,249,0.95)]">
            <LockKeyhole className="text-fuchsia-300" size={20} />
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-sm text-slate-300">Continue your verification journey</p>
        </div>

        <form className="space-y-4">
          <input className="input border-white/10 bg-white/5 text-white placeholder:text-slate-400" placeholder="Email" type="email" />
          <input className="input border-white/10 bg-white/5 text-white placeholder:text-slate-400" placeholder="Password" type="password" />
          <div className="text-right">
            <a href="#" className="text-sm text-cyan-300 transition duration-300 hover:text-fuchsia-300">
              Forgot password?
            </a>
          </div>
          <Link to="/authentication">
            <Button className="w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 py-3 text-white shadow-[0_16px_40px_-14px_rgba(168,85,247,0.85)] hover:shadow-[0_20px_48px_-16px_rgba(236,72,153,0.9)]">
              Sign In
            </Button>
          </Link>
          <Link to="/authentication">
            <Button variant="secondary" className="w-full border-white/15 bg-white/5 py-3 text-slate-100 hover:bg-white/10">
              Continue as Guest
            </Button>
          </Link>
        </form>
      </GlassCard>
    </div>
  )
}
