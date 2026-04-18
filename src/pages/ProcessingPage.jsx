import { CheckCircle2, Cpu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import GlassCard from '../components/ui/GlassCard.jsx'
import Stepper from '../components/ui/Stepper.jsx'
import { PENDING_ATTEMPT_FLAG, saveAttempt } from '../utils/attempts.js'

const thinkingSteps = [
  'Extracting resume data...',
  'Generating questions...',
  'Analyzing answers...',
  'Checking authenticity...',
  'Finalizing results...',
]

const STEP_MS = 800

export default function ProcessingPage() {
  const [completedCount, setCompletedCount] = useState(0)
  const [showCompleteToast, setShowCompleteToast] = useState(false)

  const allDone = completedCount >= thinkingSteps.length

  useEffect(() => {
    if (sessionStorage.getItem(PENDING_ATTEMPT_FLAG) === '1') {
      sessionStorage.removeItem(PENDING_ATTEMPT_FLAG)
      saveAttempt()
    }
  }, [])

  useEffect(() => {
    if (completedCount >= thinkingSteps.length) return undefined
    const t = setTimeout(() => setCompletedCount((c) => c + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [completedCount])

  useEffect(() => {
    if (!allDone) return undefined
    setShowCompleteToast(true)
    const hide = setTimeout(() => setShowCompleteToast(false), 2000)
    return () => clearTimeout(hide)
  }, [allDone])

  return (
    <div className="space-y-6">
      <Stepper current={3} total={4} />
      {showCompleteToast && (
        <div className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-surface-2/95 px-4 py-3 text-center text-sm text-text-primary shadow-[0_0_32px_-8px_rgba(16,185,129,0.55)] backdrop-blur">
          ✅ Your AI verification is complete. You can now view your results.
        </div>
      )}
      <GlassCard
        className={`mx-auto max-w-2xl space-y-6 text-center transition-[box-shadow] duration-500 ${
          allDone ? 'shadow-[0_0_40px_-12px_rgba(34,211,238,0.35)]' : ''
        }`}
      >
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full border border-cyan-400/40 bg-surface-2 ${
            allDone ? '' : 'animate-spin'
          }`}
        >
          <Cpu className={`text-cyan-400 ${allDone ? 'opacity-60' : ''}`} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">AI Verification Pipeline Running</h2>
        <div className="space-y-3">
          {thinkingSteps.map((message, i) => {
            const isComplete = i < completedCount
            const isActive = i === completedCount && completedCount < thinkingSteps.length
            return (
              <div
                key={message}
                className={`flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-2 p-3 text-left text-text-secondary transition-opacity ${
                  isComplete || isActive ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <span className="inline-flex flex-1 items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                  ) : isActive ? (
                    <span className="typing-dot" style={{ animationDelay: `${i * 0.12}s` }} />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border border-border/50" aria-hidden />
                  )}
                  <span className={isComplete ? 'text-text-primary' : ''}>{message}</span>
                </span>
              </div>
            )
          })}
        </div>
        {allDone && (
          <p className="text-lg font-semibold text-emerald-400/95">Analysis Complete ✓</p>
        )}
        {allDone ? (
          <Link to="/results">
            <Button className="shadow-[0_0_28px_-6px_rgba(34,211,238,0.45)]">View Results</Button>
          </Link>
        ) : (
          <Button type="button" disabled>
            View Results
          </Button>
        )}
      </GlassCard>
    </div>
  )
}
