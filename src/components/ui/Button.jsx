import clsx from 'clsx'

const styles = {
  primary:
    'btn-gradient-primary text-white shadow-[0_12px_30px_-10px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_34px_-14px_rgba(139,92,246,0.5)]',
  secondary:
    'bg-surface-2 text-text-primary border border-border hover:-translate-y-0.5 hover:bg-surface-1',
  ghost: 'text-text-secondary hover:bg-surface-1 hover:-translate-y-0.5',
}

export default function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
