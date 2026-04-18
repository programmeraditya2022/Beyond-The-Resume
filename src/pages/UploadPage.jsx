import { CheckCircle2, FileText, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import GlassCard from '../components/ui/GlassCard.jsx'
import Stepper from '../components/ui/Stepper.jsx'
import { persistSessionFromUpload, persistGeneratedQuestions } from '../lib/analysisEngine.js'

const MAX_FILE_BYTES = 10 * 1024 * 1024

const skillsList = [
  'Java',
  'Python',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'SQL',
  'DSA',
  'System Design',
  'JavaScript',
  'TypeScript',
  'Git',
  'REST',
]

function extractSkills(resumeText) {
  return skillsList.filter((skill) => resumeText.toLowerCase().includes(skill.toLowerCase()))
}

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const API_UPLOAD_URL = `${API_BASE}/upload`
const API_GENERATE_QUESTIONS_URL = `${API_BASE}/generate-questions`

function looksLikeHtml(body) {
  const s = (body || '').trimStart()
  if (!s.startsWith('<')) return false
  const head = s.slice(0, 120).toLowerCase()
  return head.includes('<!doctype') || head.includes('<html') || head.includes('<head') || head.includes('<body')
}

function parseJsonUploadBody(raw, response) {
  const text = (raw ?? '').replace(/^\uFEFF/, '').trim()
  if (!text) {
    throw new Error(
      `Empty response (HTTP ${response.status}). Start the API server: open a terminal, run "cd backend" then "npm start", keep it running, and try again.`,
    )
  }
  if (looksLikeHtml(text)) {
    throw new Error(
      'The server returned a web page instead of data — the resume API is not running or the request did not reach it. Start the backend: cd backend → npm start (leave that terminal open on port 5000), refresh this page, then upload again.',
    )
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      `Invalid response (HTTP ${response.status}). Start the backend on port 5000 (cd backend && npm start) and ensure nothing else blocks localhost.`,
    )
  }
}

/**
 * POST /generate-questions — only call when resumeText is non-empty.
 * @returns {Promise<{ id: number, question: string, skill: string }[]>}
 */
async function requestGenerateQuestions(resumeText) {
  try {
    const response = await fetch(API_GENERATE_QUESTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: resumeText }),
    })
    const raw = await response.text()
    let data
    try {
      data = JSON.parse(raw)
    } catch (err) {
      console.error('API error:', err)
      throw new Error('Invalid JSON from generate-questions')
    }
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate questions')
    }
    return Array.isArray(data.questions) ? data.questions : []
  } catch (err) {
    console.error('API error:', err)
    throw err
  }
}

