import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchPatientsThunk,
  deletePatientThunk,
  selectPatients,
  selectPatientsTotal,
  selectPatientStatus,
} from '../../redux/slices/patientSlice'
import { selectUserRole } from '../../redux/slices/authSlice'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import { SkeletonTable } from '../../components/Skeletons'
import {
  RiUserAddLine,
  RiEyeLine,
  RiEditLine,
  RiDeleteBin7Line,
  RiStethoscopeLine,
  RiCloseLine,
  RiFilter3Line,
} from 'react-icons/ri'
import { toast } from 'sonner'
import { calculateAge } from '../../lib/utils'
import './PatientListPage.css'

export default function PatientListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const cancerTypeSite = searchParams.get('cancer_type_site') || ''
  const patients = useSelector(selectPatients)
  const total = useSelector(selectPatientsTotal)
  const status = useSelector(selectPatientStatus)
  const role = useSelector(selectUserRole)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const limit = 10
  const isWritable = role === 'SUPER_ADMIN' || role === 'ADMIN'

  useEffect(() => {
    dispatch(fetchPatientsThunk({ page, limit, search, cancer_type_site: cancerTypeSite }))
  }, [dispatch, page, search, cancerTypeSite])

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await dispatch(deletePatientThunk(deleteId)).unwrap()
      toast.success('Patient record deleted successfully.')
      dispatch(fetchPatientsThunk({ page, limit, search }))
    } catch (err) {
      toast.error(err || 'Failed to delete record.')
    } finally {
      setDeleteId(null)
    }
  }

  const clearSiteFilter = () => {
    searchParams.delete('cancer_type_site')
    setSearchParams(searchParams)
  }

  const columns = [
    {
      header: 'Patient Code',
      accessor: 'patient_code',
      cell: (row) => (
        <span
          onClick={() => navigate(`/patients/${row.id}`)}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-blue dark:text-sky-300 bg-brand-blue/8 dark:bg-sky-500/15 border border-brand-blue/20 dark:border-sky-400/25 px-2.5 py-1 rounded-md cursor-pointer hover:bg-brand-blue/15 transition-colors whitespace-nowrap"
          title="Open Patient Profile"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-sky-400 shrink-0" />
          {row.patient_code}
        </span>
      ),
    },
    {
      header: 'Name',
      accessor: 'full_name',
      cell: (row) => {
        const age = calculateAge(row.date_of_birth)
        const initials = (row.full_name || 'P')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase()

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/15 to-sky-500/15 border border-indigo-500/25 flex items-center justify-center text-[11px] font-bold text-brand-navy dark:text-sky-300 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink-primary text-sm truncate leading-snug">
                {row.full_name}
              </p>
              <p className="text-[11px] text-ink-secondary font-medium mt-0.5">
                {row.gender}
                {age !== '' ? ` · ${age} yrs` : ''}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Diagnosis / Stage',
      accessor: 'primary_diagnosis',
      headerClassName: 'hidden sm:table-cell',
      cellClassName: 'hidden sm:table-cell',
      cell: (row) => (
        <div className="space-y-1 max-w-xs">
          <p className="text-xs sm:text-sm font-semibold text-ink-primary truncate">
            {row.primary_diagnosis}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
              {row.cancer_stage}
            </span>
            {row.cancer_type_site && (
              <span className="text-ink-secondary font-medium">
                ({row.cancer_type_site})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'treatment_status',
      cell: (row) => <StatusBadge status={row.treatment_status} />,
    },
    {
      header: 'Assigned Care',
      accessor: 'assigned_doctor',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink-primary">
            <RiStethoscopeLine size={13} className="text-brand-blue dark:text-sky-400 shrink-0" />
            <span className="truncate">{row.assigned_doctor || 'Unassigned'}</span>
          </div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-brand-blue dark:text-sky-400 pl-5">
            {row.department || 'ONCOLOGY'}
          </p>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="onco-action-btn onco-action-view"
            onClick={() => navigate(`/patients/${row.id}`)}
            title="View Chart"
            aria-label={`View chart for ${row.full_name}`}
          >
            <RiEyeLine size={15} />
          </button>

          {isWritable && (
            <button
              type="button"
              className="onco-action-btn onco-action-edit"
              onClick={() => navigate(`/patients/${row.id}/edit`)}
              title="Edit Chart"
              aria-label={`Edit chart for ${row.full_name}`}
            >
              <RiEditLine size={15} />
            </button>
          )}

          {isWritable && (
            <button
              type="button"
              className="onco-action-btn onco-action-delete"
              onClick={() => {
                setDeleteId(row.id)
                setConfirmOpen(true)
              }}
              title="Delete Record"
              aria-label={`Delete record for ${row.full_name}`}
            >
              <RiDeleteBin7Line size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="onco-reg-root space-y-5 pb-4">
      {/* ── Clinical Registry Header Banner ──────────────────────────────── */}
      <div className="onco-reg-banner onco-reg-anim-1">
        {/* Decorative Molecular Lattice SVG */}
        <svg
          width="170"
          height="84"
          viewBox="0 0 170 84"
          fill="none"
          aria-hidden="true"
          className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.09] dark:opacity-[0.14] hidden md:block pointer-events-none text-brand-navy dark:text-sky-400"
        >
          <polygon
            points="50,14 74,28 74,56 50,70 26,56 26,28"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <polygon
            points="98,14 122,28 122,56 98,70 74,56 74,28"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <circle cx="50" cy="14" r="3" fill="currentColor" />
          <circle cx="74" cy="28" r="3" fill="currentColor" />
          <circle cx="74" cy="56" r="3" fill="currentColor" />
          <circle cx="98" cy="14" r="3" fill="currentColor" />
          <circle cx="122" cy="42" r="3" fill="currentColor" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-ink-secondary"
            >
              <Link
                to="/dashboard"
                className="font-semibold text-brand-blue dark:text-sky-400 hover:underline transition-colors"
              >
                Dashboard
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-ink-secondary font-medium">Patient Register</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                Onco Register
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] bg-brand-blue/10 dark:bg-sky-500/15 text-brand-navy dark:text-sky-300 border border-brand-blue/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Longitudinal Cohort
              </span>
            </div>

            <p className="text-xs sm:text-sm text-ink-secondary max-w-xl">
              Centralized oncology patient directory, staging classifications, and assigned multidisciplinary care teams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {cancerTypeSite && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <RiFilter3Line size={14} />
                <span>Site: {cancerTypeSite}</span>
                <button
                  type="button"
                  onClick={clearSiteFilter}
                  className="ml-1 p-0.5 rounded hover:bg-indigo-500/20 cursor-pointer"
                  title="Clear site filter"
                >
                  <RiCloseLine size={14} />
                </button>
              </div>
            )}

            {isWritable && (
              <button
                type="button"
                className="onco-btn-register"
                onClick={() => navigate('/patients/new')}
              >
                <RiUserAddLine size={16} />
                <span>Register Patient</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Patient Data Table ───────────────────────────────────────────── */}
      <div className="onco-reg-anim-2">
        {status === 'loading' && patients.length === 0 ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <DataTable
            columns={columns}
            items={patients}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onSearchChange={setSearch}
            searchPlaceholder="Search patients by name or code..."
            emptyMessage="No patients found matching the criteria."
          />
        )}
      </div>

      {/* Confirmation delete modal */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient Record?"
        description="This will permanently delete the clinical patient profile. This action will be logged in the system audit trail."
        confirmText="Delete Record"
        isDestructive
      />
    </div>
  )
}
