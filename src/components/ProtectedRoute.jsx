import { Navigate } from 'react-router-dom'
import { hasSessionAccess } from '../utils/auth.js'

export default function ProtectedRoute({ children }) {
  if (!hasSessionAccess()) {
    return <Navigate to="/auth" replace />
  }

  return children
}
