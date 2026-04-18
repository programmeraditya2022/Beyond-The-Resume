import clsx from 'clsx'

export default function GlassCard({ className, children, ...rest }) {
  return (
    <div
      {...rest}
      className={clsx(
        'glass-card surface-glow animate-enter rounded-3xl border border-border/70 bg-surface-glass p-6 shadow-card backdrop-blur-xl transition-all duration-300',
        className,
      )}
    >
      {children}
    </div>
  )
}
