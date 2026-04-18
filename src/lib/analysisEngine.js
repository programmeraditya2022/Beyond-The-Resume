/** Session keys shared across upload → interview → results */
export const SESSION_KEYS = {
  resumeText: 'btr:resumeText',
  skills: 'btr:skills',
  jobDescription: 'btr:jobDescription',
  interviewAnswer: 'btr:interviewAnswer',
  interviewAnswers: 'btr:interviewAnswers',
  generatedQuestions: 'btr:generatedQuestions',
}

export function persistGeneratedQuestions(questions) {
  sessionStorage.setItem(
    SESSION_KEYS.generatedQuestions,
    JSON.stringify(Array.isArray(questions) ? questions : []),
  )
}

/** @returns {{ id: number, question: string }[] | null} */
export function readGeneratedQuestions() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.generatedQuestions)
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

/** Mirrors backend SKILL_KEYWORDS for client-side fallback extraction */
const SKILL_KEYWORDS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'SQL',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++',
  'C#',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'System Design',
  'DSA',
  'Redis',
  'GraphQL',
  'REST',
  'Git',
]

export function persistSessionFromUpload({ text, skills, jobDescription }) {
  sessionStorage.setItem(SESSION_KEYS.resumeText, text ?? '')
  sessionStorage.setItem(SESSION_KEYS.skills, JSON.stringify(Array.isArray(skills) ? skills : []))
  sessionStorage.setItem(SESSION_KEYS.jobDescription, jobDescription ?? '')
}

export function persistInterviewAnswer(answer) {
  sessionStorage.setItem(SESSION_KEYS.interviewAnswer, answer ?? '')
}

/** @param {{ question: string, skill: string, answer: string }[]} items */
export function persistInterviewAnswers(items) {
  const list = Array.isArray(items) ? items : []
  sessionStorage.setItem(SESSION_KEYS.interviewAnswers, JSON.stringify(list))
  const combined = list
    .map(
      (x, i) =>
        `Q${i + 1} (${x.skill || 'Skill'}): ${x.question}\nAnswer: ${x.answer ?? ''}`,
    )
    .join('\n\n')
  sessionStorage.setItem(SESSION_KEYS.interviewAnswer, combined)
}

export function readSession() {
  let skills = []
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS.skills)
    skills = raw ? JSON.parse(raw) : []
  } catch {
    skills = []
  }
  let interviewAnswers = []
  try {
    const rawA = sessionStorage.getItem(SESSION_KEYS.interviewAnswers)
    interviewAnswers = rawA ? JSON.parse(rawA) : []
  } catch {
    interviewAnswers = []
  }
  return {
    resumeText: sessionStorage.getItem(SESSION_KEYS.resumeText) || '',
    skills: Array.isArray(skills) ? skills : [],
    jobDescription: sessionStorage.getItem(SESSION_KEYS.jobDescription) || '',
    interviewAnswer: sessionStorage.getItem(SESSION_KEYS.interviewAnswer) || '',
    interviewAnswers: Array.isArray(interviewAnswers) ? interviewAnswers : [],
  }
}

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9#+.]+/g) || []).filter((w) => w.length > 2)
}

function uniqueTokens(tokens) {
  return new Set(tokens).size
}

export function extractSkillsFromResumeText(text) {
  const normalized = text.replace(/\s+/g, ' ')
  const lower = normalized.toLowerCase()
  const found = []
  for (const skill of SKILL_KEYWORDS) {
    if (lower.includes(skill.toLowerCase())) found.push(skill)
  }
  return [...new Set(found)]
}

/**
 * How well the interview answer validates against resume + JD (0–100).
 */
export function computeInterviewValidation({ resumeText, skills, jobDescription, interviewAnswer }) {
  const a = interviewAnswer.trim()
  if (!a) return 11

  const words = tokenize(a)
  const wc = words.length
  let score = Math.min(46, 14 + wc * 1.05)

  const ansLower = a.toLowerCase()
  let skillHits = 0
  for (const s of skills) {
    if (ansLower.includes(s.toLowerCase())) skillHits++
  }
  const skillRatio = skills.length ? skillHits / skills.length : 0
  score += skillRatio * 40

  const jobTok = tokenize(jobDescription)
  if (jobTok.length) {
    const ansSet = new Set(words)
    let overlap = 0
    for (const t of jobTok) {
      if (ansSet.has(t)) overlap++
    }
    score += Math.min(22, (overlap / jobTok.length) * 28)
  }

  const specificity = (a.match(/\d+/g) || []).length
  score += Math.min(14, specificity * 2.8)

  if (resumeText.trim().length > 80) {
    const resumeTok = new Set(tokenize(resumeText))
    let bridge = 0
    for (const w of words) {
      if (resumeTok.has(w)) bridge++
    }
    score += Math.min(18, (bridge / Math.max(12, words.length)) * 22)
  }

  return Math.round(Math.min(100, Math.max(16, score)))
}

/**
 * Prominence / “freshness” of each skill in the resume text (0–100 per skill).
 */
