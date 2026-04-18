import clsx from 'clsx'

export default function Stepper({ current = 1, total = 4 }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-text-secondary">
        Step {current} of {total}
      </p>
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'h-2 flex-1 rounded-full transition-all',
              index < current
                ? 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                : 'bg-surface-2 border border-border',
            )}
          />
        ))}
      </div>
    </div>
  )
}
