import { cn } from '@/lib/utils'

const STATUS_MAP = {
  'Newly Diagnosed': {
    bg: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-500/25',
    dot: 'bg-indigo-500',
    pulse: false,
    label: 'Newly Diagnosed',
  },
  NEWLY_DIAGNOSED: {
    bg: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-500/25',
    dot: 'bg-indigo-500',
    pulse: false,
    label: 'Newly Diagnosed',
  },
  'Under Treatment': {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-500/25',
    dot: 'bg-emerald-500',
    pulse: true,
    label: 'Under Treatment',
  },
  UNDER_TREATMENT: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-500/25',
    dot: 'bg-emerald-500',
    pulse: true,
    label: 'Under Treatment',
  },
  'In Remission': {
    bg: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-500/25',
    dot: 'bg-sky-500',
    pulse: false,
    label: 'In Remission',
  },
  IN_REMISSION: {
    bg: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-500/25',
    dot: 'bg-sky-500',
    pulse: false,
    label: 'In Remission',
  },
  Palliative: {
    bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/25',
    dot: 'bg-amber-500',
    pulse: false,
    label: 'Palliative',
  },
  PALLIATIVE: {
    bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/25',
    dot: 'bg-amber-500',
    pulse: false,
    label: 'Palliative',
  },
  Discharged: {
    bg: 'bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-500/25',
    dot: 'bg-slate-400',
    pulse: false,
    label: 'Discharged',
  },
  DISCHARGED: {
    bg: 'bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-500/25',
    dot: 'bg-slate-400',
    pulse: false,
    label: 'Discharged',
  },
}

export default function StatusBadge({ status, className }) {
  const config = STATUS_MAP[status] || {
    bg: 'bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-500/25',
    dot: 'bg-slate-400',
    pulse: false,
    label: status || 'Unknown',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide shadow-2xs transition-all duration-200 whitespace-nowrap',
        config.bg,
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          config.dot,
          config.pulse && 'animate-pulse'
        )}
      />
      {config.label}
    </span>
  )
}
