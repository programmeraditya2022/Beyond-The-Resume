import clsx from 'clsx'

const statusStyles = {
  Strong: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  Average: 'bg-amber-400/20 text-amber-500 border-amber-500/30',
  Weak: 'bg-rose-500/20 text-rose-500 border-rose-500/30',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={clsx(
        'rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
        statusStyles[status] ?? statusStyles.Average,
      )}
    >
      {status}
    </span>
  )
}
