import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import GlassCard from '../ui/GlassCard.jsx'

export default function HeroSection() {
  return (
    <section className="relative isolate grid min-h-[82vh] items-center gap-12 overflow-hidden py-6 lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-12 top-1/4 h-64 w-64 rounded-full bg-blue-500/40 blur-3xl animate-[float_13s_linear_infinite]" />
        <div className="absolute -right-8 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/35 blur-3xl animate-[float_16s_linear_infinite_reverse]" />
        <div className="absolute left-1/2 top-3/4 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
      </div>

      <div className="space-y-8">
        <h1 className="text-5xl font-black leading-[0.98] text-white md:text-6xl lg:text-7xl">
          <span>Beyond</span>{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">the Resume</span>
        </h1>
        <p className="max-w-md text-base text-slate-300 md:text-lg">
          AI-powered verification that reveals real talent
        </p>
        <div>
          <Link to="/authentication">
            <Button className="rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-8 py-3.5 text-base text-white shadow-[0_0_0_1px_rgba(147,51,234,0.35),0_20px_46px_-12px_rgba(168,85,247,0.9)] hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(217,70,239,0.65),0_28px_54px_-14px_rgba(236,72,153,0.92)]">
              Start Verification
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center lg:justify-end">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/35 shadow-[0_0_30px_-10px_rgba(167,139,250,0.5)] animate-[spin_16s_linear_infinite]" />
          <div className="absolute left-1/2 top-1/2 h-92 w-92 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/30 shadow-[0_0_38px_-12px_rgba(232,121,249,0.45)] animate-[spin_22s_linear_infinite_reverse]" />
          <div className="absolute left-1/2 top-1/2 h-112 w-112 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20" />
          <span className="particle left-[12%] top-[26%]" />
          <span className="particle left-[78%] top-[24%]" />
          <span className="particle left-[16%] top-[76%]" />
          <span className="particle left-[82%] top-[72%]" />
        </div>

        <GlassCard className="relative w-full max-w-md rotate-[-7deg] border-violet-300/40 bg-slate-950/45 p-6 shadow-[0_0_0_1px_rgba(192,132,252,0.3),0_34px_100px_-28px_rgba(168,85,247,0.95)] animate-[floatCard_7s_ease-in-out_infinite] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-60">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Resume Intelligence</p>
              <span className="h-2.5 w-2.5 rounded-full bg-pink-400 shadow-[0_0_14px_3px_rgba(244,114,182,0.9)]" />
            </div>
            <h3 className="text-2xl font-bold text-white">Candidate Profile</h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/12 bg-white/6 p-3">
                <p className="text-xs text-slate-300">Authenticity Signal</p>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-2 w-[86%] rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400" />
                </div>
              </div>
              <div className="rounded-xl border border-white/12 bg-white/6 p-3">
                <p className="text-xs text-slate-300">Interview Confidence</p>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-2 w-[79%] rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500" />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
