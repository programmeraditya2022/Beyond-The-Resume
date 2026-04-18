export default function ProgressBar({ value, label }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-text-secondary">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
