import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiUserHeartLine,
  RiCalendarCheckLine,
  RiTestTubeLine,
  RiUserSettingsLine,
  RiGraduationCapLine,
  RiPulseLine,
  RiArrowRightUpLine,
  RiMicroscopeLine,
  RiBarChartGroupedLine,
  RiShieldCrossLine,
} from 'react-icons/ri'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import dashboardService from '../../services/dashboardService'
import './DashboardPage.css'

// ── Color & Gradient Palette for Clinical Cohorts ──────────────────────────
const COHORT_PALETTE = [
  {
    gradient: 'from-blue-600 via-indigo-500 to-cyan-400',
    hex: '#4F46E5',
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    hex: '#10B981',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    hex: '#F43F5E',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    dot: 'bg-rose-500',
  },
  {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    hex: '#F59E0B',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  {
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    hex: '#8B5CF6',
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    dot: 'bg-violet-500',
  },
  {
    gradient: 'from-sky-500 via-cyan-500 to-teal-400',
    hex: '#06B6D4',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    dot: 'bg-sky-500',
  },
]

// ── Smooth Animated Counter Hook ───────────────────────────────────────────
function useAnimatedNumber(targetValue, loading, duration = 750) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (loading) return
    const target = Number(targetValue) || 0
    if (target === 0) {
      setDisplayValue(0)
      return
    }
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplayValue(target)
      return
    }

    let rafId
    const startTime = performance.now()
    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(target * eased))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [targetValue, loading, duration])

  return displayValue
}

