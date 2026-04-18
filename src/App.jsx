import { useLocation } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  const location = useLocation()

  return (
    <AppLayout>
      <div key={location.pathname} className="min-h-[calc(100vh-4rem)] animate-[fadeIn_0.35s_ease-out]">
        <AppRoutes />
      </div>
    </AppLayout>
  )
}

export default App
