/**
 * Score interview answers per skill label. Returns overall average and per-skill scores (0–100).
 * @param {{ skill?: string, question?: string }[]} questions
 * @param {string[]} answers
 * @returns {{ overall: number, skills: { skill: string, score: number }[] }}
 */
export function evaluateInterview(questions, answers) {
  const skillMap = {}

  if (!Array.isArray(questions) || questions.length === 0) {
    return { overall: 0, skills: [] }
  }

  questions.forEach((q, i) => {
    const skill = q.skill || 'General'
    const answer = answers[i] ?? ''

    if (!skillMap[skill]) {
      skillMap[skill] = { total: 0, score: 0 }
    }

    skillMap[skill].total += 1

    const lengthScore = Math.min(answer.length / 100, 1)
    const keywordScore = /project|system|design|approach|example/i.test(answer) ? 1 : 0
    const finalScore = lengthScore * 0.6 + keywordScore * 0.4

    skillMap[skill].score += finalScore
  })

  const skillBreakdown = Object.keys(skillMap).map((skill) => {
    const avg = (skillMap[skill].score / skillMap[skill].total) * 100
    return {
      skill,
      score: Math.round(avg),
    }
  })

  if (skillBreakdown.length === 0) {
    return { overall: 0, skills: [] }
  }

  const overall =
    skillBreakdown.reduce((sum, s) => sum + s.score, 0) / skillBreakdown.length

  return {
    overall: Math.round(overall),
    skills: skillBreakdown,
  }
}

/**
 * Maps dynamic per-interview skill labels to dashboard radar keys (java, dsa, react, backend, problemSolving).
 * @param {{ skill: string, score: number }[]} breakdown
 */
export function skillBreakdownToCanonical(breakdown) {
  const out = {
    java: 0,
    dsa: 0,
    react: 0,
    backend: 0,
    problemSolving: 0,
  }

  const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)))

  if (!Array.isArray(breakdown) || breakdown.length === 0) {
    return out
  }

  const bump = (key, score) => {
    const v = clamp(score)
    out[key] = Math.max(out[key], v)
  }

  for (const row of breakdown) {
    const name = String(row.skill || 'General')
    const sc = row.score
    if (/java/i.test(name)) bump('java', sc)
    else if (/dsa|data struct|algorithm|leetcode|graph|tree|dp/i.test(name)) bump('dsa', sc)
    else if (/react/i.test(name)) bump('react', sc)
    else if (/node|express|mongo|sql|postgres|mysql|backend|spring|api|python|django|flask/i.test(name))
      bump('backend', sc)
    else bump('problemSolving', sc)
  }

  const avg = breakdown.reduce((s, r) => s + r.score, 0) / breakdown.length
  const fill = clamp(avg)
  ;['java', 'dsa', 'react', 'backend', 'problemSolving'].forEach((k) => {
    if (out[k] === 0) out[k] = fill
  })

  return out
}