// ── Decorative Molecular Node Watermark SVG ────────────────────────────────
function MolecularWatermark() {
  return (
    <svg
      width="84"
      height="84"
      viewBox="0 0 84 84"
      fill="none"
      aria-hidden="true"
      className="absolute -bottom-3 -right-3 opacity-[0.055] dark:opacity-[0.09] pointer-events-none select-none"
    >
      <circle cx="42" cy="42" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="42" cy="24" r="3.5" fill="currentColor" />
      <circle cx="58" cy="51" r="3.5" fill="currentColor" />
      <circle cx="26" cy="51" r="3.5" fill="currentColor" />
      <line x1="42" y1="24" x2="58" y2="51" stroke="currentColor" strokeWidth="1.2" />
      <line x1="58" y1="51" x2="26" y2="51" stroke="currentColor" strokeWidth="1.2" />
      <line x1="26" y1="51" x2="42" y2="24" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

// ── KPI Stat Card ──────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const animatedVal = useAnimatedNumber(value, loading)

  if (loading) {
    return (
      <div className="onco-stat-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-24 h-3.5 bg-surface-hover rounded animate-pulse" />
          <div className="w-10 h-10 bg-surface-hover rounded-xl animate-pulse" />
        </div>
        <div className="w-16 h-8 bg-surface-hover rounded animate-pulse" />
        <div className="w-28 h-3 bg-surface-hover rounded animate-pulse" />
      </div>
    )
  }

  const themeConfig = {
    navy: {
      cardClass: 'onco-stat-indigo text-indigo-600 dark:text-indigo-400',
      iconWrap:
        'bg-gradient-to-br from-indigo-500/15 to-blue-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm',
      dot: 'bg-indigo-500',
    },
    blue: {
      cardClass: 'onco-stat-cyan text-sky-600 dark:text-sky-400',
      iconWrap:
        'bg-gradient-to-br from-sky-500/15 to-cyan-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-sm',
      dot: 'bg-sky-500',
    },
    active: {
      cardClass: 'onco-stat-teal text-emerald-600 dark:text-emerald-400',
      iconWrap:
        'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm',
      dot: 'bg-emerald-500',
    },
    attention: {
      cardClass: 'onco-stat-amber text-amber-600 dark:text-amber-400',
      iconWrap:
        'bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm',
      dot: 'bg-amber-500',
    },
    light: {
      cardClass: 'onco-stat-violet text-violet-600 dark:text-violet-400',
      iconWrap:
        'bg-gradient-to-br from-violet-500/15 to-purple-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm',
      dot: 'bg-violet-500',
    },
  }

  const theme = themeConfig[color] || themeConfig.blue

  return (
    <div className={`onco-stat-card ${theme.cardClass}`}>
      <MolecularWatermark />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wider truncate mb-1.5">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-ink-primary tabular-nums tracking-tight leading-none">
            {value !== undefined && value !== null ? animatedVal : '0'}
          </p>
        </div>
        <div className={`onco-stat-icon ${theme.iconWrap}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="relative z-10 mt-3.5 pt-2.5 border-t border-surface-border/60 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} shrink-0`} />
        <span className="text-[11px] font-medium text-ink-secondary truncate">
          {subtitle}
        </span>
      </div>
    </div>
  )
}

// ── Multi-Segment Clinical Donut Ring SVG ──────────────────────────────────
function CohortDonutChart({ distribution, totalClassified }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const topSlices = distribution.slice(0, 6)
  let cumulativePercent = 0

  return (
    <div className="relative flex items-center justify-center my-2">
      <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
        {/* Background track ring */}
        <circle
          cx="74"
          cy="74"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="12"
          className="text-surface-hover dark:text-slate-800"
        />
        {topSlices.map((item, idx) => {
          const pct = totalClassified > 0 ? item.count / totalClassified : 0
          const strokeDasharray = `${Math.max(pct * circumference - 2, 1)} ${circumference}`
          const strokeDashoffset = -cumulativePercent * circumference
          cumulativePercent += pct
          const palette = COHORT_PALETTE[idx % COHORT_PALETTE.length]

          return (
            <circle
              key={item.cancer_type}
              cx="74"
              cy="74"
              r={radius}
              fill="transparent"
              stroke={palette.hex}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )
        })}
      </svg>

      {/* Center Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-2xl font-extrabold text-ink-primary tabular-nums leading-none">
          {totalClassified}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-secondary mt-1">
          Cases
        </span>
      </div>
    </div>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [barsReady, setBarsReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats()
        if (isMounted) {
          setStats(res.data)
          setLoading(false)
          requestAnimationFrame(() => {
            if (isMounted) setBarsReady(true)
          })
        }
      } catch {
        if (isMounted) setLoading(false)
      }
    }
    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  const distribution = stats?.cancer_distribution || []
  const totalClassified = distribution.reduce((acc, item) => acc + (item.count || 0), 0)
  const maxCount = distribution.length > 0 ? Math.max(...distribution.map((d) => d.count), 1) : 1
  const totalPatients = stats?.total_patients || 0
  const activeTreatments = stats?.active_treatments || 0
  const activeRatio = totalPatients > 0 ? Math.min(Math.round((activeTreatments / totalPatients) * 100), 100) : 0

  return (
    <div className="onco-dash-root space-y-6 pb-4">
      {/* ── Clinical Intelligence Header Banner ──────────────────────────── */}
      <div className="onco-header-banner onco-anim-1">
        <div className="onco-header-glow" />

        {/* Subtle decorative DNA / molecular lattice graphic */}
        <svg
          width="180"
          height="90"
          viewBox="0 0 180 90"
          fill="none"
          aria-hidden="true"
          className="onco-header-dna hidden md:block text-brand-navy dark:text-sky-400"
        >
          <path
            d="M10 20 C 45 20, 45 70, 80 70 C 115 70, 115 20, 150 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M10 70 C 45 70, 45 20, 80 20 C 115 20, 115 70, 150 70"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line x1="28" y1="31" x2="28" y2="59" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="62" y1="31" x2="62" y2="59" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="98" y1="31" x2="98" y2="59" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="132" y1="31" x2="132" y2="59" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <circle cx="80" cy="45" r="4" fill="currentColor" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-blue/10 dark:bg-sky-500/15 border border-brand-blue/20 dark:border-sky-400/25 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-navy dark:text-sky-300">
                Clinical Intelligence Telemetry
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                Onco Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary max-w-xl">
              Real-time oncology patient registry, active treatment protocols, and primary site classification metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex items-center gap-2 text-xs text-ink-secondary bg-surface-card/90 backdrop-blur border border-surface-border px-3.5 py-2 rounded-xl font-medium shadow-sm">
              <RiPulseLine size={15} className="text-brand-blue dark:text-sky-400 shrink-0" />
              <span className="font-mono">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Five KPI Statistic Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 onco-anim-2">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients}
          subtitle="Cumulative Oncology Registry"
          icon={RiUserHeartLine}
          color="navy"
          loading={loading}
        />
        <StatCard
          title="Today's Registrations"
          value={stats?.today_registrations}
          subtitle="24-Hour Clinical Intake"
          icon={RiCalendarCheckLine}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Active Treatments"
          value={stats?.active_treatments}
          subtitle="Ongoing Care Protocols"
          icon={RiTestTubeLine}
          color="active"
          loading={loading}
        />
        <StatCard
          title="Total Admins"
          value={stats?.total_admins}
          subtitle="Authorized Clinical Staff"
          icon={RiUserSettingsLine}
          color="attention"
          loading={loading}
        />
        <StatCard
          title="Total Students"
          value={stats?.total_students}
          subtitle="Approved Research Fellows"
          icon={RiGraduationCapLine}
          color="light"
          loading={loading}
        />
      </div>

      {/* ── Cancer Type Distribution & Clinical Cohort Visualization ─────── */}
      {!loading && distribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 onco-anim-3">
          {/* Primary Bar Visualization Panel */}
          <Card className="onco-glass-panel lg:col-span-8 border-0">
            <CardHeader className="pb-4 border-b border-surface-border/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-blue/10 dark:bg-sky-500/15 flex items-center justify-center text-brand-blue dark:text-sky-400">
                      <RiBarChartGroupedLine size={16} />
                    </div>
                    <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider">
                      Patient Volume by Cancer Type
                    </CardTitle>
                  </div>
                  <p className="text-xs text-ink-secondary pl-9">
                    Select any primary oncology classification to inspect filtered patient records
                  </p>
                </div>

                {/* Calibration scale legend */}
                <div className="flex items-center gap-2 self-start sm:self-center pl-9 sm:pl-0">
                  <span className="text-[11px] font-semibold text-ink-secondary bg-surface-base border border-surface-border px-2.5 py-1 rounded-lg">
                    {distribution.length} {distribution.length === 1 ? 'Site' : 'Sites'} Tracked
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-brand-navy dark:text-sky-300 bg-brand-blue/10 dark:bg-sky-500/15 border border-brand-blue/20 px-2.5 py-1 rounded-lg">
                    Peak: {maxCount}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-3">
              {distribution.map((item, index) => {
                const palette = COHORT_PALETTE[index % COHORT_PALETTE.length]
                const barWidthPct = barsReady ? (item.count / maxCount) * 100 : 0
                const shareOfTotal =
                  totalClassified > 0 ? ((item.count / totalClassified) * 100).toFixed(1) : '0.0'
                const rankLabel = String(index + 1).padStart(2, '0')
                const isUnspecified = item.cancer_type === '-' || !item.cancer_type?.trim()

                return (
                  <div
                    key={item.cancer_type}
                    className="onco-cohort-row group cursor-pointer"
                    onClick={() =>
                      navigate(`/patients?cancer_type_site=${encodeURIComponent(item.cancer_type)}`)
                    }
                    title={`View ${item.cancer_type} patients (${item.count})`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      {/* Left: Rank + Dot + Cancer Site Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-ink-disabled w-5 shrink-0">
                          {rankLabel}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${palette.dot} shrink-0 shadow-sm`} />
                        <span className="text-xs sm:text-sm font-bold text-ink-primary truncate group-hover:text-brand-blue dark:group-hover:text-sky-400 transition-colors">
                          {item.cancer_type}
                        </span>
                        {isUnspecified && (
                          <span className="text-[10px] font-medium text-ink-secondary bg-surface-hover px-2 py-0.5 rounded-md">
                            Unclassified Site
                          </span>
                        )}
                      </div>

                      {/* Right: Share % + Patient Count + Interactive Arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block text-[11px] font-mono font-medium text-ink-secondary">
                          {shareOfTotal}% of cohort
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${palette.badge}`}
                        >
                          {item.count} {item.count === 1 ? 'patient' : 'patients'}
                        </span>
                        <RiArrowRightUpLine
                          size={15}
                          className="text-ink-disabled group-hover:text-brand-blue dark:group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        />
                      </div>
                    </div>

                    {/* Calibrated Progress Bar */}
                    <div className="onco-progress-track">
                      <div
                        className={`onco-progress-fill bg-gradient-to-r ${palette.gradient}`}
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Companion Panel: Cohort Composition & Protocol Intelligence */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="onco-glass-panel border-0 flex-1 flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-surface-border/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <RiMicroscopeLine size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                      Cohort Distribution Ratio
                    </CardTitle>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Proportional breakdown across top sites
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                <CohortDonutChart distribution={distribution} totalClassified={totalClassified} />

                {/* Top Sites Compact Legend */}
                <div className="space-y-2 pt-2 border-t border-surface-border/60">
                  {distribution.slice(0, 5).map((item, idx) => {
                    const palette = COHORT_PALETTE[idx % COHORT_PALETTE.length]
                    const pct =
                      totalClassified > 0 ? ((item.count / totalClassified) * 100).toFixed(1) : '0.0'
                    return (
                      <div
                        key={item.cancer_type}
                        onClick={() =>
                          navigate(`/patients?cancer_type_site=${encodeURIComponent(item.cancer_type)}`)
                        }
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-surface-hover/70 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${palette.dot} shrink-0`} />
                          <span className="font-semibold text-ink-primary truncate">
                            {item.cancer_type === '-' ? '- (Unspecified)' : item.cancer_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="text-ink-secondary text-[11px]">{pct}%</span>
                          <span className="font-bold text-ink-primary w-6 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Active Protocol Coverage Meter */}
                <div className="p-3.5 rounded-xl bg-surface-base/90 border border-surface-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink-primary">
                      <RiShieldCrossLine size={14} className="text-emerald-500" />
                      Active Protocol Coverage
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {activeRatio}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-hover overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${barsReady ? activeRatio : 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-ink-secondary leading-snug">
                    {activeTreatments} of {totalPatients} registered patients currently under active oncology protocol management.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
