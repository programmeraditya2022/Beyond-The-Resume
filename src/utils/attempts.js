import { readSession } from '../lib/analysisEngine.js'
import { evaluateInterview, skillBreakdownToCanonical } from './evaluateInterview.js'
import { ATTEMPTS_STORAGE_KEY, notifyAttemptsExternalUpdate } from '../store/interviewStore.js'

export const PENDING_ATTEMPT_FLAG = 'btr:pendingAttemptSave'
export const LATEST_RESULT_KEY = 'latestResult'

export function readAttempts() {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * Persists one attempt from evaluated interview answers (length + keyword heuristics per skill).
 * Called after interview completes (Processing page).
 */
export function saveAttempt() {
  const session = readSession()
  const items = session.interviewAnswers || []
  if (!Array.isArray(items) || items.length === 0) {
    return
  }

  const questions = items.map((x) => ({ skill: x.skill || 'General', question: x.question }))
  const answers = items.map((x) => x.answer || '')
  const result = evaluateInterview(questions, answers)
  if (!result.skills.length) {
    return
  }

  const canonical = skillBreakdownToCanonical(result.skills)
  const newAttempt = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `att-${Date.now()}`,
    date: new Date().toISOString(),
    overall: result.overall,
    overallScore: result.overall,
    skills: canonical,
    skillBreakdown: result.skills,
  }

  const previous = readAttempts()
  localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify([...previous, newAttempt]))
  localStorage.setItem(LATEST_RESULT_KEY, JSON.stringify({ overall: result.overall, skills: result.skills }))
  notifyAttemptsExternalUpdate()
}
