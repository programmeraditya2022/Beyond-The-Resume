import {
  readSession,
  computeInterviewValidation,
  computeAuthenticityInsights,
  computeSkillFreshnessRows,
  extractSkillsFromResumeText,
} from '../lib/analysisEngine.js'
import { skillBreakdownToCanonical } from '../utils/evaluateInterview.js'

export const ATTEMPTS_STORAGE_KEY = 'attempts'

/** @typedef {'improving' | 'declining' | 'stable'} InterviewTrend */

const SKILL_KEYS = ['java', 'dsa', 'react', 'backend', 'problemSolving']

/** @returns {Record<string, number>} */
export function emptyCanonicalSkills() {
  return {
    java: 0,
    dsa: 0,
    react: 0,
    backend: 0,
    problemSolving: 0,
  }
}

let listeners = new Set()
let cachedSnapshot = null
let globalListenersAttached = false

function notify() {
  cachedSnapshot = null
  listeners.forEach((fn) => fn())
}

function handleStorageEvent(e) {
  if (e.key === ATTEMPTS_STORAGE_KEY || e.key === 'latestResult' || e.key === null) {
    notify()
  }
}

function ensureGlobalListeners() {
  if (globalListenersAttached) return
  window.addEventListener('storage', handleStorageEvent)
  globalListenersAttached = true
}

