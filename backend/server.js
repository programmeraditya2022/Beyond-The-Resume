import express from 'express'
import cors from 'cors'
import multer from 'multer'
import pdfParse from 'pdf-parse'

const GEMINI_API_KEY = 'process.env.GEMINI_API_KEY'

async function generateWithGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error:', data)
      throw new Error(data?.error?.message || 'Gemini request failed')
    }

    if (!data.candidates || !data.candidates[0]) {
      console.error('Gemini API Error:', data)
      throw new Error('Invalid Gemini response')
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Gemini Fetch Error:', error)
    throw error
  }
}

console.log('Gemini initialized successfully')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    console.log(`Uploaded file name: ${req.file.originalname}`)

    const data = await pdfParse(req.file.buffer)
    const extractedText = data.text || ''

    console.log(`Extracted text length: ${extractedText.length}`)

    return res.json({
      success: true,
      text: extractedText,
    })
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Failed to parse resume',
    })
  }
})

function stripJsonFence(text) {
  const t = text.trim()
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/m)
  return m ? m[1].trim() : t
}

function hashString(s) {
  let h = 2166136261
  const str = String(s || '')
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RESUME_SKILL_KEYWORDS = [
  'TypeScript',
  'JavaScript',
  'React',
  'Vue',
  'Angular',
  'Node.js',
  'Node',
  'Express',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Python',
  'Django',
  'FastAPI',
  'Java',
  'Spring',
  'Go',
  'Rust',
  'C++',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'GraphQL',
  'REST',
  'Git',
  'SQL',
  'DSA',
  'System Design',
]

function extractSkillsFromResume(text) {
  const lower = String(text || '').toLowerCase()
  const found = []
  if (lower.includes('node.js') || /\bnode\b/.test(lower)) {
    found.push('Node.js')
  }
  for (const skill of RESUME_SKILL_KEYWORDS) {
    const n = skill.toLowerCase()
    if (n === 'node' || n === 'node.js') continue
    if (lower.includes(n)) found.push(skill)
  }
  return [...new Set(found)]
}

/**
 * Dynamic, resume-text–seeded fallback: never a single fixed list — pools + RNG vary by input.
 */
function generateFallbackQuestions(text) {
  const base = String(text || '').toLowerCase()
  const seed = hashString(text || 'fallback')
  const rnd = mulberry32(seed)
  const picked = []
  const usedSkills = new Set()
  const usedQuestionNorm = new Set()

  function normQ(q) {
    return String(q || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  function tryPush(question, skill) {
    const sk = String(skill || 'General').trim() || 'General'
    const nq = normQ(question)
    if (!nq || usedQuestionNorm.has(nq)) return false
    const skKey = sk.toLowerCase()
    if (usedSkills.has(skKey)) return false
    usedSkills.add(skKey)
    usedQuestionNorm.add(nq)
    picked.push({ question, skill: sk })
    return true
  }

  const keywordRules = [
    {
      match: (b) => b.includes('react'),
      skill: 'React',
      pool: [
        { type: 'conceptual', q: 'Explain how you choose between local state, lifted state, and a store — include a real feature you shipped.' },
        { type: 'practical', q: 'Walk through how you reduced unnecessary re-renders in a React app and what you measured before/after.' },
        { type: 'scenario', q: 'A production bug only appears after hydration — how do you isolate root cause and ship a fix safely?' },
        { type: 'problem-solving', q: 'Compare two ways to fetch and cache server data in React and when each breaks down at scale.' },
      ],
    },
    {
      match: (b) => b.includes('node') || b.includes('node.js'),
      skill: 'Node.js',
      pool: [
        { type: 'conceptual', q: 'Explain the Node.js event loop in your own words — where do microtasks vs timers show up in a real API you built?' },
        { type: 'scenario', q: 'Your Node service spikes CPU under load — what steps do you take to profile and fix it in production?' },
        { type: 'practical', q: 'How do you structure error handling and retries for outbound HTTP from Node so callers get consistent behavior?' },
        { type: 'problem-solving', q: 'Describe a memory or handle leak you debugged in a long-running Node process.' },
      ],
    },
    {
      match: (b) => b.includes('mongodb'),
      skill: 'MongoDB',
      pool: [
        { type: 'conceptual', q: 'When would you embed vs reference documents — tie it to a collection you actually modeled.' },
        { type: 'scenario', q: 'Queries slow down as data grows — how do you design indexes and validate they help?' },
        { type: 'practical', q: 'How do you handle schema changes and backfills without downtime?' },
        { type: 'problem-solving', q: 'A report returns wrong aggregates — walk through how you trace whether the bug is query, index, or data shape.' },
      ],
    },
    {
      match: (b) => b.includes('api') || b.includes('rest') || b.includes('graphql'),
      skill: 'APIs',
      pool: [
        { type: 'scenario', q: 'An external API starts failing intermittently — how do you protect users and recover gracefully?' },
        { type: 'practical', q: 'How do you version an API and deprecate fields without breaking mobile clients?' },
        { type: 'problem-solving', q: 'Describe how you debugged a production 500 that only happened for certain payloads.' },
        { type: 'conceptual', q: 'Compare idempotency for POST vs PUT in a payment-adjacent flow you worked on.' },
      ],
    },
    {
      match: (b) => b.includes('aws') || b.includes('azure') || b.includes('gcp') || b.includes('cloud'),
      skill: 'Cloud',
      pool: [
        { type: 'scenario', q: 'You need to cut cloud spend 20% — what do you measure first and what levers do you try?' },
        { type: 'practical', q: 'How do you secure secrets and rotate them across services you deployed?' },
        { type: 'problem-solving', q: 'Tell me about an outage or quota limit you hit in the cloud and how you hardened the system after.' },
      ],
    },
    {
      match: (b) => b.includes('docker') || b.includes('kubernetes') || b.includes('k8s'),
      skill: 'Containers',
      pool: [
        { type: 'practical', q: 'How do you keep container images small and rebuilds fast in CI?' },
        { type: 'scenario', q: 'Pods crash-loop after a deploy — what sequence of checks do you run?' },
      ],
    },
    {
      match: (b) => b.includes('python'),
      skill: 'Python',
      pool: [
        { type: 'conceptual', q: 'Where have you used async Python vs threads/processes — what drove that choice?' },
        { type: 'practical', q: 'How do you isolate dependencies and reproduce bugs across environments in Python services?' },
      ],
    },
    {
      match: (b) => b.includes('sql') || b.includes('postgres') || b.includes('mysql'),
      skill: 'SQL',
      pool: [
        { type: 'scenario', q: 'A query regressed after a data volume jump — how did you find and fix it?' },
        { type: 'problem-solving', q: 'Explain a time you resolved deadlocks or lock contention in the database layer.' },
      ],
    },
  ]

  const shuffledRules = [...keywordRules].sort(() => rnd() - 0.5)
  for (const rule of shuffledRules) {
    if (!rule.match(base)) continue
    const choice = rule.pool[Math.floor(rnd() * rule.pool.length)]
    tryPush(choice.q, rule.skill)
    if (picked.length >= 6) break
  }

  const extracted = extractSkillsFromResume(text)
  const skillFollowUps = [
    (sk) => `Give a concrete example from your experience where ${sk} was the bottleneck — what did you change and why?`,
    (sk) => `What is one trade-off you accepted while using ${sk} on a project, and how did you validate it?`,
    (sk) => `If you joined a team unfamiliar with ${sk}, what docs or practices would you introduce first?`,
  ]
  for (const sk of extracted.sort(() => rnd() - 0.5)) {
    if (picked.length >= 6) break
    const fn = skillFollowUps[Math.floor(rnd() * skillFollowUps.length)]
    tryPush(fn(sk), sk)
  }

  const genericPads = [
    { skill: 'Problem Solving', q: 'Describe a gnarly bug or incident you owned end-to-end — how you narrowed scope and verified the fix.' },
    { skill: 'System Design', q: 'Pick a system you helped design — what were the main components and failure modes you planned for?' },
    { skill: 'Collaboration', q: 'Tell me about a disagreement on technical direction — how did you align the team and ship?' },
    { skill: 'Testing & Quality', q: 'How do you balance unit, integration, and manual testing for features you deliver?' },
    { skill: 'Performance', q: 'Walk through how you profiled a slow path and what changed in latency or cost.' },
    { skill: 'Security', q: 'What is one security concern you proactively addressed in code or infrastructure?' },
  ]

  let padIdx = 0
  while (picked.length < 6 && padIdx < genericPads.length * 4) {
    const g = genericPads[padIdx % genericPads.length]
    const salt = Math.floor(rnd() * 1e6)
    const skillLabel = `${g.skill} · ${padIdx}`
    tryPush(`${g.q} (angle ${salt % 97})`, skillLabel)
    padIdx += 1
  }

  let reflectN = 0
  while (picked.length < 5) {
    reflectN += 1
    tryPush(
      `Reflect on your last project: what would you refactor first and what metric would prove it helped? (variant ${reflectN}, seed ${seed % 10000})`,
      `Reflection ${reflectN}`,
    )
  }

  return picked.slice(0, 6).map((q, i) => ({
    id: i + 1,
    question: q.question,
    skill: q.skill,
  }))
}

function normalizeQuestionShape(q) {
  return {
    question: typeof q?.question === 'string' ? q.question.trim() : String(q?.question ?? '').trim(),
    skill:
      typeof q?.skill === 'string' && q.skill.trim()
        ? q.skill.trim()
        : 'General',
  }
}

function dedupeBySkillAndQuestion(items, resumeText, max = 6) {
  const seenSkills = new Set()
  const seenQs = new Set()
  const out = []
  for (const raw of items) {
    const q = normalizeQuestionShape(raw)
    if (!q.question) continue
    const sk = q.skill.toLowerCase()
    const qn = q.question.toLowerCase().replace(/\s+/g, ' ')
    if (seenQs.has(qn)) continue
    if (seenSkills.has(sk)) continue
    seenSkills.add(sk)
    seenQs.add(qn)
    out.push(q)
    if (out.length >= max) break
  }
  if (out.length < 5) {
    const fb = generateFallbackQuestions(resumeText)
    for (const row of fb) {
      if (out.length >= 6) break
      const sk = row.skill.toLowerCase()
      const qn = row.question.toLowerCase().replace(/\s+/g, ' ')
      if (seenSkills.has(sk) || seenQs.has(qn)) continue
      seenSkills.add(sk)
      seenQs.add(qn)
      out.push({ id: out.length + 1, question: row.question, skill: row.skill })
    }
  }
  let guard = 0
  while (out.length < 5 && guard < 24) {
    guard += 1
    const extra = generateFallbackQuestions(`${resumeText}\n${out.length}\n${guard}`)
    for (const row of extra) {
      if (out.length >= 6) break
      let sk = row.skill.toLowerCase()
      if (seenSkills.has(sk)) {
        const altSkill = `${row.skill} · ${guard}`
        sk = altSkill.toLowerCase()
        if (seenSkills.has(sk)) continue
        seenSkills.add(sk)
        out.push({ id: out.length + 1, question: row.question, skill: altSkill })
      } else {
        seenSkills.add(sk)
        out.push({ id: out.length + 1, question: row.question, skill: row.skill })
      }
    }
  }
  let lastResort = 0
  while (out.length < 5) {
    lastResort += 1
    out.push({
      id: out.length + 1,
      question: `Walk through a measurable outcome you owned recently and how you validated it (prompt ${lastResort}).`,
      skill: `Depth ${lastResort}`,
    })
  }
  return out.slice(0, 6).map((q, i) => ({ ...q, id: i + 1 }))
}

app.post('/generate-questions', async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Resume text missing',
      })
    }

    console.log('Generating questions from resume...')

    const prompt = `
      You are an expert technical interviewer.

      Resume text:
      ${String(text).slice(0, 12000)}

      Generate EXACTLY 6 interview questions (if the resume is too thin, minimum 5 — still output 6 by inferring reasonable skill areas).

      Requirements:
      - Each question must target a DIFFERENT skill or competency implied by the resume (no duplicate skills).
      - Mix question types across the set: conceptual, scenario-based, practical / hands-on, and problem-solving.
      - Questions must be non-repetitive, specific to this resume, and avoid generic filler.
      - Return ONLY valid JSON array. No markdown, no code fences, no commentary.

      Format:
      [
        { "question": "...", "skill": "ShortSkillLabel", "type": "conceptual|scenario|practical|problem-solving" }
      ]
    `

    let responseText
    let usingFallback = false

    try {
      responseText = await generateWithGemini(prompt)
    } catch (err) {
      console.warn('Gemini failed, using dynamic fallback questions', err)
      usingFallback = true
    }

    console.log('Using fallback:', usingFallback)

    if (usingFallback || !responseText) {
      const questions = generateFallbackQuestions(text)

      return res.json({
        success: true,
        source: 'fallback',
        questions,
      })
    }

    console.log('Gemini raw response:', responseText)

    let questions

    try {
      const cleaned = stripJsonFence(responseText)
      questions = JSON.parse(cleaned)
    } catch (e) {
      console.error('JSON parse failed, using dynamic fallback', e)

      return res.json({
        success: true,
        source: 'fallback',
        questions: generateFallbackQuestions(text),
      })
    }

    if (!Array.isArray(questions)) {
      return res.json({
        success: true,
        source: 'fallback',
        questions: generateFallbackQuestions(text),
      })
    }

    const normalized = dedupeBySkillAndQuestion(questions, text, 6)

    return res.json({
      success: true,
      source: 'gemini',
      questions: normalized,
    })
  } catch (error) {
    console.error('Gemini error:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to generate questions',
    })
  }
})

app.get('/test-gemini', async (req, res) => {
  try {
    const output = await generateWithGemini(
      'Say hello in JSON format like {"msg":"hello"}',
    )
    res.json({ output })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gemini test failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
