import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchPatientDetailThunk,
  deletePatientThunk,
  selectSelectedPatient,
  selectPatientStatus,
} from '../../redux/slices/patientSlice'
import { selectUserRole } from '../../redux/slices/authSlice'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import {
  RiEditLine,
  RiDeleteBin7Line,
  RiScanLine,
  RiFileTextLine,
  RiDownloadLine,
  RiSearchLine,
  RiFilter3Line,
  RiUpload2Line,
  RiFilePdfLine,
  RiFileWordLine,
  RiImageLine,
  RiCloseLine,
  RiEyeLine,
  RiPencilLine,
  RiCheckLine,
  RiTimeLine,
  RiArrowLeftLine,
  RiUserHeartLine,
  RiMicroscopeLine,
  RiCalendarCheckLine,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiShieldUserLine,
  RiStethoscopeLine,
  RiDropLine,
  RiHospitalLine,
  RiHeartPulseLine,
} from 'react-icons/ri'
import { toast } from 'sonner'
import patientService from '../../services/patientService'
import PhotoSelector from '../../components/PhotoSelector'
import DatePicker from '../../components/DatePicker'
import PatientVisitsSection from '../../components/visits/PatientVisitsSection'
import './PatientProfilePage.css'

const ONCO_STAGES = ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV']

