import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import Stepper from '../components/ui/Stepper.jsx'
import Button from '../components/ui/Button.jsx'
import useTypewriter from '../hooks/useTypewriter.js'
import { persistInterviewAnswers, readGeneratedQuestions, readSession } from '../lib/analysisEngine.js'
import { PENDING_ATTEMPT_FLAG } from '../utils/attempts.js'

export default function InterviewPage() {
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  const interviewQuestions = useMemo(() => {
    const api = readGeneratedQuestions()
    if (!api?.length) return []
    return api.map((q) => ({
      id: q.id,
      question: q.question,
      skill: q.skill || `Question ${q.id}`,
    }))
  }, [])

  useEffect(() => {
    const q = readGeneratedQuestions()
    const { resumeText } = readSession()
    if (!q?.length || !String(resumeText || '').trim()) {
      navigate('/upload', { replace: true })
    }
  }, [navigate])

  const total = interviewQuestions.length
  const activeQuestion = interviewQuestions[currentIndex] ?? {
    question: 'Loading interview…',
    skill: '—',
  }
  const typedQuestion = useTypewriter(activeQuestion.question, 18)

  const answerWordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const progressValue = useMemo(() => {
    if (!total) return 0
    const base = (currentIndex / total) * 78
    const tail = Math.min(22, (answerWordCount / Math.max(40, total * 35)) * 22)
    return Math.min(100, Math.round(base + tail))
  }, [currentIndex, total, answerWordCount])

  const questionProgressLabel = total ? `${Math.min(currentIndex + 1, total)}/${total}` : '0/0'

  function handleContinue() {
    if (!total) return
    const trimmed = answer.trim()
    const nextAnswers = [...answers, trimmed]

    if (currentIndex + 1 >= total) {
      const items = interviewQuestions.map((q, i) => ({
        question: q.question,
        skill: q.skill,
        answer: nextAnswers[i] ?? '',
      }))
      persistInterviewAnswers(items)
      sessionStorage.setItem(PENDING_ATTEMPT_FLAG, '1')
      navigate('/processing')
      return
    }

    setAnswers(nextAnswers)
    setCurrentIndex((prev) => prev + 1)
    setAnswer('')
  }

  return (
    <div className="space-y-6">
      <Stepper current={2} total={4} />
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/60 px-4 py-2 text-sm">
        <span className="text-text-secondary">Question Progress</span>
        <span className="font-semibold text-cyan-300">{questionProgressLabel}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <p className="text-sm font-semibold text-cyan-400">Skill Under Test: {activeQuestion.skill}</p>
          <h3 className="text-xl font-semibold text-text-primary">AI Interview Chat</h3>
          <div className="space-y-4 rounded-2xl border border-border/70 bg-surface-2/70 p-4">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-cyan-400/35 bg-cyan-500/12 px-4 py-3 text-text-primary shadow-[0_0_24px_-14px_rgba(34,211,238,0.9)]">
                {typedQuestion}
              </div>
            </div>
            <div className="flex items-center gap-2 pl-1 text-xs text-text-secondary">
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
              <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
              <span>AI is typing...</span>
            </div>
          </div>
          <ProgressBar label="Interview Progress" value={progressValue} />
        </GlassCard>
        <GlassCard className="space-y-4">
          <h3 className="text-xl font-semibold text-text-primary">Your Response</h3>
          <div className="space-y-4 rounded-2xl border border-border/70 bg-surface-2/70 p-4">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-indigo-500/25 bg-indigo-500/12 px-4 py-2 text-sm text-text-secondary">
                Share your response with practical examples and clear trade-offs.
              </div>
            </div>
            <textarea
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="input resize-none border-cyan-300/25 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.12),0_0_22px_-10px_rgba(34,211,238,0.9)]"
              placeholder="Type your answer with architecture choices, trade-offs, and examples..."
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleContinue}>
              Submit & Continue
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
