import Sidebar from './Sidebar.jsx'

export default function AppLayout({ children }) {
  return (
    <div className="dashboard-shell transition-colors duration-500">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-cyan-500/22 blur-3xl animate-[float_14s_linear_infinite]" />
        <div className="absolute bottom-8 right-1/4 h-72 w-72 rounded-full bg-violet-500/24 blur-3xl animate-[float_12s_linear_infinite_reverse]" />
        <div className="absolute right-[18%] top-[35%] h-60 w-60 rounded-full bg-fuchsia-500/18 blur-3xl animate-[float_17s_linear_infinite]" />
      </div>
      <Sidebar />
      <main className="relative z-10 ml-56 min-h-screen animate-[fadeIn_0.45s_ease-out] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
