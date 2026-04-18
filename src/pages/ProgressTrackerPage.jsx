import {
  Activity,
  BarChart3,
  CheckCircle2,
  Circle,
  Construction,
  Crown,
  FileCheck2,
  LayoutDashboard,
  Lock,
  Rocket,
  Target,
  TrendingDown,
  TrendingUp,
  UploadCloud,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import GlassCard from '../components/ui/GlassCard.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { getInterviewData } from '../utils/getInterviewData.js'
import {
  aiInsightFromSkills,
  emptyCanonicalSkills,
  getSkillLabel,
  SKILL_KEYS,
  suggestionsFromSkills,
  weakAreasFromSkills,
} from '../store/interviewStore.js'

function overallScoreOf(a) {
  if (!a || typeof a !== 'object') return 0
  const v = a.overallScore ?? a.score
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

const MISSION_LEVELS = [
  {
    id: 1,
    title: 'Level 1',
    subtitle: 'Fix Fundamentals',
    description: 'Master core concepts and strengthen your foundation.',
    progressDone: 2,
    progressTotal: 4,
    locked: false,
    bannerClass:
      'bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 shadow-[0_12px_40px_-12px_rgba(14,165,233,0.55)]',
    icon: Construction,
    tasks: [
      { title: 'Review data structure basics', done: true, difficulty: 'Easy' },
      { title: 'Practice array and string problems', done: true, difficulty: 'Easy' },
      { title: 'Learn Big O notation deeply', done: false, difficulty: 'Medium' },
      { title: 'Master recursion fundamentals', done: false, difficulty: 'Medium' },
    ],
  },
  {
    id: 2,
    title: 'Level 2',
    subtitle: 'Apply Skills',
    description: 'Build real-world projects and solve intermediate challenges',
    progressDone: 0,
    progressTotal: 4,
    locked: false,
    bannerClass:
      'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-[0_12px_40px_-12px_rgba(168,85,247,0.5)]',
    icon: Rocket,
    tasks: [
      { title: 'Practice sliding window problems', done: false, difficulty: 'Medium' },
      { title: 'Build REST API with Node.js', done: false, difficulty: 'Medium' },
      { title: 'Create full-stack web application', done: false, difficulty: 'Hard' },
      { title: 'Implement database optimization', done: false, difficulty: 'Hard' },
    ],
  },
  {
    id: 3,
    title: 'Level 3',
    subtitle: 'Advanced Mastery',
    description: 'Tackle complex problems and system design challenges',
    progressDone: 0,
    progressTotal: 4,
    locked: true,
    bannerClass:
      'bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 shadow-[0_12px_40px_-12px_rgba(251,146,60,0.45)]',
    icon: Crown,
    tasks: [
      { title: 'System design interview drills', done: false, difficulty: 'Hard' },
      { title: 'Distributed systems deep dive', done: false, difficulty: 'Hard' },
      { title: 'Production incident simulations', done: false, difficulty: 'Hard' },
      { title: 'Architecture review challenge', done: false, difficulty: 'Hard' },
    ],
  },
]

function skillStatusClass(score) {
  if (score >= 80) return 'skill-card-strong'
  if (score >= 65) return 'skill-card-moderate'
  return 'skill-card-weak'
}

function skillStatusLabel(score) {
  if (score >= 80) return 'STRONG'
  if (score >= 65) return 'MODERATE'
  return 'WEAK'
}

function difficultyBadgeClass(d) {
  if (d === 'Easy') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
  if (d === 'Medium') return 'border-amber-400/50 bg-amber-500/15 text-amber-200'
  return 'border-rose-400/50 bg-rose-500/15 text-rose-200'
}

export default function ProgressTrackerPage() {
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [latest, setLatest] = useState(null)
  const [previous, setPrevious] = useState(null)

  const refreshInterviewData = () => {
    const data = getInterviewData()
    setAttempts(data)
    setLatest(data.length > 0 ? data[data.length - 1] : null)
    setPrevious(data.length > 1 ? data[data.length - 2] : null)
  }

  useEffect(() => {
    refreshInterviewData()
    const onSync = () => refreshInterviewData()
    window.addEventListener('storage', onSync)
    window.addEventListener('btr:attempts-updated', onSync)
    return () => {
      window.removeEventListener('storage', onSync)
      window.removeEventListener('btr:attempts-updated', onSync)
    }
  }, [])

  const skillScores = useMemo(
    () => ({ ...emptyCanonicalSkills(), ...(latest?.skills || {}) }),
    [latest],
  )

  const getTrend = () => {
    if (!latest || !previous) return 'stable'
    const l = latest?.overallScore ?? latest?.score ?? 0
    const p = previous?.overallScore ?? previous?.score ?? 0
    if (l > p) return 'improving'
    if (l < p) return 'declining'
    return 'stable'
  }

  const trend = getTrend()

  const radarData = latest
    ? [
        { subject: 'Problem Solving', value: latest.skills?.problemSolving ?? 0 },
        { subject: 'DSA', value: latest.skills?.dsa ?? 0 },
        { subject: 'React', value: latest.skills?.react ?? 0 },
        { subject: 'Backend', value: latest.skills?.backend ?? 0 },
        { subject: 'Java', value: latest.skills?.java ?? 0 },
      ]
    : []

  const handleNavigation = (path) => {
    const isAuth = localStorage.getItem('isAuthenticated')
    const isGuest = localStorage.getItem('guest')

    if (!isAuth && !isGuest) {
      navigate('/auth')
    } else {
      navigate(path)
    }
  }

  const userName = localStorage.getItem('userName') || 'User'
  const totalAttempts = attempts.length
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + overallScoreOf(a), 0) / attempts.length)
    : 0
  const chartData = attempts.map((a, i) => ({
    attempt: i + 1,
    score: overallScoreOf(a),
  }))

  const lastDateFormatted = latest
    ? new Date(latest.timestamp || latest.date || Date.now()).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  const previousScore = previous != null ? overallScoreOf(previous) : null
  const latestScore = latest != null ? overallScoreOf(latest) : null

  const weakAreas = weakAreasFromSkills(skillScores)
  const suggestions = suggestionsFromSkills(skillScores)
  const insightLine = aiInsightFromSkills(skillScores)

  const trendDelta =
    previousScore != null && latestScore != null ? latestScore - previousScore : null
  const confidenceValue =
    trendDelta == null ? '—' : trendDelta > 0 ? `+${trendDelta}` : trendDelta === 0 ? '0' : `${trendDelta}`
  const confidenceNote =
    trend === 'improving'
      ? 'Momentum vs previous attempt'
      : trend === 'declining'
        ? 'Vs previous attempt'
        : totalAttempts < 2
          ? 'Need 2+ attempts for trend'
          : 'Flat vs previous attempt'

  const activeMissionDone = MISSION_LEVELS[0].tasks.filter((t) => t.done).length
  const activeMissionTotal = MISSION_LEVELS[0].tasks.length

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:space-y-0">
      <GlassCard className="h-fit space-y-2 hover-lift">
        <h3 className="px-2 text-sm font-semibold uppercase tracking-[0.15em] text-text-secondary">Workspace</h3>
        {[
          ['Dashboard', '/progress', LayoutDashboard],
          ['Upload Resume', '/upload', UploadCloud],
          ['AI Interview', '/interview', Activity],
          ['Results', '/results', FileCheck2],
          ['Progress', '/progress', TrendingUp],
        ].map(([label, path, NavIcon]) => {
          const NavIconEl = NavIcon
          return (
            <Link
              key={label}
              to={path}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
            >
              <NavIconEl size={16} />
              {label}
            </Link>
          )
        })}
      </GlassCard>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <GlassCard className="hover-lift space-y-3 border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/60 p-6">
          <p className="text-sm text-gray-400">Welcome back, {userName} 👋</p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">AI Career Audit Dashboard</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
            Know what you actually know, benchmark your depth, and upgrade your readiness.
          </p>
        </GlassCard>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Upload Resume', 'Sync your latest profile.', '/upload', UploadCloud],
            ['Start Interview', 'Run a skill assessment.', '/interview', Target],
            ['View Results', 'See AI evaluation.', '/results', BarChart3],
            ['Track Progress', 'Follow mission milestones.', '/progress', TrendingUp],
          ].map(([title, subtitle, path, QuickIcon]) => {
            const QuickIconEl = QuickIcon
            return (
              <GlassCard
                key={title}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigation(path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavigation(path)
                  }
                }}
                className="hover-lift cursor-pointer space-y-3 border-cyan-500/10 bg-gradient-to-br from-slate-900/90 to-slate-950/80 p-6 transition-all duration-300 hover:border-cyan-400/25 hover:shadow-[0_20px_50px_-24px_rgba(34,211,238,0.35)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-300 ring-1 ring-white/10">
                  <QuickIconEl size={20} />
                </div>
                <h4 className="font-semibold text-white">{title}</h4>
                <p className="text-sm text-gray-400">{subtitle}</p>
              </GlassCard>
            )
          })}
        </div>

        <GlassCard className="hover-lift border-cyan-500/15 bg-gradient-to-r from-slate-900/80 to-slate-950/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/90">✨ AI Insight</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-200">{insightLine}</p>
        </GlassCard>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            ['Quick Stats', `${avgScore}%`, 'Rolling average across interview attempts'],
            ['Recent Activity', String(totalAttempts), 'Completed interview runs (this device)'],
            ['Confidence Trend', confidenceValue, confidenceNote],
          ].map(([title, value, note]) => (
            <GlassCard
              key={title}
              className="stat-card-gradient hover-lift space-y-2 border-white/10 p-6 shadow-[0_16px_50px_-28px_rgba(0,0,0,0.65)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</p>
              <p className="text-4xl font-bold tabular-nums text-white">{value}</p>
              <p className="text-xs text-gray-400">{note}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="hover-lift space-y-4 p-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Skill Analysis</h3>
            <p className="text-sm text-gray-400">Comprehensive assessment across key competency areas</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 md:p-8">
            <div className="h-72 w-full">
              {!latest ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No interview data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="78%" data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.25)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#22d3ee"
                      fill="#22d3ee"
                      fillOpacity={0.25}
                      strokeWidth={2}
                      style={{ filter: 'drop-shadow(0 0 6px #22d3ee)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="hover-lift space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Candidate Attempt Tracking</h3>
              <p className="text-sm text-gray-400">Track attempt-to-attempt movement in score performance.</p>
            </div>
            {totalAttempts >= 2 ? (
              <span
                className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)] ${
                  trend === 'declining'
                    ? 'border-red-500/30 bg-red-950/80 text-red-200'
                    : trend === 'improving'
                      ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
                      : 'border-slate-500/30 bg-slate-900/80 text-slate-200'
                }`}
              >
                {trend === 'declining' ? (
                  <TrendingDown size={14} className="shrink-0" />
                ) : trend === 'improving' ? (
                  <TrendingUp size={14} className="shrink-0" />
                ) : null}
                Performance Trend:{' '}
                {trend === 'declining' ? 'Declining' : trend === 'improving' ? 'Improving' : 'Stable'}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <GlassCard className="space-y-1 border-white/10 bg-white/[0.03] p-4 shadow-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Attempts</p>
              <p className="text-3xl font-bold tabular-nums text-white">{totalAttempts}</p>
            </GlassCard>
            <GlassCard className="space-y-1 border-white/10 bg-white/[0.03] p-4 shadow-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Latest Score</p>
              <p className="text-3xl font-bold tabular-nums text-white">{latestScore ?? '—'}</p>
            </GlassCard>
            <GlassCard className="space-y-1 border-white/10 bg-white/[0.03] p-4 shadow-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Previous Score</p>
              <p className="text-3xl font-bold tabular-nums text-white">{previousScore ?? '—'}</p>
            </GlassCard>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 px-4">
                <p className="text-center text-sm text-gray-400">No interview data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="attempt" stroke="#94a3b8" tickFormatter={(v) => String(v)} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    style={{ filter: 'drop-shadow(0 0 6px #22d3ee)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">Last Attempt</h4>
            {latest ? (
              <div className="grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
                <p>Date: {lastDateFormatted}</p>
                <p>Overall score: {latest?.overallScore ?? latest?.score ?? 0}%</p>
                <p>Verified Claims: {latest?.verifiedClaims ?? '—'}</p>
                <p>Pending Claims: {latest?.pendingClaims ?? '—'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No interview data yet</p>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Skill Cards</h3>
            <p className="text-sm text-gray-400">Depth signals across your verified skill stack</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SKILL_KEYS.map((key) => {
              const score = latest?.skills?.[key] ?? 0
              return (
                <GlassCard
                  key={key}
                  className={`hover-lift flex flex-col justify-between gap-4 p-6 ${skillStatusClass(score)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-lg font-semibold text-white">{getSkillLabel(key)}</h4>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white/90">
                      {skillStatusLabel(score)}
                    </span>
                  </div>
                  <div>
                    <p className="text-4xl font-bold tabular-nums text-white">{latest ? score : '—'}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs font-medium text-white/80">
                      <span
                        className={
                          score >= 80
                            ? 'text-emerald-400'
                            : score >= 65
                              ? 'text-amber-300'
                              : 'text-rose-400'
                        }
                      >
                        ●
                      </span>
                      {skillStatusLabel(score)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">Click to explore</p>
                </GlassCard>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Mission System</h3>
            <p className="text-sm text-gray-400">
              Complete missions to level up your skills. Unlock advanced levels by achieving 75% completion.
            </p>
          </div>

          <div className="space-y-6">
            {MISSION_LEVELS.map((level) => {
              const pct = Math.round((level.progressDone / level.progressTotal) * 100)
              const Icon = level.icon
              const locked = level.locked

              return (
                <GlassCard
                  key={level.id}
                  className={`overflow-hidden p-0 ${locked ? 'opacity-80' : 'hover-lift'}`}
                >
                  <div
                    className={`relative px-6 pb-5 pt-6 text-white ${level.bannerClass} ${locked ? 'opacity-90' : ''}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                          <Icon size={22} />
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-sm font-bold">
                            {level.title}
                            {locked ? <Lock size={14} className="opacity-80" aria-hidden /> : null}
                          </p>
                          <p className="text-lg font-semibold">{level.subtitle}</p>
                          <p className="mt-1 max-w-xl text-sm text-white/85">{level.description}</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-xs font-semibold tabular-nums backdrop-blur-sm">
                        {level.progressDone} of {level.progressTotal}
                      </div>
                    </div>
                    <div className="mt-5">
                      <div className="h-2.5 overflow-hidden rounded-full bg-black/25 ring-1 ring-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-white/90 to-cyan-200/90 transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-end text-xs font-medium text-white/90">{pct}% Complete</div>
                    </div>
                  </div>

                  <div
                    className={`relative border-t border-white/10 bg-slate-950/60 p-4 ${locked ? 'pointer-events-none select-none' : ''}`}
                  >
                    {locked ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-b-[1.35rem] bg-slate-950/75 backdrop-blur-[2px]">
                        <Lock className="h-12 w-12 text-white/50" strokeWidth={1.25} aria-hidden />
                        <p className="text-sm font-semibold text-white">Complete Level 2 to unlock</p>
                        <p className="text-xs text-gray-400">Achieve 75% completion in the previous level</p>
                      </div>
                    ) : null}
                    <ul className={`space-y-2 ${locked ? 'opacity-35' : ''}`}>
                      {level.tasks.map((task) => (
                        <li
                          key={task.title}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-3 transition hover:border-white/15"
                        >
                          {task.done ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                          ) : (
                            <Circle className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
                          )}
                          <span
                            className={`min-w-0 flex-1 text-sm ${task.done ? 'text-gray-500 line-through' : 'text-white'}`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${difficultyBadgeClass(task.difficulty)}`}
                          >
                            {task.difficulty}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {level.id === 1 && !locked ? (
                      <button
                        type="button"
                        onClick={() => handleNavigation('/interview')}
                        className="btn-gradient-primary hover-lift mt-4 w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(59,130,246,0.55)] transition duration-300"
                      >
                        Continue Mission ({activeMissionDone}/{activeMissionTotal})
                      </button>
                    ) : null}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard className="hover-lift space-y-4 p-6">
            <h3 className="text-xl font-semibold text-white">Skill-wise Progress</h3>
            {SKILL_KEYS.map((key) => (
              <ProgressBar
                key={key}
                label={getSkillLabel(key)}
                value={latest ? skillScores[key] ?? 0 : 0}
              />
            ))}
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-200">
              <p className="font-semibold text-white">Weak Areas</p>
              <p className="text-sm text-rose-200/90">
                {weakAreas.length ? weakAreas.join(' | ') : 'Complete an interview to detect focus areas.'}
              </p>
            </div>
          </GlassCard>
          <GlassCard className="hover-lift space-y-4 p-6">
            <h3 className="text-xl font-semibold text-white">Next Suggestions</h3>
            {suggestions.map((tip, idx) => (
              <div
                key={`${tip}-${idx}`}
                className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100"
              >
                {tip}
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