function progressPhaseLabel(pct, phase) {
  if (phase === 'generating') return 'Generating Questions...'
  if (phase === 'parsing') return 'Parsing Resume...'
  if (pct < 30) return 'Uploading Resume...'
  if (pct < 70) return 'Parsing Resume...'
  return 'Analyzing Skills...'
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [generateError, setGenerateError] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [progress, setProgress] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isParsed, setIsParsed] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [detectedSkills, setDetectedSkills] = useState([])
  const rampIntervalRef = useRef(null)

  const fileSelected = Boolean(file)
  const isBusy = isParsing || isGeneratingQuestions

  function clearRampInterval() {
    if (rampIntervalRef.current) {
      clearInterval(rampIntervalRef.current)
      rampIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => clearRampInterval()
  }, [])

  const selectedFileMeta = file
    ? { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` }
    : { name: 'No file selected', size: 'Please choose a PDF file' }

  function handleFileChange(event) {
    const selected = event.target.files?.[0] ?? null
    setError('')
    setStatus('')
    setGenerateError('')
    setResumeText('')
    persistGeneratedQuestions([])
    if (selected && selected.size > MAX_FILE_BYTES) {
      setError('File size must be under 10MB')
      setFile(null)
      event.target.value = ''
      setIsParsed(false)
      setParsedData(null)
      setDetectedSkills([])
      setProgress(0)
      return
    }
    setFile(selected)
    setIsParsed(false)
    setParsedData(null)
    setDetectedSkills([])
    setProgress(0)
  }

  function animateProgressTo100() {
    return new Promise((resolve) => {
      const id = setInterval(() => {
        setProgress((p) => {
          const next = Math.min(100, p + 5)
          if (next >= 100) {
            clearInterval(id)
            setTimeout(resolve, 80)
            return 100
          }
          return next
        })
      }, 32)
    })
  }

  async function handleParseResume() {
    setError('')
    setStatus('')
    setGenerateError('')
    clearRampInterval()

    if (!file) {
      setError('Please select a PDF file first.')
      return
    }

    setIsParsing(true)
    setIsParsed(false)
    setResumeText('')
    persistGeneratedQuestions([])
    setParsedData(null)
    setDetectedSkills([])
    setProgress(0)

    rampIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92
        return p + 0.85 + Math.random() * 0.45
      })
    }, 45)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      })

      const raw = await response.text()
      const result = parseJsonUploadBody(raw, response)

      clearRampInterval()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setError('')

      const text = result.text ?? ''
      setResumeText(text)

      await animateProgressTo100()

      const extractedSkills = extractSkills(text)
      setParsedData({ text, skills: extractedSkills })
      setDetectedSkills(extractedSkills)
      try {
        persistSessionFromUpload({
          text,
          skills: extractedSkills,
          jobDescription,
        })
      } catch (persistErr) {
        console.warn('Could not save session to sessionStorage (upload still succeeded):', persistErr)
      }

      setIsParsed(true)
      setIsParsing(false)
      setStatus(`Parsed successfully. Extracted ${text.length} characters. Click Start Verification to generate interview questions.`)
    } catch (uploadError) {
      clearRampInterval()
      setProgress(0)
      const msg = uploadError?.message || String(uploadError)
      const isNetwork =
        uploadError?.name === 'TypeError' &&
        (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed'))
      setError(
        isNetwork
          ? 'Cannot connect to the API on port 5000. In a separate terminal: cd backend → npm start (or npm run dev) and keep it running until you see "Server running on http://localhost:5000". The frontend alone is not enough—upload goes through Vite to that server. If the Vite window shows "ECONNREFUSED 127.0.0.1:5000", nothing was listening on 5000 when you tried.'
          : msg || 'Failed to parse resume',
      )
      setIsParsed(false)
      setParsedData(null)
      setDetectedSkills([])
      setResumeText('')
      setIsParsing(false)
      setIsGeneratingQuestions(false)
    }
  }

  async function handleStartVerification() {
    if (!isParsed || !resumeText.trim() || isParsing) return
    setGenerateError('')
    setIsGeneratingQuestions(true)
    try {
      const questions = await requestGenerateQuestions(resumeText.trim())
      if (!questions.length) {
        throw new Error('No questions returned from the server')
      }
      persistGeneratedQuestions(questions)
      try {
        persistSessionFromUpload({
          text: resumeText,
          skills: detectedSkills,
          jobDescription,
        })
      } catch (persistErr) {
        console.warn('Could not persist session:', persistErr)
      }
      navigate('/interview')
    } catch (err) {
      console.error('API error:', err)
      setGenerateError(err?.message || 'Failed to generate questions')
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const parseDisabled = !fileSelected || isBusy
  const verifyDisabled = !isParsed || isBusy || !resumeText.trim()

  const showProgressBlock = isBusy || isParsed
  const showSkillsLoading = isParsing

  const progressPhase = isGeneratingQuestions ? 'generating' : isParsing ? 'parsing' : null

  return (
    <div className="space-y-6">
      <Stepper current={1} total={4} />
      <GlassCard className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Upload Resume</h2>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border-2 border-dashed border-cyan-400/65 bg-surface-2/70 p-12 text-center neon-outline transition hover:scale-[1.01]">
            <UploadCloud className="mx-auto mb-3 text-cyan-300" />
            <p className="text-lg font-semibold text-text-primary">Drag & Drop your resume or click to browse</p>
            <p className="text-sm text-text-secondary">PDF up to 10MB</p>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              disabled={isBusy}
              className="mx-auto mt-4 block w-full max-w-xs cursor-pointer text-sm text-text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:font-semibold file:text-cyan-300 hover:file:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="glass-panel rounded-2xl p-4">
            <p className="mb-3 text-sm font-semibold text-text-primary">Detected Skills</p>
            {showSkillsLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-text-secondary">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" aria-hidden />
                <span>Parsing Resume...</span>
              </div>
            ) : isParsed ? (
              <div className="space-y-2 text-sm">
                {detectedSkills.length ? (
                  detectedSkills.map((skill) => (
                    <div key={skill} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-text-secondary">{skill}</span>
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg bg-white/5 px-3 py-4 text-text-secondary">No skills detected</p>
                )}
              </div>
            ) : (
              <p className="rounded-lg bg-white/5 px-3 py-4 text-sm text-text-secondary">
                Skills will appear here after you upload and parse your resume.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Paste Job Description (Optional)</label>
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            disabled={isBusy}
            className="input resize-none border-cyan-400/25 bg-surface-2/70 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Paste role requirements, responsibilities, and must-have skills..."
          />
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-cyan-400" />
            <div>
              <p className="font-medium text-text-primary">{selectedFileMeta.name}</p>
              <p className="text-sm text-text-secondary">{selectedFileMeta.size}</p>
            </div>
          </div>
          {showProgressBlock ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={14} className="text-cyan-300" />
                  {progressPhaseLabel(progress, progressPhase)}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-1">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        {isParsed && parsedData?.text ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Extracted text (preview)</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border/80 bg-surface-2/80 p-3 text-xs leading-relaxed text-text-secondary">
              {parsedData.text.slice(0, 4000)}
              {parsedData.text.length > 4000 ? '…' : ''}
            </div>
          </div>
        ) : null}
        <Button className="w-full" onClick={handleParseResume} type="button" disabled={parseDisabled}>
          Upload & Parse Resume
        </Button>
        {status ? <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">{status}</p> : null}
        {generateError && isParsed ? (
          <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">{generateError}</p>
        ) : null}
        {error && !isParsed ? (
          <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p>
        ) : null}
        <Button className="w-full" type="button" disabled={verifyDisabled} onClick={handleStartVerification}>
          Start Verification
        </Button>
      </GlassCard>
    </div>
  )
}