export default function PatientProfilePage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const patient = useSelector(selectSelectedPatient)
  const status = useSelector(selectPatientStatus)
  const role = useSelector(selectUserRole)

  const [confirmOpen, setConfirmOpen] = useState(false)

  // Reports state
  const [reports, setReports] = useState([])
  const [reportsSearch, setReportsSearch] = useState('')
  const [reportsTypeFilter, setReportsTypeFilter] = useState('all')
  const [reportsStartDate, setReportsStartDate] = useState('')
  const [reportsEndDate, setReportsEndDate] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportFile, setReportFile] = useState(null)
  const [uploadingReport, setUploadingReport] = useState(false)

  // Cancer Images state & filters
  const [cancerImages, setCancerImages] = useState([])
  const [imageTitle, setImageTitle] = useState('')
  const [activeImageModal, setActiveImageModal] = useState(null)
  const [imagesSearch, setImagesSearch] = useState('')
  const [imagesStartDate, setImagesStartDate] = useState('')
  const [imagesEndDate, setImagesEndDate] = useState('')
  // Rename state: which card is being renamed and current text
  const [renamingImageId, setRenamingImageId] = useState(null)
  const [renameText, setRenameText] = useState('')

  // Active loading state for view/download operations
  const [activeReportAction, setActiveReportAction] = useState({ id: null, type: null }) // type: 'view' | 'download'
  const [activeImageAction, setActiveImageAction] = useState({ id: null, type: null }) // type: 'view' | 'download'

  const isWritable = role === 'SUPER_ADMIN' || role === 'ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'

  // Filtered Cancer Images by label search and Date Range (From Date to To Date)
  const filteredCancerImages = cancerImages.filter((img) => {
    if (imagesSearch.trim()) {
      const q = imagesSearch.toLowerCase().trim()
      const titleMatch = (img.title || '').toLowerCase().includes(q)
      if (!titleMatch) return false
    }

    if (img.created_at) {
      const imgDate = new Date(img.created_at)
      const imgTime = new Date(imgDate.getFullYear(), imgDate.getMonth(), imgDate.getDate()).getTime()

      if (imagesStartDate) {
        const startParts = imagesStartDate.split('-')
        if (startParts.length === 3) {
          const startTime = new Date(
            parseInt(startParts[0], 10),
            parseInt(startParts[1], 10) - 1,
            parseInt(startParts[2], 10)
          ).getTime()
          if (imgTime < startTime) return false
        }
      }

      if (imagesEndDate) {
        const endParts = imagesEndDate.split('-')
        if (endParts.length === 3) {
          const endTime = new Date(
            parseInt(endParts[0], 10),
            parseInt(endParts[1], 10) - 1,
            parseInt(endParts[2], 10)
          ).getTime()
          if (imgTime > endTime) return false
        }
      }
    }

    return true
  })

  const loadReports = useCallback(async () => {
    try {
      const res = await patientService.getPatientReports(id)
      setReports(res.data)
    } catch (err) {
      console.error('Failed to load patient reports:', err)
    }
  }, [id])

  const loadCancerImages = useCallback(async () => {
    try {
      const res = await patientService.getPatientCancerImages(id)
      setCancerImages(res.data)
    } catch (err) {
      console.error('Failed to load patient cancer images:', err)
    }
  }, [id])

  const handleDeleteCancerImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this scan image? This cannot be undone.')) return
    try {
      await patientService.deleteCancerImage(id, imageId)
      toast.success('Scan image deleted successfully.')
      if (activeImageModal?.id === imageId) setActiveImageModal(null)
      loadCancerImages()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete image.')
    }
  }

  const handleRenameCancerImage = async (imageId) => {
    const newTitle = renameText.trim()
    if (!newTitle) {
      toast.error('Name cannot be empty.')
      return
    }
    try {
      const res = await patientService.renameCancerImage(id, imageId, newTitle)
      toast.success('Image renamed successfully.')
      setCancerImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, title: res.data.title } : img))
      )
      if (activeImageModal?.id === imageId) {
        setActiveImageModal((prev) => ({ ...prev, title: res.data.title }))
      }
      setRenamingImageId(null)
      setRenameText('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to rename image.')
    }
  }

  const handleUploadReport = async (e) => {
    e.preventDefault()
    if (!reportTitle.trim()) {
      toast.error('Please enter a report title.')
      return
    }
    if (!reportFile) {
      toast.error('Please select a file to upload.')
      return
    }
    setUploadingReport(true)
    try {
      const uploadRes = await patientService.uploadDocument(reportFile)
      const fileUrl = uploadRes.data.url
      const fileType = reportFile.name.split('.').pop().toLowerCase()

      await patientService.createPatientReport(id, {
        title: reportTitle,
        file_url: fileUrl,
        file_type: fileType,
      })
      toast.success('Report document uploaded successfully.')
      setReportTitle('')
      setReportFile(null)
      const fileInput = document.getElementById('report-file-input')
      if (fileInput) fileInput.value = ''
      loadReports()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload report document.')
    } finally {
      setUploadingReport(false)
    }
  }

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return
    try {
      await patientService.deletePatientReport(id, reportId)
      toast.success('Report deleted successfully.')
      loadReports()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete report.')
    }
  }

  // Handle View Report (opens inline in new browser tab)
  const handleViewReport = async (report) => {
    setActiveReportAction({ id: report.id, type: 'view' })
    try {
      const res = await patientService.fetchReportBlob(id, report.id, 'inline')
      const ext = (report.file_type || 'pdf').toLowerCase().replace(/^\./, '')
      let mimeType = res.headers['content-type']
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (ext === 'pdf') mimeType = 'application/pdf'
        else if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg'
        else if (ext === 'png') mimeType = 'image/png'
        else if (ext === 'txt') mimeType = 'text/plain'
      }
      const blob = new Blob([res.data], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (err) {
      console.error('Failed to view report:', err)
      if (report.file_url) {
        window.open(report.file_url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(err.response?.data?.detail || 'Failed to open report.')
      }
    } finally {
      setActiveReportAction({ id: null, type: null })
    }
  }

  // Handle Download Report (forces browser download with clean filename)
  const handleDownloadReport = async (report) => {
    setActiveReportAction({ id: report.id, type: 'download' })
    try {
      const res = await patientService.fetchReportBlob(id, report.id, 'attachment')
      const ext = (report.file_type || 'pdf').toLowerCase().replace(/^\./, '')
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/octet-stream',
      })
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      const safeTitle = (report.title || 'report').replace(/[^\w\s\.-]/g, '_').trim()
      link.download = safeTitle.toLowerCase().endsWith(`.${ext}`) ? safeTitle : `${safeTitle}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
      toast.success('Report downloaded.')
    } catch (err) {
      console.error('Failed to download report:', err)
      if (report.file_url) {
        const link = document.createElement('a')
        link.href = report.file_url
        link.target = '_blank'
        link.download = `${report.title || 'report'}.${report.file_type || 'pdf'}`
        link.click()
      } else {
        toast.error(err.response?.data?.detail || 'Failed to download report.')
      }
    } finally {
      setActiveReportAction({ id: null, type: null })
    }
  }

  // Handle Download Cancer Image (forces download with clean filename)
  const handleDownloadCancerImage = async (img) => {
    setActiveImageAction({ id: img.id, type: 'download' })
    try {
      const res = await patientService.fetchCancerImageBlob(id, img.id, 'attachment')
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'image/jpeg' })
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      let ext = 'jpg'
      const match = (img.image_url || '').match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)
      if (match) ext = match[1].toLowerCase()
      const safeTitle = (img.title || 'cancer_scan').replace(/[^\w\s\.-]/g, '_').trim()
      link.download = safeTitle.toLowerCase().endsWith(`.${ext}`) ? safeTitle : `${safeTitle}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
      toast.success('Scan image downloaded.')
    } catch (err) {
      console.error('Failed to download cancer image:', err)
      if (img.image_url) {
        window.open(img.image_url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(err.response?.data?.detail || 'Failed to download image.')
      }
    } finally {
      setActiveImageAction({ id: null, type: null })
    }
  }

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(reportsSearch.toLowerCase())
    const matchesType =
      reportsTypeFilter === 'all' ||
      r.file_type.toLowerCase() === reportsTypeFilter.toLowerCase() ||
      (reportsTypeFilter === 'doc' && ['doc', 'docx'].includes(r.file_type.toLowerCase())) ||
      (reportsTypeFilter === 'xls' && ['xls', 'xlsx'].includes(r.file_type.toLowerCase()))

    let matchesDate = true
    if (reportsStartDate || reportsEndDate) {
      const rDateStr = r.created_at.split('T')[0]
      if (reportsStartDate && rDateStr < reportsStartDate) {
        matchesDate = false
      }
      if (reportsEndDate && rDateStr > reportsEndDate) {
        matchesDate = false
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  useEffect(() => {
    dispatch(fetchPatientDetailThunk(id))
    loadReports()
    loadCancerImages()
  }, [dispatch, id, loadReports, loadCancerImages])

  const handleDeleteRecord = async () => {
    try {
      await dispatch(deletePatientThunk(id)).unwrap()
      toast.success('Patient record deleted successfully.')
      navigate('/patients')
    } catch (err) {
      toast.error(err || 'Failed to delete record.')
    }
  }

  if (status === 'loading' && !patient) {
    return (
      <div className="onco-prof-root p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-ink-secondary">Loading clinical patient chart…</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="onco-prof-root p-10 text-center text-status-critical font-semibold">
        Patient record not found.
      </div>
    )
  }

  const age = calculateAge(patient.date_of_birth)

  return (
    <div className="onco-prof-root space-y-5 pb-6">
      {/* ── Top Breadcrumb & Back Navigation Bar ─────────────────────────── */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <nav className="flex items-center gap-1.5 text-ink-secondary" aria-label="Breadcrumb">
          <Link
            to="/dashboard"
            className="font-semibold text-brand-blue dark:text-sky-400 hover:underline"
          >
            Dashboard
          </Link>
          <span className="opacity-40">/</span>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="font-semibold text-brand-blue dark:text-sky-400 hover:underline cursor-pointer"
          >
            Patient Register
          </button>
          <span className="opacity-40">/</span>
          <span className="text-ink-primary font-semibold truncate max-w-xs">
            {patient.full_name}
          </span>
        </nav>

        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1)
            } else {
              navigate('/patients')
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border hover:bg-surface-hover text-ink-primary font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <RiArrowLeftLine size={14} />
          <span>Back to Patients</span>
        </button>
      </div>

      {/* ── Hero Patient Identity & Telemetry Banner ─────────────────────── */}
      <div className="onco-prof-hero onco-prof-anim">
        {/* Decorative Molecular Lattice SVG */}
        <svg
          width="210"
          height="110"
          viewBox="0 0 210 110"
          fill="none"
          aria-hidden="true"
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 hidden lg:block pointer-events-none text-sky-300"
        >
          <polygon points="60,16 90,34 90,70 60,88 30,70 30,34" stroke="currentColor" strokeWidth="1.4" />
          <polygon
            points="120,16 150,34 150,70 120,88 90,70 90,34"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <circle cx="60" cy="16" r="3.5" fill="currentColor" />
          <circle cx="90" cy="34" r="3.5" fill="currentColor" />
          <circle cx="90" cy="70" r="3.5" fill="currentColor" />
          <circle cx="120" cy="16" r="3.5" fill="currentColor" />
          <circle cx="150" cy="52" r="3.5" fill="currentColor" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            {/* Biometric Profile Image */}
            <div className="onco-prof-avatar mx-auto sm:mx-0">
              {patient.photo_url ? (
                <img
                  src={patient.photo_url}
                  alt={patient.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                patient.full_name.charAt(0)
              )}
            </div>

            {/* Identity & Vital Chips */}
            <div className="text-center sm:text-left space-y-2.5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                  {patient.full_name}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-sky-400/15 text-sky-200 border border-sky-400/35 px-2.5 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    {patient.patient_code}
                  </span>
                  <StatusBadge
                    status={patient.treatment_status}
                    className="bg-white/15 text-white border-white/30"
                  />
                </div>
              </div>

              {/* Structured Vital Telemetry Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="onco-hero-chip">
                  <RiUserHeartLine size={13} className="text-sky-300" />
                  <span>
                    {patient.gender} · {age} years
                  </span>
                </span>
                {patient.blood_group && (
                  <span className="onco-hero-chip">
                    <RiDropLine size={13} className="text-rose-400" />
                    <span>Blood Group {patient.blood_group}</span>
                  </span>
                )}
                <span className="onco-hero-chip">
                  <RiHospitalLine size={13} className="text-cyan-300" />
                  <span>
                    Dept: <strong className="text-white">{patient.department || 'Oncology'}</strong>
                  </span>
                </span>
                <span className="onco-hero-chip">
                  <RiStethoscopeLine size={13} className="text-emerald-300" />
                  <span>
                    Lead: <strong className="text-white">{patient.assigned_doctor || 'Unassigned'}</strong>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="shrink-0 flex items-center gap-2.5 flex-wrap justify-center md:justify-end">
            {isWritable && (
              <button
                type="button"
                onClick={() => navigate(`/patients/${id}/edit`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-sky-300/35 shadow-md transition-all cursor-pointer"
              >
                <RiEditLine size={15} />
                <span>Edit Chart</span>
              </button>
            )}

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-200 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/35 transition-all cursor-pointer"
              >
                <RiDeleteBin7Line size={15} />
                <span>Delete Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Longitudinal Clinical Workspace Tabs ────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="onco-prof-tabs-list h-auto w-full justify-start">
          <TabsTrigger value="overview" className="onco-prof-tab-trigger">
            <RiUserHeartLine size={15} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="clinical" className="onco-prof-tab-trigger">
            <RiMicroscopeLine size={15} />
            <span>Clinical Details</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="onco-prof-tab-trigger">
            <RiFileTextLine size={15} />
            <span>Reports</span>
            {reports.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/15 dark:bg-white/15">
                {reports.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancer_images" className="onco-prof-tab-trigger">
            <RiScanLine size={15} />
            <span>Cancer Images</span>
            {cancerImages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/15 dark:bg-white/15">
                {cancerImages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="visits" className="onco-prof-tab-trigger">
            <RiCalendarCheckLine size={15} />
            <span>Visits</span>
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW (Demographics, Contacts & Clinical Snapshot)
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-5 outline-none onco-prof-anim">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Demographics & Primary Communication */}
            <Card className="onco-prof-card lg:col-span-8 border-0">
              <CardHeader className="pb-3 border-b border-surface-border/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 dark:bg-sky-500/15 flex items-center justify-center text-brand-blue dark:text-sky-400">
                    <RiUserHeartLine size={17} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider">
                      Demographics &amp; Contacts
                    </CardTitle>
                    <p className="text-xs text-ink-secondary">
                      Verified patient identity, vital chronology, and primary correspondence
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Full Name
                  </span>
                  <span className="font-bold text-ink-primary text-base">{patient.full_name}</span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Date of Birth (Age)
                  </span>
                  <span className="font-bold text-ink-primary font-mono">
                    {patient.date_of_birth} <span className="text-brand-blue dark:text-sky-400">({age} years)</span>
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Gender
                  </span>
                  <span className="font-semibold text-ink-primary">{patient.gender}</span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Blood Group
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <RiDropLine size={14} />
                    {patient.blood_group || 'Not Recorded'}
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1 mb-1">
                    <RiPhoneLine size={12} /> Phone Number
                  </span>
                  <span className="font-bold font-mono text-ink-primary">{patient.phone}</span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1 mb-1">
                    <RiMailLine size={12} /> Email Address
                  </span>
                  <span className="font-medium text-ink-primary break-all">
                    {patient.email || '—'}
                  </span>
                </div>

                <div className="onco-data-tile sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1 mb-1">
                    <RiMapPinLine size={12} /> Residential Address
                  </span>
                  <span className="font-medium text-ink-primary whitespace-pre-wrap">
                    {patient.address}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact & Clinical Summary Column */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <Card className="onco-prof-card border-0">
                <CardHeader className="pb-3 border-b border-surface-border/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <RiShieldUserLine size={17} />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                        Emergency Contact Details
                      </CardTitle>
                      <p className="text-[11px] text-ink-secondary">
                        Designated next-of-kin contact
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div className="onco-data-tile">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-0.5">
                      Contact Name
                    </span>
                    <span className="font-bold text-ink-primary">
                      {patient.emergency_contact_name || '—'}
                    </span>
                  </div>
                  <div className="onco-data-tile">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-0.5">
                      Contact Phone
                    </span>
                    <span className="font-bold font-mono text-ink-primary">
                      {patient.emergency_contact_phone || '—'}
                    </span>
                  </div>
                  <div className="onco-data-tile">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-0.5">
                      Relationship
                    </span>
                    <span className="font-semibold text-ink-primary">
                      {patient.emergency_contact_relationship || '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Active Oncology Snapshot Card */}
              <Card className="onco-prof-card border-0">
                <CardHeader className="pb-3 border-b border-surface-border/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <RiHeartPulseLine size={17} />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                        Oncology Protocol Snapshot
                      </CardTitle>
                      <p className="text-[11px] text-ink-secondary">
                        Primary diagnosis &amp; staging
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-surface-border/60">
                    <span className="text-ink-secondary font-medium">Primary Diagnosis</span>
                    <span className="font-bold text-ink-primary text-right max-w-[180px] truncate">
                      {patient.primary_diagnosis || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-surface-border/60">
                    <span className="text-ink-secondary font-medium">Clinical Stage</span>
                    <span className="font-bold text-brand-blue dark:text-sky-400">
                      {patient.cancer_stage || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-ink-secondary font-medium">Status</span>
                    <StatusBadge status={patient.treatment_status} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: CLINICAL DETAILS (Oncology Registry & Staging Presentation)
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="clinical" className="space-y-5 outline-none onco-prof-anim">
          <Card className="onco-prof-card border-0">
            <CardHeader className="pb-4 border-b border-surface-border/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-cyan-500/15 border border-indigo-500/25 flex items-center justify-center text-brand-navy dark:text-sky-300">
                    <RiMicroscopeLine size={19} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-ink-primary uppercase tracking-wider">
                      Cancer Registry Details
                    </CardTitle>
                    <p className="text-xs text-ink-secondary">
                      Histopathological classification, TNM/clinical stage, and multidisciplinary care team
                    </p>
                  </div>
                </div>
                <StatusBadge status={patient.treatment_status} />
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Primary Diagnosis & Stage Progression Highlight Banner */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-brand-navy/5 via-brand-blue/8 to-cyan-500/5 dark:from-slate-900/80 dark:via-blue-950/40 dark:to-cyan-950/30 border border-brand-blue/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-blue dark:text-sky-400 block">
                    Primary Staging Diagnosis
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-ink-primary">
                    {patient.primary_diagnosis || 'Unclassified Oncology Record'}
                  </h3>
                </div>

                {/* Visual Stage Progression Indicator */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ONCO_STAGES.map((stg) => {
                    const isCurrentStage = patient.cancer_stage === stg
                    return (
                      <span
                        key={stg}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          isCurrentStage
                            ? 'bg-brand-blue text-white border-brand-blue shadow-sm scale-105'
                            : 'bg-surface-card/70 text-ink-disabled border-surface-border'
                        }`}
                      >
                        {stg}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Clinical Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Cancer Category
                  </span>
                  <span className="font-bold text-ink-primary">
                    {patient.cancer_category || '-'}
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Cancer Type
                  </span>
                  <span className="font-bold text-ink-primary">
                    {patient.cancer_type || '-'}
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Clinical Stage
                  </span>
                  <span className="font-extrabold text-brand-blue dark:text-sky-400">
                    {patient.cancer_stage || '-'}
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Assigned Lead Doctor
                  </span>
                  <span className="font-bold text-ink-primary flex items-center gap-1.5">
                    <RiStethoscopeLine size={15} className="text-brand-blue dark:text-sky-400" />
                    {patient.assigned_doctor || 'Unassigned'}
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Clinical Department
                  </span>
                  <span className="font-bold text-ink-primary">
                    {patient.department || 'Oncology'}
                  </span>
                </div>

                <div className="onco-data-tile">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary block mb-1">
                    Current Treatment Status
                  </span>
                  <div className="mt-0.5">
                    <StatusBadge status={patient.treatment_status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: REPORTS (Clinical Document Upload & Archive)
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="reports" className="space-y-5 outline-none onco-prof-anim">
          {/* Upload Report Section (Admins/Super Admins only) */}
          {isWritable && (
            <Card className="onco-prof-card border-0">
              <CardHeader className="pb-3 border-b border-surface-border/70">
                <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-blue/10 dark:bg-sky-500/15 flex items-center justify-center text-brand-blue dark:text-sky-400">
                    <RiUpload2Line size={16} />
                  </div>
                  <span>Upload Clinical Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <form
                  onSubmit={handleUploadReport}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-secondary">Report Title</label>
                    <Input
                      placeholder="e.g. CBC Test / Biopsy Report"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="h-10 rounded-lg bg-surface-base/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-secondary">
                      Select Document File
                    </label>
                    <Input
                      id="report-file-input"
                      type="file"
                      disabled={uploadingReport}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      onChange={(e) => setReportFile(e.target.files[0])}
                      className="cursor-pointer text-xs h-10 rounded-lg bg-surface-base/60 disabled:opacity-60"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={uploadingReport}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {uploadingReport ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Uploading Document…</span>
                      </>
                    ) : (
                      <>
                        <RiUpload2Line size={15} />
                        <span>Upload Document</span>
                      </>
                    )}
                  </Button>
                </form>

                {uploadingReport && (
                  <div className="mt-3 p-2.5 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center gap-2 text-xs text-brand-blue animate-fade-in">
                    <span className="w-3.5 h-3.5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin shrink-0" />
                    <span className="font-medium">
                      Uploading and indexing clinical report document, please wait…
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reports Filter & Search Archive */}
          <Card className="onco-prof-card border-0">
            <CardHeader className="pb-3 border-b border-surface-border/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <RiFileTextLine size={16} />
                  </div>
                  <span>Patient Report Archives</span>
                </CardTitle>
                <span className="text-xs font-mono font-semibold text-ink-secondary bg-surface-base border border-surface-border px-2.5 py-1 rounded-lg">
                  Showing {filteredReports.length} of {reports.length} document(s)
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* Search and Format Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-3 text-ink-disabled" size={16} />
                  <Input
                    placeholder="Search reports by title..."
                    value={reportsSearch}
                    onChange={(e) => setReportsSearch(e.target.value)}
                    className="pl-9 h-10 rounded-lg bg-surface-base/60"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <RiFilter3Line className="text-ink-disabled shrink-0" size={16} />
                  <select
                    value={reportsTypeFilter}
                    onChange={(e) => setReportsTypeFilter(e.target.value)}
                    className="w-full h-10 rounded-lg border border-surface-border bg-surface-card px-3 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="all">All File Formats</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="doc">Word Files (DOC/DOCX)</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="xls">Excel sheets (XLS/XLSX)</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="txt">Text Files (TXT)</option>
                  </select>
                </div>
              </div>

              {/* Date Range Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 items-end border-t border-surface-border/50">
                <DatePicker
                  label="From Date"
                  value={reportsStartDate}
                  onChange={setReportsStartDate}
                  maxDate={new Date()}
                  placeholder="dd-mm-yyyy"
                />
                <DatePicker
                  label="To Date"
                  value={reportsEndDate}
                  onChange={setReportsEndDate}
                  maxDate={new Date()}
                  placeholder="dd-mm-yyyy"
                />
                <div className="flex h-10 items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setReportsStartDate('')
                      setReportsEndDate('')
                      setReportsSearch('')
                      setReportsTypeFilter('all')
                    }}
                    className="w-full text-xs border-surface-border text-ink-primary hover:bg-surface-hover h-10 rounded-lg cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* Reports Archive List */}
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-surface-border rounded-xl bg-surface-base/30">
                  <RiFileTextLine size={34} className="mx-auto text-ink-disabled mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-ink-secondary">
                    No matching reports found.
                  </p>
                  <p className="text-xs text-ink-disabled mt-0.5">
                    Try adjusting your filters or upload a new clinical document above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredReports.map((report) => {
                    const isPdf = report.file_type.toLowerCase() === 'pdf'
                    const isWord = ['doc', 'docx'].includes(report.file_type.toLowerCase())
                    const FileIcon = isPdf
                      ? RiFilePdfLine
                      : isWord
                      ? RiFileWordLine
                      : RiFileTextLine

                    return (
                      <div key={report.id} className="onco-report-item">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isPdf
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : isWord
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
                            }`}
                          >
                            <FileIcon size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-ink-primary truncate">
                              {report.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-ink-secondary uppercase">
                              <span className="px-1.5 py-0.2 rounded bg-surface-card border border-surface-border font-bold">
                                {report.file_type}
                              </span>
                              <span>•</span>
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewReport(report)}
                            disabled={activeReportAction.id === report.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-ink-primary hover:text-brand-blue bg-surface-card hover:bg-brand-blue/10 border border-surface-border rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            title="View Report"
                          >
                            <RiEyeLine
                              size={15}
                              className={
                                activeReportAction.id === report.id &&
                                activeReportAction.type === 'view'
                                  ? 'animate-pulse text-brand-blue'
                                  : ''
                              }
                            />
                            <span className="hidden sm:inline">View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadReport(report)}
                            disabled={activeReportAction.id === report.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-ink-primary hover:text-brand-blue bg-surface-card hover:bg-brand-blue/10 border border-surface-border rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            title="Download Report"
                          >
                            <RiDownloadLine
                              size={15}
                              className={
                                activeReportAction.id === report.id &&
                                activeReportAction.type === 'download'
                                  ? 'animate-bounce text-brand-blue'
                                  : ''
                              }
                            />
                            <span className="hidden sm:inline">Download</span>
                          </button>

                          {isWritable && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-1.5 text-ink-secondary hover:text-rose-600 bg-surface-card hover:bg-rose-500/10 border border-surface-border rounded-lg transition-colors cursor-pointer"
                              title="Delete Report"
                            >
                              <RiDeleteBin7Line size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: CANCER IMAGES (Diagnostic Radiology & Scan Gallery)
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="cancer_images" className="space-y-5 outline-none onco-prof-anim">
          {/* Upload Image Section (Admins/Super Admins only) */}
          {isWritable && (
            <Card className="onco-prof-card border-0">
              <CardHeader className="pb-3 border-b border-surface-border/70">
                <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <RiImageLine size={16} />
                  </div>
                  <span>Upload Cancer Image</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-secondary">
                      Scan Label / Description (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Chest CT Scan / Cycle 2 MRI"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      className="h-10 rounded-lg bg-surface-base/60"
                    />
                  </div>
                  <div>
                    <PhotoSelector
                      value=""
                      onChange={async (url) => {
                        const capturedAt = new Date().toISOString()
                        try {
                          await patientService.createPatientCancerImage(id, {
                            title: imageTitle.trim() || 'Clinical Image Scan',
                            image_url: url,
                            captured_at: capturedAt,
                          })
                          toast.success('Cancer image added to chart successfully.')
                          setImageTitle('')
                          loadCancerImages()
                        } catch {
                          toast.error('Failed to save cancer image record.')
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancer Images Grid & Filter Controls */}
          <Card className="onco-prof-card border-0">
            <CardHeader className="pb-3 border-b border-surface-border/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue dark:text-sky-400">
                    <RiScanLine size={16} />
                  </div>
                  <span>Cancer Staging &amp; Imaging Records</span>
                </CardTitle>
                <div className="text-xs font-mono font-semibold text-ink-secondary bg-surface-base border border-surface-border px-2.5 py-1 rounded-lg">
                  Showing {filteredCancerImages.length} of {cancerImages.length} record(s)
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* Search and Date Range Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 pb-3 border-b border-surface-border/50 items-end">
                <div className="relative space-y-1 md:col-span-1">
                  <label className="text-xs font-semibold text-ink-secondary block">
                    Search Scans
                  </label>
                  <div className="relative">
                    <RiSearchLine
                      className="absolute left-3 top-3 text-ink-disabled pointer-events-none"
                      size={16}
                    />
                    <Input
                      placeholder="Filter scan label..."
                      value={imagesSearch}
                      onChange={(e) => setImagesSearch(e.target.value)}
                      className="pl-9 h-10 rounded-lg bg-surface-base/60"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <DatePicker
                    label="From Date"
                    value={imagesStartDate}
                    onChange={setImagesStartDate}
                    maxDate={new Date()}
                    placeholder="dd-mm-yyyy"
                  />
                </div>

                <div className="space-y-1">
                  <DatePicker
                    label="To Date"
                    value={imagesEndDate}
                    onChange={setImagesEndDate}
                    maxDate={new Date()}
                    placeholder="dd-mm-yyyy"
                  />
                </div>

                <div className="flex h-10 items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImagesStartDate('')
                      setImagesEndDate('')
                      setImagesSearch('')
                    }}
                    disabled={!imagesStartDate && !imagesEndDate && !imagesSearch}
                    className="w-full text-xs border-surface-border text-ink-primary hover:bg-surface-hover h-10 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <RiFilter3Line size={14} /> Reset Filters
                  </Button>
                </div>
              </div>

              {/* Active Filter Badges notice */}
              {(imagesStartDate || imagesEndDate || imagesSearch) && (
                <div className="flex items-center gap-2 flex-wrap text-xs bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-2.5 text-brand-navy dark:text-sky-300">
                  <span className="font-semibold text-brand-blue dark:text-sky-400 flex items-center gap-1">
                    <RiFilter3Line size={13} /> Active Filter:
                  </span>
                  {imagesSearch && (
                    <span className="bg-surface-card border border-surface-border px-2 py-0.5 rounded text-[11px] font-medium">
                      Label: &quot;{imagesSearch}&quot;
                    </span>
                  )}
                  {imagesStartDate && (
                    <span className="bg-surface-card border border-surface-border px-2 py-0.5 rounded text-[11px] font-medium">
                      From: {imagesStartDate}
                    </span>
                  )}
                  {imagesEndDate && (
                    <span className="bg-surface-card border border-surface-border px-2 py-0.5 rounded text-[11px] font-medium">
                      To: {imagesEndDate}
                    </span>
                  )}
                </div>
              )}

              {/* Cancer Images Grid */}
              {filteredCancerImages.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-surface-border rounded-xl bg-surface-base/30">
                  <RiImageLine size={34} className="mx-auto text-ink-disabled mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-ink-secondary">
                    {cancerImages.length === 0
                      ? 'No imaging scans recorded.'
                      : 'No matching imaging scans found.'}
                  </p>
                  <p className="text-xs text-ink-disabled mt-0.5">
                    {cancerImages.length === 0
                      ? 'Upload scan documents or capture a live image above.'
                      : 'Try adjusting your date range filter or search keyword.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCancerImages.map((img) => {
                    const displayTime = img.captured_at
                      ? new Date(`${img.captured_at}Z`)
                      : new Date(img.created_at)
                    const isRenaming = renamingImageId === img.id

                    return (
                      <div key={img.id} className="onco-scan-card group">
                        {/* Image thumbnail — click to open lightbox */}
                        <div
                          className="relative aspect-square w-full overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer"
                          onClick={() => {
                            if (!isRenaming) setActiveImageModal(img)
                          }}
                        >
                          <img
                            src={img.image_url}
                            alt={img.title || 'Cancer Scan'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold border border-white/25">
                              <RiEyeLine size={13} /> Inspect Scan
                            </span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-3 space-y-1.5">
                          {isRenaming ? (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                autoFocus
                                value={renameText}
                                onChange={(e) => setRenameText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameCancerImage(img.id)
                                  if (e.key === 'Escape') {
                                    setRenamingImageId(null)
                                    setRenameText('')
                                  }
                                }}
                                className="flex-1 min-w-0 text-xs border border-brand-blue rounded px-1.5 py-0.5 bg-surface-card text-ink-primary outline-none focus:ring-1 focus:ring-brand-blue"
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameCancerImage(img.id)}
                                className="p-0.5 text-brand-blue hover:text-brand-blue-dark shrink-0"
                                title="Confirm rename"
                              >
                                <RiCheckLine size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingImageId(null)
                                  setRenameText('')
                                }}
                                className="p-0.5 text-ink-secondary hover:text-status-critical shrink-0"
                                title="Cancel"
                              >
                                <RiCloseLine size={14} />
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-ink-primary truncate">
                              {img.title || 'Clinical Image'}
                            </p>
                          )}

                          <div className="flex items-center gap-1 text-[10px] text-ink-disabled font-mono">
                            <RiTimeLine size={11} className="shrink-0" />
                            <span>
                              {new Date(displayTime).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>

                          {!isRenaming && (
                            <div
                              className="flex items-center gap-1 pt-1.5 border-t border-surface-border/60"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleDownloadCancerImage(img)}
                                disabled={activeImageAction.id === img.id}
                                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-ink-secondary hover:text-brand-blue hover:bg-surface-hover rounded-md py-1 transition-colors cursor-pointer disabled:opacity-50"
                                title="Download image"
                              >
                                <RiDownloadLine
                                  size={12}
                                  className={
                                    activeImageAction.id === img.id
                                      ? 'animate-bounce text-brand-blue'
                                      : ''
                                  }
                                />
                                <span>Save</span>
                              </button>
                              {isWritable && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenamingImageId(img.id)
                                      setRenameText(img.title || '')
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-ink-secondary hover:text-brand-blue hover:bg-surface-hover rounded-md py-1 transition-colors cursor-pointer"
                                    title="Rename"
                                  >
                                    <RiPencilLine size={12} /> Rename
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCancerImage(img.id)}
                                    className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-ink-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-md py-1 transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <RiDeleteBin7Line size={12} /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lightbox Preview Modal */}
          {activeImageModal && (
            <div
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => {
                setActiveImageModal(null)
                setRenamingImageId(null)
                setRenameText('')
              }}
            >
              <div
                className="relative max-w-3xl w-full max-h-[90vh] bg-surface-card rounded-xl overflow-hidden border border-surface-border shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageModal(null)
                    setRenamingImageId(null)
                    setRenameText('')
                  }}
                  className="absolute right-3 top-3 text-white bg-black/50 hover:bg-black/80 p-1.5 rounded-full transition-colors z-10 cursor-pointer"
                >
                  <RiCloseLine size={20} />
                </button>

                <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden p-6 min-h-[350px]">
                  <img
                    src={activeImageModal.image_url}
                    alt={activeImageModal.title || 'Full Scan View'}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="p-4 bg-surface-card border-t border-surface-border space-y-3">
                  {renamingImageId === activeImageModal.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCancerImage(activeImageModal.id)
                          if (e.key === 'Escape') {
                            setRenamingImageId(null)
                            setRenameText('')
                          }
                        }}
                        className="flex-1 text-sm border border-brand-blue rounded px-2 py-1 bg-surface-card text-ink-primary outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameCancerImage(activeImageModal.id)}
                        className="flex items-center gap-1 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs px-3 py-1.5 rounded font-semibold"
                      >
                        <RiCheckLine size={13} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingImageId(null)
                          setRenameText('')
                        }}
                        className="text-xs text-ink-secondary hover:text-status-critical px-2 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-ink-primary">
                          {activeImageModal.title || 'Clinical Image'}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-ink-secondary mt-1 font-mono">
                          <RiTimeLine size={12} />
                          <span>
                            Captured:{' '}
                            {new Date(
                              activeImageModal.captured_at
                                ? `${activeImageModal.captured_at}Z`
                                : activeImageModal.created_at
                            ).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isWritable && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingImageId(activeImageModal.id)
                                setRenameText(activeImageModal.title || '')
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-ink-secondary hover:text-brand-blue border border-surface-border hover:border-brand-blue px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <RiPencilLine size={13} /> Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCancerImage(activeImageModal.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-status-critical border border-status-critical/30 hover:bg-status-critical-bg px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <RiDeleteBin7Line size={13} /> Delete
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadCancerImage(activeImageModal)}
                          disabled={activeImageAction.id === activeImageModal.id}
                          className="flex items-center gap-1 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RiDownloadLine
                            size={14}
                            className={
                              activeImageAction.id === activeImageModal.id ? 'animate-bounce' : ''
                            }
                          />
                          <span>
                            {activeImageAction.id === activeImageModal.id
                              ? 'Downloading...'
                              : 'Full Resolution'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: VISITS (Clinical Appointments & Longitudinal History)
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="visits" className="space-y-5 outline-none onco-prof-anim">
          <PatientVisitsSection patient={patient} patientId={id} isWritable={isWritable} />
        </TabsContent>
      </Tabs>

      {/* Confirmation delete modal */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDeleteRecord}
        title="Delete Patient Record?"
        description="This will permanently delete this oncology profile. This action will be logged in the system audit trail."
        confirmText="Delete Record"
        isDestructive
      />
    </div>
  )
}

// Age calculator helper
function calculateAge(dobString) {
  if (!dobString) return ''
  const dob = new Date(dobString)
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}
