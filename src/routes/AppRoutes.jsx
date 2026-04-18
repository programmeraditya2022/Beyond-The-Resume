import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import InterviewPage from '../pages/InterviewPage.jsx'
import AuthLoginPage from '../pages/AuthLoginPage.jsx'
import AuthenticationPage from '../pages/AuthenticationPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import ProcessingPage from '../pages/ProcessingPage.jsx'
import ProgressTrackerPage from '../pages/ProgressTrackerPage.jsx'
import ResultsPage from '../pages/ResultsPage.jsx'
import UploadPage from '../pages/UploadPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<AuthLoginPage />} />
      <Route path="/authentication" element={<AuthenticationPage />} />
      <Route path="/auth" element={<AuthenticationPage />} />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview"
        element={
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="/processing" element={<ProcessingPage />} />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressTrackerPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
