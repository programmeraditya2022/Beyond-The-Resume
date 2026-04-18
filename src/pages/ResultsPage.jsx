import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import GlassCard from '../components/ui/GlassCard.jsx'
import Stepper from '../components/ui/Stepper.jsx'
import { LATEST_RESULT_KEY } from '../utils/attempts.js'

function getHeatColor(value) {
  if (value >= 80) return 'bg-emerald-500'
  if (value >= 60) return 'bg-amber-400'
  return 'bg-rose-500'
}

function getHeatLabel(value) {
  if (value >= 80) return 'Strong'
  if (value >= 60) return 'Developing'
  return 'Needs work'
}

function feedbackLine(skill, score) {
  if (score >= 80) return `Strong signals for ${skill} — keep using concrete examples.`
  if (score >= 60) return `Solid baseline for ${skill} — deepen with trade-offs and metrics.`
  return `Prioritize ${skill}: expand answers with structure, examples, and outcomes.`
}

function insightFromBreakdown(skills) {
  if (!skills?.length) return 'Complete an interview to generate a personalized insight.'
  const min = skills.reduce((a, b) => (a.score <= b.score ? a : b))
  return `Latest run highlights ${min.skill} at ${min.score}% — focus your next practice on clearer narratives and evidence in lower-scoring areas.`
}

export default function ResultsPage() {
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [result, setResult] = useState(null)

  const loadLatest = useCallback(() => {
    try {
      const data = localStorage.getItem(LATEST_RESULT_KEY)
      if (!data) {
        setResult(null)
        return
      }
      const parsed = JSON.parse(data)
      if (
        parsed &&
        typeof parsed.overall === 'number' &&
        Array.isArray(parsed.skills)
      ) {
        setResult(parsed)
      } else {
        setResult(null)
      }
    } catch {
      setResult(null)
    }
  }, [])

  useEffect(() => {
    loadLatest()
  }, [loadLatest])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LATEST_RESULT_KEY || e.key === null) loadLatest()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('btr:attempts-updated', loadLatest)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('btr:attempts-updated', loadLatest)
    }
  }, [loadLatest])

  const overallScore = result?.overall ?? 0

  const ringData = useMemo(
    () => [
      { name: 'Score', value: overallScore },
      { name: 'Remaining', value: Math.max(0, 100 - overallScore) },
    ],
    [overallScore],
  )

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <Stepper current={4} total={4} />

      {!result ? (
        <GlassCard className="space-y-4 text-center">
          <h3 className="text-xl font-semibold text-text-primary">No interview results yet</h3>
          <p className="text-sm text-text-secondary">
            Complete the AI interview to unlock your latest performance breakdown on this device.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/upload">
              <Button variant="secondary">Upload Resume</Button>
            </Link>
            <Link to="/interview">
              <Button>Start Interview</Button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-1 space-y-3">
              <h3 className="text-xl font-semibold text-text-primary">Interview Validation</h3>
              <p className="text-sm text-text-secondary">Latest run — overall signal from your most recent attempt.</p>
              <div className="h-72">
                {showSkeleton ? (
                  <div className="skeleton h-full w-full rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ringData}
                        dataKey="value"
                        innerRadius={78}
                        outerRadius={108}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#22d3ee" />
                        <Cell fill="rgba(148, 163, 184, 0.16)" />
                      </Pie>
                      <text
                        x="50%"
                        y="45%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-text-primary text-5xl font-bold"
                      >
                        {result.overall}%
                      </text>
                      <text
                        x="50%"
                        y="59%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-text-secondary text-sm"
                      >
                        Latest overall
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
            <GlassCard className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-semibold text-text-primary">Skill breakdown</h3>
              <p className="text-sm text-text-secondary">Scores from your latest answers (length + keyword signals per skill).</p>
              <div className="space-y-4">
                {showSkeleton
                  ? result.skills.map((row) => <div key={row.skill} className="skeleton h-11 w-full" />)
                  : result.skills.map((row) => (
                      <div key={row.skill} className="space-y-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <span className="font-medium text-text-primary">{row.skill}</span>
                            <p className="text-xs text-text-secondary">{feedbackLine(row.skill, row.score)}</p>
                          </div>
                          <span className="text-text-secondary">{row.score}%</span>
                        </div>
                        <div
                          className="group relative h-3 overflow-hidden rounded-full bg-surface-2"
                          title={`${row.skill}: ${row.score}% (${getHeatLabel(row.score)})`}
                        >
                          <div
                            className={`h-full rounded-full ${getHeatColor(row.score)} transition-[width] duration-700`}
                            style={{ width: `${row.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="space-y-3">
            <h3 className="text-xl font-semibold text-text-primary">AI insight</h3>
            <p className="text-sm text-text-secondary">{insightFromBreakdown(result.skills)}</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <h3 className="text-xl font-semibold text-text-primary">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button className="flex-1 min-w-[140px]">Download Report</Button>
              <Button variant="secondary" className="flex-1 min-w-[140px] border-fuchsia-400/30 hover:border-fuchsia-400/60">
                Share
              </Button>
              <Link to="/progress">
                <Button variant="secondary" className="flex-1 min-w-[140px]">
                  View Progress
                </Button>
              </Link>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}
