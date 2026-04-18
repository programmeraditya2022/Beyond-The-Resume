/**
 * Returns persisted interview attempts. Prefer `interviewAttempts`; falls back to `attempts`
 * (used by the interview pipeline) so the dashboard stays in sync with real saves.
 */
export const getInterviewData = () => {
  try {
    const primary = localStorage.getItem('interviewAttempts')
    if (primary != null && primary !== '') {
      const data = JSON.parse(primary)
      if (Array.isArray(data) && data.length > 0) return data
    }
    const fallback = localStorage.getItem('attempts')
    const data = fallback ? JSON.parse(fallback) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
