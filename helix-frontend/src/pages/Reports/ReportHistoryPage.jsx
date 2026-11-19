import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser } from '../../redux/slices/authSlice'
import DataTable from '../../components/DataTable'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../../components/ui/dialog'
import { SkeletonTable } from '../../components/Skeletons'
import reportService from '../../services/reportService'
import { toast } from 'sonner'
import {
  RiSearchLine,
  RiAddLine,
  RiEditLine,
  RiHistoryLine,
  RiFileList2Line,
  RiDeleteBin7Line,
  RiSettings4Line,
  RiEyeLine,
  RiSparklingLine,
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiDraftLine,
  RiUserHeartLine,
  RiRefreshLine,
  RiCloseLine,
  RiPrinterLine,
  RiSortDesc,
  RiStethoscopeLine,
  RiCalendarCheckLine,
  RiFlaskLine,
  RiShieldCheckLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri'
import ConfirmDialog from '../../components/ConfirmDialog'
import './ReportsModule.css'

const STATUS_FILTERS = ['ALL', 'Completed', 'Verified', 'Draft', 'Printed']

export default function ReportHistoryPage() {
  const navigate = useNavigate()
  const currentUser = useSelector(selectUser)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  // Query & Filter States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'patient' | 'report_no'
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])

  // Modal States
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLogs, setHistoryLogs] = useState([])
  const [historyReportNumber, setHistoryReportNumber] = useState('')

  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versionsList, setVersionsList] = useState([])
  const [versionsReportNumber, setVersionsReportNumber] = useState('')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteNum, setDeleteNum] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportService.listReports({
        search: search.trim() || undefined,
        page,
        limit,
      })
      const allReports = res.data.reports || []

      // Group by report_number so main list shows latest version of each report
      const grouped = {}
      allReports.forEach((r) => {
        if (!grouped[r.report_number] || grouped[r.report_number].version < r.version) {
          grouped[r.report_number] = r
        }
      })

      setReports(Object.values(grouped))
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to retrieve reports history.')
    } finally {
      setLoading(false)
    }
  }, [page, search, limit])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchReports()
  }

  const handleClearSearch = () => {
    setSearch('')
    setPage(1)
  }

  const handleViewAuditHistory = async (reportNumber) => {
    setHistoryReportNumber(reportNumber)
    setLoading(true)
    try {
      const res = await reportService.getReportHistory(reportNumber)
      setHistoryLogs(res.data || [])
      setHistoryOpen(true)
    } catch {
      toast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewVersions = async (reportNumber) => {
    setVersionsReportNumber(reportNumber)
    setLoading(true)
    try {
      const res = await reportService.getReportVersions(reportNumber)
      setVersionsList(res.data || [])
      setVersionsOpen(true)
    } catch {
      toast.error('Failed to load report versions.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (row) => {
    setSelectedReport(row)
    setDetailsOpen(true)
  }

  const handleDeleteTrigger = (id, reportNumber) => {
    setDeleteId(id)
    setDeleteNum(reportNumber)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await reportService.deleteReport(deleteId)
      toast.success('Report deleted successfully.')
      fetchReports()
    } catch {
      toast.error('Failed to delete report.')
    } finally {
      setDeleteOpen(false)
      setDeleteId(null)
      setDeleteNum('')
    }
  }

  const handlePrint = (reportId) => {
    navigate(`/reports/print/${reportId}?print=true`)
  }

  // Client-side filter & sort over loaded page items
  const processedReports = useMemo(() => {
    let list = [...reports]
    if (statusFilter !== 'ALL') {
      list = list.filter(
        (r) => (r.status || '').toLowerCase() === statusFilter.toLowerCase()
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at || a.report_date) - new Date(b.created_at || b.report_date)
      }
      if (sortBy === 'patient') {
        return (a.patient?.full_name || '').localeCompare(b.patient?.full_name || '')
      }
      if (sortBy === 'report_no') {
        return (b.report_number || '').localeCompare(a.report_number || '')
      }
      // newest default
      return new Date(b.created_at || b.report_date) - new Date(a.created_at || a.report_date)
    })

    return list
  }, [reports, statusFilter, sortBy])

  // Telemetry KPI metrics
  const kpiMetrics = useMemo(() => {
    const finalizedCount = reports.filter((r) =>
      ['completed', 'verified', 'printed'].includes((r.status || '').toLowerCase())
    ).length
    const draftCount = reports.filter(
      (r) => (r.status || '').toLowerCase() === 'draft'
    ).length
    const uniquePatients = new Set(reports.map((r) => r.patient?.patient_code).filter(Boolean)).size

    return {
      totalReports: Math.max(total, reports.length),
      finalizedCount,
      draftCount,
      uniquePatients,
    }
  }, [reports, total])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return {
          cls: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        }
      case 'Completed':
        return {
          cls: 'bg-brand-blue/12 text-brand-blue border-brand-blue/30',
          dot: 'bg-brand-blue',
        }
      case 'Verified':
        return {
          cls: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        }
      case 'Printed':
        return {
          cls: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-500',
        }
      default:
        return {
          cls: 'bg-surface-base text-ink-secondary border-surface-border',
          dot: 'bg-slate-400',
        }
    }
  }

  const columns = [
    {
      header: 'Report Dossier',
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="onco-report-code-pill">
              <RiFileTextLine size={12} />
              {row.report_number}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-surface-base text-ink-secondary border border-surface-border">
              v{row.version || 1}
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary font-medium">
            Lab #{row.lab_number || 'N/A'} · {row.template_name || 'Oxidative Stress Panel'}
          </p>
        </div>
      ),
    },
    {
      header: 'Patient Identity',
      cell: (row) => {
        const initials = (row.patient?.full_name || 'P')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-navy to-brand-blue text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-ink-primary text-xs truncate">
                {row.patient?.full_name || 'Unknown Patient'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-1.5 py-0.2 rounded">
                  {row.patient?.patient_code}
                </span>
                <span className="text-[10px] text-ink-secondary">
                  {row.patient?.gender} · DOB {row.patient?.date_of_birth}
                </span>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Specimen & Date',
      headerClassName: 'hidden sm:table-cell',
      cellClassName: 'hidden sm:table-cell',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-primary">
            <RiCalendarCheckLine size={13} className="text-brand-blue" />
            <span>{row.report_date}</span>
          </div>
          <p className="text-[10px] text-ink-secondary flex items-center gap-1">
            <RiFlaskLine size={11} className="text-cyan-500" />
            <span>Sample: {row.sample_type || 'Serum / Blood'}</span>
          </p>
        </div>
      ),
    },
    {
      header: 'Clinical Signatories',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell',
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
            <RiStethoscopeLine size={13} className="text-brand-blue shrink-0" />
            <span className="truncate">{row.doctor_name || 'Dr. S. Somani'}</span>
          </p>
          <p className="text-[10px] text-ink-secondary truncate">
            Ref: {row.reference_by || 'Self / Institutional'}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      headerClassName: 'hidden sm:table-cell',
      cellClassName: 'hidden sm:table-cell',
      cell: (row) => {
        const badge = getStatusBadge(row.status)
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-extrabold rounded-full uppercase tracking-wider ${badge.cls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {row.status || 'Completed'}
          </span>
        )
      },
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="onco-action-btn"
            onClick={() => navigate(`/reports/edit/${row.id}`)}
            title="Edit Report in Diagnostic Builder"
          >
            <RiEditLine size={15} />
          </button>

          <button
            type="button"
            className="onco-action-btn"
            onClick={() => navigate(`/reports/print/${row.id}`)}
            title="View & Print 3-Page ICSR PDF Report"
          >
            <RiEyeLine size={15} />
          </button>

          <button
            type="button"
            className="onco-action-btn"
            onClick={() => handleViewDetails(row)}
            title="Inspect Measured Biomarker Details"
          >
            <RiFlaskLine size={15} />
          </button>

          <button
            type="button"
            className="onco-action-btn"
            onClick={() => handleViewVersions(row.report_number)}
            title="Document Version History"
          >
            <RiHistoryLine size={15} />
          </button>

          <button
            type="button"
            className="onco-action-btn"
            onClick={() => handleViewAuditHistory(row.report_number)}
            title="Compliance Audit Trail"
          >
            <RiFileList2Line size={15} />
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className="onco-action-btn danger"
              onClick={() => handleDeleteTrigger(row.id, row.report_number)}
              title="Permanently Delete Report"
            >
              <RiDeleteBin7Line size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="onco-receipt-page">
      {/* ── 1. Clinical Hero Header Banner ────────────────────────────────── */}
      <section className="onco-receipt-hero">
        <div className="onco-receipt-hero-inner">
          <div>
            <div className="onco-receipt-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Onco Receipt History</span>
            </div>
            <div className="onco-receipt-eyebrow">
              <RiSparklingLine size={12} />
              <span>Clinical Pathology & Oxidative Biomarker Registry</span>
            </div>
            <h1 className="onco-receipt-title">Onco Receipt & Diagnostic Reports</h1>
            <p className="onco-receipt-subtitle">
              Centralized clinical document repository for 3-page ICSR Oxidative Stress Panels,
              version-controlled diagnostic revisions, and HIPAA-aware print audit trails.
            </p>
          </div>

          {/* Primary Header CTAs */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/reports/settings')}
              className="onco-hero-btn-glass w-full sm:w-auto"
            >
              <RiSettings4Line size={16} className="text-cyan-300" />
              <span>Branding &amp; Parameters</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports/new')}
              className="onco-hero-btn-primary w-full sm:w-auto"
            >
              <RiAddLine size={17} />
              <span>New Pathology Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Telemetry Summary KPI Cards ────────────────────────────────── */}
      <div className="onco-receipt-kpi-grid">
        <div className="onco-receipt-kpi-card">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-secondary truncate">
              Total Reports
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-ink-primary mt-0.5">
              {kpiMetrics.totalReports}
            </p>
            <p className="hidden sm:block text-[11px] text-ink-secondary mt-0.5">
              Version-controlled clinical archive
            </p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-brand-blue/12 text-brand-blue border border-brand-blue/20 flex items-center justify-center shrink-0">
            <RiFileTextLine size={18} className="sm:w-[21px] sm:h-[21px]" />
          </div>
        </div>

        <div className="onco-receipt-kpi-card">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-secondary truncate">
              Verified &amp; Done
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {kpiMetrics.finalizedCount}
            </p>
            <p className="hidden sm:block text-[11px] text-ink-secondary mt-0.5">
              Ready for clinical PDF export
            </p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <RiCheckboxCircleLine size={18} className="sm:w-[21px] sm:h-[21px]" />
          </div>
        </div>

        <div className="onco-receipt-kpi-card">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-secondary truncate">
              Drafts Pending
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {kpiMetrics.draftCount}
            </p>
            <p className="hidden sm:block text-[11px] text-ink-secondary mt-0.5">
              Pending final signatory review
            </p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <RiDraftLine size={18} className="sm:w-[21px] sm:h-[21px]" />
          </div>
        </div>

        <div className="onco-receipt-kpi-card">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-secondary truncate">
              Patients Tested
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
              {kpiMetrics.uniquePatients}
            </p>
            <p className="hidden sm:block text-[11px] text-ink-secondary mt-0.5">
              Distinct patient profiles linked
            </p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <RiUserHeartLine size={18} className="sm:w-[21px] sm:h-[21px]" />
          </div>
        </div>
      </div>

      {/* ── 3. Search, Status Filter & Sort Control Bar ───────────────────── */}
      <div className="onco-receipt-toolbar">
        <form onSubmit={handleSearchSubmit} className="onco-receipt-search-box">
          <RiSearchLine
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, code, or report #..."
            className="onco-receipt-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink-primary cursor-pointer"
              title="Clear search"
            >
              <RiCloseLine size={16} />
            </button>
          )}
        </form>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter Pills */}
          <div className="onco-filter-pill-group">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`onco-filter-pill ${statusFilter === st ? 'active' : ''}`}
              >
                {st === 'ALL' ? 'All Reports' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <RiSortDesc
                size={14}
                className="absolute left-3 text-ink-secondary pointer-events-none"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort reports"
                className="w-full sm:w-auto h-9 pl-8 pr-3 rounded-xl border border-surface-border bg-surface-base text-xs font-bold text-ink-primary focus:outline-none focus:border-brand-blue cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="patient">Sort: Patient Name (A–Z)</option>
                <option value="report_no">Sort: Report Number</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="onco-action-btn !w-9 !h-9 shrink-0"
              title="Refresh report registry"
              aria-label="Refresh report registry"
            >
              <RiRefreshLine size={16} className={loading ? 'animate-spin text-brand-blue' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Report Registry: Desktop Table + Mobile Diagnostic Cards ───── */}
      {loading && reports.length === 0 ? (
        <>
          <div className="hidden md:block">
            <SkeletonTable rows={5} columns={6} />
          </div>
          <div className="md:hidden space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="onco-mobile-report-card animate-pulse space-y-3"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-36 bg-surface-border rounded-lg" />
                  <div className="h-5 w-20 bg-surface-border rounded-full" />
                </div>
                <div className="h-12 w-full bg-surface-base rounded-xl" />
                <div className="h-9 w-full bg-surface-base rounded-xl" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Desktop Table (Unchanged) */}
          <div className="hidden md:block onco-receipt-table-card">
            <DataTable
              items={processedReports}
              columns={columns}
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              emptyMessage="No pathology reports match the active filter criteria."
            />
          </div>

          {/* Mobile Responsive Cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {processedReports.length === 0 ? (
              <div className="onco-mobile-report-card text-center py-8 items-center">
                <div className="w-11 h-11 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <RiFileTextLine size={22} />
                </div>
                <p className="text-xs font-bold text-ink-primary">No Pathology Reports Found</p>
                <p className="text-[11px] text-ink-secondary max-w-[240px]">
                  No reports match your active search or status filter.
                </p>
              </div>
            ) : (
              processedReports.map((row) => {
                const badge = getStatusBadge(row.status)
                const initials = (row.patient?.full_name || 'P')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <article key={row.id} className="onco-mobile-report-card">
                    {/* Card Header: Report Code + Version + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="onco-report-code-pill truncate">
                          <RiFileTextLine size={12} className="shrink-0" />
                          <span className="truncate">{row.report_number}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-surface-base text-ink-secondary border border-surface-border shrink-0">
                          v{row.version || 1}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-extrabold rounded-full uppercase tracking-wider shrink-0 ${badge.cls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {row.status || 'Completed'}
                      </span>
                    </div>

                    {/* Patient Identity Block */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-base/70 border border-surface-border/80">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-blue text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-ink-primary truncate leading-tight">
                          {row.patient?.full_name || 'Unknown Patient'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-1.5 py-0.2 rounded">
                            {row.patient?.patient_code}
                          </span>
                          <span className="text-[11px] text-ink-secondary truncate">
                            {row.patient?.gender} · DOB {row.patient?.date_of_birth}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clinical Metadata 2-Column Strip */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-surface-base/40 border border-surface-border/60 min-w-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-ink-secondary">
                          Date &amp; Sample
                        </p>
                        <p className="font-bold text-ink-primary truncate mt-0.5">
                          {row.report_date}
                        </p>
                        <p className="text-[10px] text-ink-secondary truncate">
                          {row.sample_type || 'Serum'} · Lab #{row.lab_number || 'N/A'}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-surface-base/40 border border-surface-border/60 min-w-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-ink-secondary">
                          Authorizing Doctor
                        </p>
                        <p className="font-bold text-ink-primary truncate mt-0.5">
                          {row.doctor_name || 'Dr. S. Somani'}
                        </p>
                        <p className="text-[10px] text-ink-secondary truncate">
                          Ref: {row.reference_by || 'Self'}
                        </p>
                      </div>
                    </div>

                    {/* Touch-Friendly Action Controls */}
                    <div className="pt-2 border-t border-surface-border/70 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/reports/print/${row.id}`)}
                          className="onco-mobile-action-primary bg-brand-blue hover:bg-brand-blue-dark text-white"
                        >
                          <RiEyeLine size={15} />
                          <span>View PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/reports/edit/${row.id}`)}
                          className="onco-mobile-action-primary bg-surface-base hover:bg-surface-hover text-ink-primary border border-surface-border"
                        >
                          <RiEditLine size={15} className="text-brand-blue" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(row)}
                          className="flex-1 h-8 rounded-lg border border-surface-border bg-surface-card hover:border-brand-blue text-[11px] font-bold text-ink-secondary hover:text-brand-blue inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RiFlaskLine size={13} />
                          <span>Markers</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewVersions(row.report_number)}
                          className="flex-1 h-8 rounded-lg border border-surface-border bg-surface-card hover:border-brand-blue text-[11px] font-bold text-ink-secondary hover:text-brand-blue inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RiHistoryLine size={13} />
                          <span>Versions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewAuditHistory(row.report_number)}
                          className="flex-1 h-8 rounded-lg border border-surface-border bg-surface-card hover:border-brand-blue text-[11px] font-bold text-ink-secondary hover:text-brand-blue inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RiFileList2Line size={13} />
                          <span>Audit</span>
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTrigger(row.id, row.report_number)}
                            className="w-8 h-8 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-500 inline-flex items-center justify-center shrink-0 cursor-pointer"
                            title="Delete Report"
                            aria-label={`Delete report ${row.report_number}`}
                          >
                            <RiDeleteBin7Line size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })
            )}

            {/* Mobile Pagination Footer */}
            {Math.ceil(total / limit) > 1 && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-card border border-surface-border text-xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-base font-bold text-ink-primary disabled:opacity-45 cursor-pointer"
                >
                  <RiArrowLeftSLine size={15} />
                  <span>Prev</span>
                </button>
                <span className="font-mono text-[11px] font-bold text-ink-secondary">
                  Page <span className="text-ink-primary">{page}</span> /{' '}
                  {Math.ceil(total / limit)}
                </span>
                <button
                  type="button"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-base font-bold text-ink-primary disabled:opacity-45 cursor-pointer"
                >
                  <span>Next</span>
                  <RiArrowRightSLine size={15} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL 1: Document Biomarker Details Inspection ────────────────── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 bg-surface-card border border-surface-border rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="onco-modal-hero">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
                  <RiFlaskLine size={12} /> Diagnostic Biomarker Summary
                </span>
                <DialogTitle className="text-lg font-extrabold !text-white mt-0.5">
                  {selectedReport?.report_number} · v{selectedReport?.version || 1}
                </DialogTitle>
              </div>
              {selectedReport && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/15 text-white border border-white/20">
                  {selectedReport.status}
                </span>
              )}
            </div>
          </div>

          {selectedReport && (
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Patient & Specimen Header Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-surface-base border border-surface-border">
                  <p className="text-[10px] font-bold uppercase text-ink-secondary">Patient</p>
                  <p className="text-xs font-extrabold text-ink-primary truncate mt-0.5">
                    {selectedReport.patient?.full_name}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-base border border-surface-border">
                  <p className="text-[10px] font-bold uppercase text-ink-secondary">Patient Code</p>
                  <p className="text-xs font-mono font-extrabold text-brand-blue mt-0.5">
                    {selectedReport.patient?.patient_code}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-base border border-surface-border">
                  <p className="text-[10px] font-bold uppercase text-ink-secondary">Signatory</p>
                  <p className="text-xs font-extrabold text-ink-primary truncate mt-0.5">
                    {selectedReport.doctor_name}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-base border border-surface-border">
                  <p className="text-[10px] font-bold uppercase text-ink-secondary">Specimen</p>
                  <p className="text-xs font-extrabold text-ink-primary truncate mt-0.5">
                    {selectedReport.sample_type} ({selectedReport.report_date})
                  </p>
                </div>
              </div>

              {/* Measured Biomarker Values Table */}
              <div className="border border-surface-border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-base border-b border-surface-border text-[10px] font-extrabold uppercase tracking-wider text-ink-secondary">
                      <th className="py-2.5 px-3">Biomarker Parameter</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                      <th className="py-2.5 px-3">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {(selectedReport.values || []).map((v) => (
                      <tr key={v.id}>
                        <td className="py-2.5 px-3 font-bold text-ink-primary">
                          {v.parameter_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-extrabold text-brand-blue">
                          {v.result_value} {v.parameter_unit || ''}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-ink-secondary">
                          {v.reference_range}
                        </td>
                        <td className="py-2.5 px-3 text-ink-secondary font-medium">
                          {v.interpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Footer Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(false)
                    navigate(`/reports/edit/${selectedReport.id}`)
                  }}
                  className="px-3.5 py-2 rounded-xl border border-surface-border bg-surface-base hover:bg-surface-hover text-xs font-bold text-ink-primary flex items-center gap-1.5 cursor-pointer"
                >
                  <RiEditLine size={14} />
                  <span>Edit Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(false)
                    navigate(`/reports/print/${selectedReport.id}`)
                  }}
                  className="onco-hero-btn-primary"
                >
                  <RiPrinterLine size={14} />
                  <span>Open & Print PDF</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: Audit Log History ────────────────────────────────────── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 bg-surface-card border border-surface-border rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="onco-modal-hero">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
              <RiShieldCheckLine size={12} /> HIPAA-Aware Document Audit Trail
            </span>
            <DialogTitle className="text-base font-extrabold !text-white mt-0.5 flex items-center gap-2">
              <RiFileList2Line className="text-cyan-300" />
              <span>Audit Logs: {historyReportNumber}</span>
            </DialogTitle>
          </div>

          <div className="p-5 space-y-3.5 max-h-[380px] overflow-y-auto">
            {historyLogs.length === 0 ? (
              <p className="text-xs text-ink-secondary text-center py-6">
                No audit events recorded for this report.
              </p>
            ) : (
              historyLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3.5 border-l-2 border-brand-blue/40 pl-4 py-1.5 relative bg-surface-base/60 rounded-r-xl pr-3"
                >
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-brand-blue -left-[6px] top-3 ring-4 ring-surface-card" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-ink-primary">{log.action}</p>
                      <span className="text-[10px] font-mono text-ink-secondary">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-secondary">
                      Operator: <strong className="text-ink-primary">{log.user_name}</strong> (
                      {log.user_role})
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3.5 bg-surface-base border-t border-surface-border flex justify-end">
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-xs font-bold text-ink-primary cursor-pointer"
            >
              Close Audit Viewer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: Report Version History ───────────────────────────────── */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 bg-surface-card border border-surface-border rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="onco-modal-hero">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
              <RiHistoryLine size={12} /> Longitudinal Revision Archive
            </span>
            <DialogTitle className="text-base font-extrabold !text-white mt-0.5">
              Document Versions: {versionsReportNumber}
            </DialogTitle>
          </div>

          <div className="p-5 space-y-2.5 max-h-[380px] overflow-y-auto">
            {versionsList.map((ver) => {
              const badge = getStatusBadge(ver.status)
              return (
                <div
                  key={ver.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-surface-border bg-surface-base/50 hover:border-brand-blue/40 rounded-xl gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-ink-primary">
                        Version {ver.version}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-extrabold rounded-full uppercase tracking-wider ${badge.cls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {ver.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-1">
                      Committed {new Date(ver.created_at).toLocaleDateString()} by{' '}
                      <strong className="text-ink-primary">
                        {ver.created_by?.full_name || 'Clinical Author'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setVersionsOpen(false)
                        navigate(`/reports/edit/${ver.id}`)
                      }}
                      className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover text-xs font-bold text-ink-primary flex items-center gap-1 cursor-pointer"
                    >
                      <RiEditLine size={13} />
                      <span>Open</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVersionsOpen(false)
                        handlePrint(ver.id)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RiPrinterLine size={13} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3.5 bg-surface-base border-t border-surface-border flex justify-end">
            <button
              type="button"
              onClick={() => setVersionsOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-xs font-bold text-ink-primary cursor-pointer"
            >
              Close Version List
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM: Permanent Report Deletion ────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title="Permanently Delete Diagnostic Report?"
        description={`Are you sure you want to permanently remove report ${deleteNum}? This action is recorded in the compliance audit log and cannot be undone.`}
        confirmText="Confirm Permanent Delete"
        isDestructive
      />
    </div>
  )
}