export function computeSkillFreshnessRows(skills, resumeText) {
  const text = resumeText || ''
  const lower = text.toLowerCase()
  const lines = text.split(/\n/)
  const head = lines.slice(0, Math.max(1, Math.ceil(lines.length * 0.35))).join('\n').toLowerCase()

  const yearMatches = text.match(/\b20[12]\d\b/g) || []
  const recencyBonus = yearMatches.some((y) => parseInt(y, 10) >= 2022) ? 10 : 0

  return skills.map((skill) => {
    const n = skill.toLowerCase()
    let count = 0
    let idx = lower.indexOf(n)
    while (idx !== -1) {
      count++
      idx = lower.indexOf(n, idx + Math.max(1, n.length))
    }
    let freshness = 36 + count * 13 + recencyBonus
    if (head.includes(n)) freshness += 14
    return {
      skill,
      score: Math.round(Math.min(100, Math.max(20, freshness))),
    }
  })
}

/**
 * Recruiter-facing dimensions with Strong / Average / Weak from real text signals.
 */
export function computeRecruiterHeatmap({ resumeText, jobDescription, skills, interviewAnswer }) {
  const r = resumeText || ''
  const jd = jobDescription || ''
  const rtokens = tokenize(r)
  const jtokens = tokenize(jd)
  const jdSet = new Set(jtokens)
  let jdOverlap = 0
  for (const t of rtokens) {
    if (jdSet.has(t)) jdOverlap++
  }
  const jdScore = jtokens.length ? Math.min(100, (jdOverlap / jtokens.length) * 100) : 52

  const numbers = (r.match(/\d+(?:\.\d+)?%?|\$\s*[\d,]+/g) || []).length
  const quantScore = Math.min(100, 16 + numbers * 5)

  const skillScore = Math.min(100, skills.length * 11 + 24)

  const words = r.split(/\s+/).filter(Boolean).length
  const narrativeScore = Math.min(100, words / 22)

  const itokens = tokenize(interviewAnswer)
  const rset = new Set(rtokens)
  let iv = 0
  for (const t of itokens) {
    if (rset.has(t)) iv++
  }
  const interviewCoherence = itokens.length ? Math.min(100, 35 + (iv / itokens.length) * 55) : 28

  const sections = [
    { section: 'JD Alignment', score: jdScore },
    { section: 'Evidence & Metrics', score: quantScore },
    { section: 'Skill Coverage', score: skillScore },
    { section: 'Narrative Depth', score: narrativeScore },
    { section: 'Interview Coherence', score: interviewCoherence },
  ]

  const toStatus = (s) => {
    if (s >= 80) return 'Strong'
    if (s >= 65) return 'Average'
    return 'Weak'
  }

  return sections.map((x) => ({ section: x.section, status: toStatus(x.score) }))
}

/**
 * Compare interview answer to resume for grounded authenticity messaging.
 */
export function computeAuthenticityInsights({ resumeText, interviewAnswer, skills }) {
  const a = interviewAnswer.trim()
  const r = resumeText.trim()
  if (!a && !r) {
    return {
      score: 14,
      strengths: 'Upload a resume and complete the interview to unlock authenticity signals.',
      weaknesses: 'No resume text or interview response found in this browser session.',
      line: 'Authenticity: insufficient session data.',
    }
  }
  if (!a) {
    return {
      score: 22,
      strengths: 'Resume text is available for future comparison once you submit an interview answer.',
      weaknesses: 'Missing interview answer — authenticity is measured against your response.',
      line: 'Authenticity: waiting for interview response.',
    }
  }
  if (!r) {
    return {
      score: 34,
      strengths: `Answer contains ${tokenize(a).length} substantive tokens with ${(a.match(/\d+/g) || []).length} numeric detail markers.`,
      weaknesses: 'No resume text in session — cannot verify claims against documented experience.',
      line: 'Authenticity: partial (resume not loaded in session).',
    }
  }

  const aTok = tokenize(a)
  const rTok = tokenize(r)
  const rSet = new Set(rTok)
  let inter = 0
  for (const t of aTok) {
    if (rSet.has(t)) inter++
  }
  const union = uniqueTokens([...aTok, ...rTok])
  const jaccard = union > 0 ? inter / union : 0

  let grounded = 0
  for (const s of skills) {
    if (a.toLowerCase().includes(s.toLowerCase())) grounded++
  }
  const grounding = skills.length ? grounded / skills.length : inter / Math.max(1, aTok.length)

  let score = 46 + grounding * 30 + Math.min(16, (aTok.length / 75) * 16)
  if (jaccard > 0.82 && aTok.length < 45) score -= 20
  if (jaccard < 0.04) score -= 10
  score += Math.min(12, (a.match(/\d+/g) || []).length * 2.2)

  score = Math.round(Math.min(100, Math.max(24, score)))

  const strengths =
    score >= 72
      ? `Answer aligns with resume vocabulary (${Math.round(jaccard * 100)}% token overlap) and explicitly references ${grounded} of ${Math.max(1, skills.length)} detected skills.`
      : `Response length and specificity (${aTok.length} key terms, ${(a.match(/\d+/g) || []).length} numeric anchors) provide a baseline for verification.`

  const weaknesses =
    jaccard > 0.88 && aTok.length < 55
      ? 'Wording is extremely close to resume lines — add unique examples and outcomes.'
      : grounding < 0.28
        ? 'Limited explicit linkage between the answer and skills or claims found in the resume.'
        : 'Add more quantified outcomes (%, latency, scale) to strengthen verifiability.'

  const line = `Authenticity index ${score}% — ${grounding >= 0.45 ? 'grounded in resume signals' : 'needs stronger resume-backed detail'}.`

  return { score, strengths, weaknesses, line }
}