export function subscribe(listener) {
  ensureGlobalListeners()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readRawAttempts() {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function getOverallScore(attempt) {
  if (!attempt || typeof attempt !== 'object') return 0
  if (typeof attempt.overall === 'number' && Number.isFinite(attempt.overall)) {
    return attempt.overall
  }
  if (typeof attempt.overallScore === 'number' && Number.isFinite(attempt.overallScore)) {
    return attempt.overallScore
  }
  if (typeof attempt.score === 'number' && Number.isFinite(attempt.score)) {
    return attempt.score
  }
  return 0
}

/**
 * Migrate legacy attempts; ensure id, overallScore, skills.
 * @param {object} raw
 */
function normalizeAttempt(raw, index) {
  const overall = getOverallScore(raw)
  const date = raw.date || new Date().toISOString()
  const id = raw.id || `mig-${date}-${index}`

  let skills = raw.skills
  if (Array.isArray(skills)) {
    skills = skillBreakdownToCanonical(skills)
  } else if (raw.skillBreakdown && Array.isArray(raw.skillBreakdown)) {
    skills = skillBreakdownToCanonical(raw.skillBreakdown)
  } else if (!skills || typeof skills !== 'object') {
    skills = spreadSkillsFromOverall(overall, id)
  } else {
    skills = { ...emptyCanonicalSkills(), ...skills }
    for (const k of SKILL_KEYS) {
      const v = skills[k]
      skills[k] = typeof v === 'number' && Number.isFinite(v) ? clampScore(v) : clampScore(overall)
    }
  }

  return {
    id,
    date,
    overallScore: clampScore(overall),
    skills,
    verifiedClaims: raw.verifiedClaims,
    pendingClaims: raw.pendingClaims,
  }
}

function clampScore(n) {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function spreadSkillsFromOverall(overall, seed) {
  const base = clampScore(overall)
  const offsets = [-6, 2, -3, 5, -4]
  const h = String(seed)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const out = emptyCanonicalSkills()
  SKILL_KEYS.forEach((key, i) => {
    const jitter = offsets[(i + h) % offsets.length]
    out[key] = clampScore(base + jitter)
  })
  return out
}

export function buildCanonicalSkills(session, overallScore) {
  const skillsList =
    session.skills?.length ? session.skills : extractSkillsFromResumeText(session.resumeText)
  const rows = computeSkillFreshnessRows(skillsList, session.resumeText)
  const validation = computeInterviewValidation(session)
  const overall = clampScore(overallScore)

  const findRow = (...preds) => {
    for (const p of preds) {
      const hit = rows.find((r) => p(String(r.skill || '')))
      if (hit) return hit.score
    }
    return null
  }

  const blend = (specific) => {
    if (specific != null) return clampScore(Math.round(0.52 * specific + 0.48 * overall))
    return clampScore(Math.round(0.62 * overall + 0.38 * validation))
  }

  const java = blend(findRow((s) => /java/i.test(s)))
  const dsa = blend(
    findRow((s) => /dsa|data structur|algorithm|leetcode/i.test(s)),
  )
  const react = blend(findRow((s) => /react/i.test(s)))
  const backend = blend(
    findRow((s) => /node|express|mongo|sql|postgres|mysql|backend|spring|api/i.test(s)),
  )
  const problemSolving = blend(
    findRow((s) => /system design|problem|solving|architecture/i.test(s)),
  )

  return {
    java,
    dsa,
    react,
    backend,
    problemSolving,
  }
}

/** @param {ReturnType<normalizeAttempt>[]} attempts */
export function computeTrend(attempts) {
  if (attempts.length < 2) return 'stable'
  const prev = getOverallScore(attempts[attempts.length - 2])
  const latest = getOverallScore(attempts[attempts.length - 1])
  if (latest > prev) return 'improving'
  if (latest < prev) return 'declining'
  return 'stable'
}

function buildSnapshot() {
  const raw = readRawAttempts()
  const attempts = raw.map((a, i) => normalizeAttempt(a, i))
  const latestAttempt = attempts.length ? attempts[attempts.length - 1] : null
  const trend = computeTrend(attempts)
  const skillScores = latestAttempt?.skills ? { ...latestAttempt.skills } : emptyCanonicalSkills()

  return {
    attempts,
    latestAttempt,
    skillScores,
    trend,
  }
}

export function getSnapshot() {
  if (!cachedSnapshot) {
    cachedSnapshot = buildSnapshot()
  }
  return cachedSnapshot
}

function invalidateCache() {
  cachedSnapshot = null
}

/** Call after writing `attempts` / `latestResult` from outside addAttempt (e.g. evaluateInterview save). */
export function notifyAttemptsExternalUpdate() {
  invalidateCache()
  listeners.forEach((fn) => fn())
  window.dispatchEvent(new Event('btr:attempts-updated'))
}

/**
 * @param {object} result — optional partial; merged with session-derived evaluation
 */
export function addAttempt(result = {}) {
  const session = readSession()
  const validation = computeInterviewValidation(session)
  const auth = computeAuthenticityInsights(session)

  let overallScore = Math.round((validation + auth.score) / 2)
  if (!Number.isFinite(overallScore)) {
    overallScore = 72
  }
  overallScore = clampScore(Math.min(90, Math.max(60, overallScore)))

  if (typeof result.overallScore === 'number' && Number.isFinite(result.overallScore)) {
    overallScore = clampScore(result.overallScore)
  }

  const skillNudge = Math.min(6, Math.max(0, (session.skills?.length || 0) - 3))
  const verifiedClaims =
    result.verifiedClaims ??
    Math.min(20, Math.max(4, Math.round(overallScore / 6) + skillNudge))
  const pendingClaims =
    result.pendingClaims ?? Math.max(0, Math.min(10, 22 - verifiedClaims))

  const skills =
    result.skills && typeof result.skills === 'object'
      ? { ...emptyCanonicalSkills(), ...result.skills }
      : buildCanonicalSkills(session, overallScore)

  const attempt = {
    id: result.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}`),
    date: result.date || new Date().toISOString(),
    overallScore,
    skills,
    verifiedClaims,
    pendingClaims,
  }

  const attempts = readRawAttempts().map((a, i) => normalizeAttempt(a, i))
  attempts.push(attempt)

  localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts))
  invalidateCache()
  notify()
  window.dispatchEvent(new Event('btr:attempts-updated'))
}

/** Used after interview pipeline (replaces legacy saveAttempt body). */
export function addAttemptFromSession() {
  addAttempt({})
}

export function getSkillLabel(key) {
  const labels = {
    java: 'Java',
    dsa: 'DSA',
    react: 'React',
    backend: 'Backend',
    problemSolving: 'Problem Solving',
  }
  return labels[key] || key
}

export function feedbackForSkill(key, score) {
  const name = getSkillLabel(key)
  if (score >= 80) {
    return `Strong ${name} signals — keep shipping depth with production examples and metrics.`
  }
  if (score >= 65) {
    return `Solid ${name} baseline — tighten gaps with targeted practice and measurable outcomes.`
  }
  return `Priority uplift for ${name} — add drills, trace a real incident, and narrate trade-offs clearly.`
}

export function weakestSkillKey(skills) {
  if (!skills || typeof skills !== 'object') return null
  let minK = null
  let minV = Infinity
  for (const k of SKILL_KEYS) {
    const v = skills[k]
    if (typeof v === 'number' && v < minV) {
      minV = v
      minK = k
    }
  }
  return minK
}

export function aiInsightFromSkills(skills) {
  const w = weakestSkillKey(skills)
  if (!w) return 'Complete an interview to generate a personalized insight.'
  const s = skills[w]
  return `Strong overall profile with the largest gap in ${getSkillLabel(w)} (${s}%). ${feedbackForSkill(w, s)}`
}

export function weakAreasFromSkills(skills) {
  const w = weakestSkillKey(skills)
  if (!w) return []
  const second = SKILL_KEYS.filter((k) => k !== w).sort((a, b) => skills[a] - skills[b])[0]
  const out = [getSkillLabel(w)]
  if (second && skills[second] != null) out.push(getSkillLabel(second))
  return out
}

export function suggestionsFromSkills(skills) {
  const w = weakestSkillKey(skills)
  if (!w) {
    return ['Upload a resume and complete the AI interview to unlock tailored suggestions.']
  }
  const tips = {
    java: [
      'Schedule JVM / concurrency deep-dives tied to your last project.',
      'Trace one production bug from stack trace to root cause in writing.',
    ],
    dsa: [
      'Run timed sets on graphs, DP, and heaps with score tracking.',
      'Explain Big-O for every solution out loud before coding.',
    ],
    react: [
      'Build a small feature with hooks, suspense boundaries, and perf profiling.',
      'Compare state tools (context vs lightweight stores) for your use case.',
    ],
    backend: [
      'Document one API with auth, idempotency, and failure modes.',
      'Load-test a route and capture p95 before/after an index change.',
    ],
    problemSolving: [
      'Practice 2 system-design prompts weekly with structured trade-off grids.',
      'Write postmortems that link symptoms → causes → prevention.',
    ],
  }
  return tips[w] || ['Double down on fundamentals with spaced repetition and real examples.']
}

export { getOverallScore, normalizeAttempt, SKILL_KEYS }
