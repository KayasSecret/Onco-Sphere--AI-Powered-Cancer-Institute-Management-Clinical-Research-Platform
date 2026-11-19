import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import { Input } from '../../components/ui/input'
import { toast } from 'sonner'
import reportService from '../../services/reportService'
import patientService from '../../services/patientService'
import {
  RiHotelLine,
  RiFileList3Line,
  RiBallPenLine,
  RiUploadCloud2Line,
  RiSaveLine,
  RiArrowLeftLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBin6Line,
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiFlaskLine,
  RiGlobalLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPin2Line,
  RiImageAddLine,
  RiStethoscopeLine,
} from 'react-icons/ri'
import './ReportsModule.css'

export default function ReportSettingsPage() {
  const navigate = useNavigate()
  const [activeSubTab, setActiveSubTab] = useState('institute')
  const [loading, setLoading] = useState(false)
  const [uploadingType, setUploadingType] = useState(null) // 'logo' | 'stamp' | 'signature' | 'edit_sig' | null

  // ── 1. Institute Branding States ─────────────────────────────────────────
  const [instName, setInstName] = useState('')
  const [instAddress, setInstAddress] = useState('')
  const [instWebsite, setInstWebsite] = useState('')
  const [instEmail, setInstEmail] = useState('')
  const [instContact, setInstContact] = useState('')
  const [instLogo, setInstLogo] = useState('')
  const [instStamp, setInstStamp] = useState('')

  // ── 2. Doctor Signature States ───────────────────────────────────────────
  const [signatures, setSignatures] = useState([])
  const [newDoctorName, setNewDoctorName] = useState('')
  const [newSigUrl, setNewSigUrl] = useState('')

  // Signature Edit & Delete States
  const [editingSigId, setEditingSigId] = useState(null)
  const [editSigName, setEditSigName] = useState('')
  const [editSigUrl, setEditSigUrl] = useState('')
  const [deletingSigId, setDeletingSigId] = useState(null)

  // ── 3. Master Parameters States ──────────────────────────────────────────
  const [templates, setTemplates] = useState([])
  const [paramSectionFilter, setParamSectionFilter] = useState('ALL')
  const [editingParamId, setEditingParamId] = useState(null)
  const [editParamData, setEditParamData] = useState({
    name: '',
    section: 'Oxidative Damage',
    unit: '',
    reference_range: '',
    default_interpretation: '',
  })

  // Add New Parameter Form State
  const [showAddParamForm, setShowAddParamForm] = useState(false)
  const [newParamData, setNewParamData] = useState({
    name: '',
    code: '',
    section: 'Oxidative Damage',
    unit: '',
    reference_range: '',
    default_interpretation: '',
  })
  const [confirmResetParams, setConfirmResetParams] = useState(false)

  // Load Settings & Templates on Mount
  useEffect(() => {
    fetchSettings()
    fetchTemplates()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await reportService.getSettings()
      const inst = res.data.institute
      if (inst) {
        setInstName(inst.name || '')
        setInstAddress(inst.address || '')
        setInstWebsite(inst.website || '')
        setInstEmail(inst.email || '')
        setInstContact(inst.contact_number || '')
        setInstLogo(inst.logo_url || '')
        setInstStamp(inst.stamp_url || '')
      }
      setSignatures(res.data.signatures || [])
    } catch {
      toast.error('Failed to load institute settings.')
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await reportService.getTemplates()
      setTemplates(res.data || [])
    } catch {
      toast.error('Failed to load report templates.')
    }
  }

  // ── Institute Branding Handlers ──────────────────────────────────────────
  const handleInstituteSave = async (e) => {
    e.preventDefault()
    if (!instName.trim() || !instAddress.trim()) {
      toast.error('Institute Name and Physical Address are required.')
      return
    }
    setLoading(true)
    try {
      await reportService.updateSettings({
        name: instName.trim(),
        address: instAddress.trim(),
        website: instWebsite.trim(),
        email: instEmail.trim(),
        contact_number: instContact.trim(),
        logo_url: instLogo || null,
        stamp_url: instStamp || null,
      })
      toast.success('Institute branding details saved successfully.')
      fetchSettings()
    } catch {
      toast.error('Failed to update institute details.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file || uploadingType) return
    setUploadingType(type)
    const labelMap = {
      logo: 'Institute Logo',
      stamp: 'Official Stamp',
      signature: 'Doctor Signature',
      edit_sig: 'Updated Signature',
    }
    const toastId = toast.loading(`Uploading ${labelMap[type] || type}...`)
    try {
      const res = await patientService.uploadImage(file)
      const url = res.data.url
      if (type === 'logo') setInstLogo(url)
      if (type === 'stamp') setInstStamp(url)
      if (type === 'signature') setNewSigUrl(url)
      if (type === 'edit_sig') setEditSigUrl(url)
      toast.success(`${labelMap[type] || type} uploaded successfully.`, { id: toastId })
    } catch {
      toast.error(`Failed to upload ${labelMap[type] || type}.`, { id: toastId })
    } finally {
      setUploadingType(null)
    }
  }

  // ── Doctor Signature Handlers ────────────────────────────────────────────
  const handleAddSignature = async (e) => {
    e.preventDefault()
    if (!newDoctorName.trim()) {
      toast.error('Doctor name is required.')
      return
    }
    if (!newSigUrl) {
      toast.error('Please upload a signature image.')
      return
    }
    setLoading(true)
    try {
      await reportService.addSignature({
        doctor_name: newDoctorName.trim(),
        signature_url: newSigUrl,
        is_active: true,
      })
      toast.success('Authorized doctor signature added successfully.')
      setNewDoctorName('')
      setNewSigUrl('')
      fetchSettings()
    } catch {
      toast.error('Failed to add doctor signature.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditSignature = (sig) => {
    setEditingSigId(sig.id)
    setEditSigName(sig.doctor_name)
    setEditSigUrl(sig.signature_url)
    setDeletingSigId(null)
  }

  const handleSaveEditSignature = async (sigId) => {
    if (!editSigName.trim() || !editSigUrl) {
      toast.error('Signatory name and signature image are required.')
      return
    }
    setLoading(true)
    try {
      await reportService.updateSignature(sigId, {
        doctor_name: editSigName.trim(),
        signature_url: editSigUrl,
        is_active: true,
      })
      toast.success('Doctor signature updated.')
      setEditingSigId(null)
      fetchSettings()
    } catch {
      toast.error('Failed to update doctor signature.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSignature = async (sigId) => {
    setLoading(true)
    try {
      await reportService.deleteSignature(sigId)
      toast.success('Doctor signature removed.')
      setDeletingSigId(null)
      fetchSettings()
    } catch {
      toast.error('Failed to delete doctor signature.')
    } finally {
      setLoading(false)
    }
  }

  // ── Master Parameter Handlers ────────────────────────────────────────────
  const handleStartEditParam = (param) => {
    setEditingParamId(param.id)
    setEditParamData({
      name: param.name || '',
      section: param.section || 'Oxidative Damage',
      unit: param.unit || '',
      reference_range: param.reference_range || '',
      default_interpretation: param.default_interpretation || '',
    })
  }

  const handleSaveEditParam = async (paramId) => {
    if (!editParamData.name.trim() || !editParamData.reference_range.trim()) {
      toast.error('Parameter name and reference range are required.')
      return
    }
    setLoading(true)
    try {
      await reportService.updateParameter(paramId, editParamData)
      toast.success('Biomarker parameter configuration updated.')
      setEditingParamId(null)
      fetchTemplates()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update parameter.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateParameter = async (e, templateId) => {
    e.preventDefault()
    if (
      !newParamData.name.trim() ||
      !newParamData.code.trim() ||
      !newParamData.reference_range.trim()
    ) {
      toast.error('Parameter Name, Code, and Reference Range are required.')
      return
    }
    setLoading(true)
    try {
      await reportService.createParameter({
        ...newParamData,
        template_id: templateId,
      })
      toast.success(`Biomarker parameter ${newParamData.code.toUpperCase()} added.`)
      setNewParamData({
        name: '',
        code: '',
        section: 'Oxidative Damage',
        unit: '',
        reference_range: '',
        default_interpretation: '',
      })
      setShowAddParamForm(false)
      fetchTemplates()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add new parameter.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetDefaultParameters = async () => {
    setLoading(true)
    try {
      const res = await reportService.resetParameters()
      setTemplates(res.data || [])
      setConfirmResetParams(false)
      toast.success('Master parameters restored to official ICSR reference standards.')
    } catch {
      toast.error('Failed to reset parameters.')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    {
      id: 'institute',
      label: 'Institute Branding',
      desc: 'Letterhead, logo & stamp',
      icon: RiHotelLine,
    },
    {
      id: 'signatures',
      label: 'Doctor Signatures',
      desc: `${signatures.length} authorized signatories`,
      icon: RiBallPenLine,
    },
    {
      id: 'parameters',
      label: 'Master Parameters',
      desc: 'Biomarker ranges & units',
      icon: RiFileList3Line,
    },
  ]

  return (
    <div className="onco-receipt-page">
      {/* ── Top Clinical Hero Header ──────────────────────────────────────── */}
      <section className="onco-receipt-hero !py-5 sm:!py-6">
        <div className="onco-receipt-hero-inner">
          <div className="min-w-0 flex-1">
            <div className="onco-receipt-breadcrumb !mb-1.5">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <Link to="/reports">Onco Receipt</Link>
              <span>/</span>
              <span className="text-white">Branding &amp; Parameters</span>
            </div>
            <h1 className="onco-receipt-title">Onco Receipt Settings</h1>
            <p className="onco-receipt-subtitle !mt-1.5">
              Manage institute branding, clinician signatures and diagnostic reference parameters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="onco-hero-btn-glass w-full md:w-auto"
            >
              <RiArrowLeftLine size={16} />
              <span>Back to Receipt History</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports/new')}
              className="!hidden md:!inline-flex onco-hero-btn-primary"
            >
              <RiAddLine size={17} />
              <span>New Pathology Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Split Settings Workspace ─────────────────────────────────── */}
      <div className="onco-rep-settings-shell">
        {/* Left Navigation Dock */}
        <aside className="onco-rep-settings-nav space-y-2">
          <div className="px-2.5 py-1.5 lg:px-3 lg:py-2 border-b border-surface-border mb-1.5 lg:mb-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-blue">
              Configuration Modules
            </p>
            <p className="text-xs font-bold text-ink-primary mt-0.5 hidden lg:block">
              Pathology Report Engine
            </p>
          </div>

          <div className="onco-rep-settings-tabs-strip">
            {navItems.map((tab) => {
              const Icon = tab.icon
              const isActive = activeSubTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`w-full md:w-auto lg:w-full flex items-center justify-between gap-3 px-3.5 py-2.5 lg:py-3 rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#152458] to-brand-blue text-white border-sky-400/35 shadow-md'
                      : 'bg-surface-base/40 md:bg-transparent border-surface-border/70 md:border-transparent text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'bg-surface-card md:bg-surface-base text-brand-blue'
                      }`}
                    >
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold leading-tight truncate">{tab.label}</p>
                      <p
                        className={`text-[10px] mt-0.5 block md:hidden lg:block truncate ${
                          isActive ? 'text-sky-200' : 'text-ink-secondary'
                        }`}
                      >
                        {tab.desc}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-300 shrink-0 md:hidden" />
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right Content Workspace */}
        <div className="onco-rep-settings-main">
          {/* ================================================================
              TAB 1: INSTITUTE BRANDING
              ================================================================ */}
          {activeSubTab === 'institute' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-surface-border">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20 mb-1.5">
                    <RiHotelLine size={12} /> Official Report Header & Seal
                  </span>
                  <h2 className="text-lg font-extrabold text-ink-primary">
                    Institute Details & Branding
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Configure the institutional identity, contact coordinates, logo, and official
                    verification stamp printed on generated PDF receipts.
                  </p>
                </div>
              </div>

              {/* Live PDF Letterhead Preview Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#152458] to-[#1D3888] text-white border border-cyan-400/25 shadow-md overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-white/10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
                    Live Report Letterhead Preview
                  </span>
                  <span className="text-[10px] font-semibold text-sky-200">
                    Synced with PDF
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                      {instLogo ? (
                        <img
                          src={instLogo}
                          alt="Institute Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <RiHotelLine size={22} className="text-cyan-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-extrabold !text-white tracking-wide uppercase break-words">
                        {instName || 'INSTITUTE OF CANCER AND STEM CELL RESEARCH'}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-sky-100/85 mt-0.5 break-words">
                        {instAddress || 'M4 Mishika Tower Sapna Sangeeta Indore M.P. 452001'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] sm:text-[11px] text-cyan-200 mt-1 break-all">
                        {instWebsite && <span>{instWebsite}</span>}
                        {instEmail && <span>· {instEmail}</span>}
                        {instContact && <span>· {instContact}</span>}
                      </div>
                    </div>
                  </div>

                  {instStamp && (
                    <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 shrink-0">
                      <img
                        src={instStamp}
                        alt="Official Stamp"
                        className="w-10 h-10 object-contain"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Official Seal Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Institute Branding Form */}
              <form onSubmit={handleInstituteSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Institute Full Name" required>
                    <Input
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      placeholder="INSTITUTE OF CANCER AND STEM CELL RESEARCH"
                      className="h-10 font-semibold"
                    />
                  </FormField>

                  <FormField label="Official Contact Number">
                    <div className="relative">
                      <RiPhoneLine
                        size={15}
                        className="absolute left-3 top-3 text-ink-secondary"
                      />
                      <Input
                        value={instContact}
                        onChange={(e) => setInstContact(e.target.value)}
                        placeholder="+91 7582950349"
                        className="h-10 pl-9"
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="Physical Street & City Address" required>
                  <div className="relative">
                    <RiMapPin2Line
                      size={15}
                      className="absolute left-3 top-3 text-ink-secondary"
                    />
                    <Input
                      value={instAddress}
                      onChange={(e) => setInstAddress(e.target.value)}
                      placeholder="M4 Mishika Tower Sapna Sangeeta Indore M.P. 452001"
                      className="h-10 pl-9"
                    />
                  </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Official Website URL">
                    <div className="relative">
                      <RiGlobalLine
                        size={15}
                        className="absolute left-3 top-3 text-ink-secondary"
                      />
                      <Input
                        value={instWebsite}
                        onChange={(e) => setInstWebsite(e.target.value)}
                        placeholder="www.icsrofficial.com"
                        className="h-10 pl-9"
                      />
                    </div>
                  </FormField>

                  <FormField label="Official Institutional Email">
                    <div className="relative">
                      <RiMailLine
                        size={15}
                        className="absolute left-3 top-3 text-ink-secondary"
                      />
                      <Input
                        value={instEmail}
                        onChange={(e) => setInstEmail(e.target.value)}
                        placeholder="icsrofficial@gmail.com"
                        className="h-10 pl-9"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Upload Logo & Official Stamp Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-2">
                  {/* Card 1: Institute Logo */}
                  <div className="onco-upload-showcase-card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                          Institute Emblem / Logo
                        </p>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Displayed in the top header of pathology reports (PNG/JPG)
                        </p>
                      </div>
                      {instLogo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                          Configured
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5">
                      <div className="w-20 h-20 rounded-xl border border-surface-border bg-white flex items-center justify-center overflow-hidden shrink-0 p-2 shadow-inner">
                        {instLogo ? (
                          <img
                            src={instLogo}
                            alt="Logo Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 text-center">
                            No Logo
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto flex-1">
                        <label
                          className={`w-full sm:w-auto ${
                            uploadingType
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!!uploadingType}
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'logo')}
                          />
                          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl border border-surface-border bg-surface-card hover:border-brand-blue text-xs font-bold text-ink-primary transition-colors">
                            {uploadingType === 'logo' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                                <span>Uploading Logo…</span>
                              </>
                            ) : (
                              <>
                                <RiUploadCloud2Line size={15} className="text-brand-blue" />
                                <span>Upload Logo</span>
                              </>
                            )}
                          </span>
                        </label>

                        {instLogo && (
                          <button
                            type="button"
                            onClick={() => setInstLogo('')}
                            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/8 sm:bg-transparent hover:bg-rose-500/12 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Institute Official Stamp */}
                  <div className="onco-upload-showcase-card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                          Official Verification Stamp
                        </p>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Printed near the authorization footer block
                        </p>
                      </div>
                      {instStamp && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                          Configured
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5">
                      <div className="w-20 h-20 rounded-xl border border-surface-border bg-white flex items-center justify-center overflow-hidden shrink-0 p-2 shadow-inner">
                        {instStamp ? (
                          <img
                            src={instStamp}
                            alt="Stamp Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 text-center">
                            No Stamp
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto flex-1">
                        <label
                          className={`w-full sm:w-auto ${
                            uploadingType
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!!uploadingType}
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'stamp')}
                          />
                          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl border border-surface-border bg-surface-card hover:border-brand-blue text-xs font-bold text-ink-primary transition-colors">
                            {uploadingType === 'stamp' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                                <span>Uploading Stamp…</span>
                              </>
                            ) : (
                              <>
                                <RiUploadCloud2Line size={15} className="text-brand-blue" />
                                <span>Upload Stamp</span>
                              </>
                            )}
                          </span>
                        </label>

                        {instStamp && (
                          <button
                            type="button"
                            onClick={() => setInstStamp('')}
                            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/8 sm:bg-transparent hover:bg-rose-500/12 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-border flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="onco-hero-btn-primary w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Configuration…</span>
                      </>
                    ) : (
                      <>
                        <RiSaveLine size={16} />
                        <span>Save Branding Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================
              TAB 2: DOCTOR SIGNATURES
              ================================================================ */}
          {activeSubTab === 'signatures' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-surface-border">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20 mb-1.5">
                    <RiBallPenLine size={12} /> Clinical Signatory Authority
                  </span>
                  <h2 className="text-lg font-extrabold text-ink-primary">
                    Authorized Doctor Signatures
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Register, edit, and manage digitized clinician signatures available for
                    selection on diagnostic reports.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  {signatures.length} Active Signatories
                </span>
              </div>

              {/* Add New Signatory Card */}
              <form
                onSubmit={handleAddSignature}
                className="p-4 sm:p-5 rounded-2xl border border-surface-border bg-surface-base/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider flex items-center gap-2">
                    <RiAddLine size={15} className="text-brand-blue" />
                    <span>Register New Authorized Signatory</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <FormField label="Authorized Signatory Name & Credentials" required>
                    <div className="relative">
                      <RiStethoscopeLine
                        size={15}
                        className="absolute left-3 top-3 text-ink-secondary"
                      />
                      <Input
                        value={newDoctorName}
                        onChange={(e) => setNewDoctorName(e.target.value)}
                        placeholder="e.g. Dr. S. Somani"
                        className="h-10 pl-9 font-semibold"
                      />
                    </div>
                  </FormField>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink-secondary">
                      Digitized Signature Image <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {newSigUrl && (
                        <div className="h-10 border border-surface-border bg-white rounded-xl overflow-hidden flex items-center justify-center px-3 shadow-inner">
                          <img
                            src={newSigUrl}
                            alt="Signature Preview"
                            className="h-7 object-contain"
                          />
                        </div>
                      )}

                      <label
                        className={
                          uploadingType
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer'
                        }
                      >
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!!uploadingType}
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'signature')}
                        />
                        <span className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-surface-border bg-surface-card hover:border-brand-blue text-xs font-bold text-ink-primary transition-colors">
                          {uploadingType === 'signature' ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                              <span>Uploading…</span>
                            </>
                          ) : (
                            <>
                              <RiImageAddLine size={15} className="text-brand-blue" />
                              <span>{newSigUrl ? 'Replace Image' : 'Upload Signature'}</span>
                            </>
                          )}
                        </span>
                      </label>

                      {newSigUrl && (
                        <button
                          type="button"
                          onClick={() => setNewSigUrl('')}
                          className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="onco-hero-btn-primary w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Adding Signatory…</span>
                      </>
                    ) : (
                      <>
                        <RiAddLine size={16} />
                        <span>Add Authorized Signatory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Active Signatories Gallery Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">
                  Registered Signatories Directory
                </h4>

                {signatures.length === 0 ? (
                  <div className="p-10 rounded-2xl border border-dashed border-surface-border text-center space-y-2">
                    <RiBallPenLine size={28} className="mx-auto text-ink-secondary opacity-60" />
                    <p className="text-xs font-bold text-ink-primary">
                      No Doctor Signatures Registered Yet
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      Upload a clinician signature above to enable automated report sign-off.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {signatures.map((sig) => {
                      const isEditing = editingSigId === sig.id
                      const isDeleting = deletingSigId === sig.id

                      return (
                        <div key={sig.id} className="onco-signature-card">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue">
                                  Editing Signatory
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingSigId(null)}
                                  className="text-ink-secondary hover:text-ink-primary cursor-pointer"
                                >
                                  <RiCloseLine size={16} />
                                </button>
                              </div>

                              <Input
                                value={editSigName}
                                onChange={(e) => setEditSigName(e.target.value)}
                                placeholder="Doctor Name"
                                className="h-9 text-xs font-bold"
                              />

                              <div className="flex items-center justify-between gap-2">
                                <div className="h-12 flex-1 bg-white border border-surface-border rounded-xl flex items-center justify-center p-1.5">
                                  {editSigUrl ? (
                                    <img
                                      src={editSigUrl}
                                      alt="Signature"
                                      className="h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-slate-400">No Image</span>
                                  )}
                                </div>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'edit_sig')}
                                  />
                                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-surface-border bg-surface-base hover:bg-surface-hover text-xs font-bold text-ink-primary">
                                    <RiUploadCloud2Line size={14} />
                                    <span>Change</span>
                                  </span>
                                </label>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingSigId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditSignature(sig.id)}
                                  disabled={loading}
                                  className="px-3.5 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <RiCheckLine size={14} />
                                  <span>Save</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                                    <RiStethoscopeLine size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-ink-primary truncate">
                                      {sig.doctor_name}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Authorized & Active
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditSignature(sig)}
                                    className="onco-action-btn !w-7 !h-7"
                                    title="Edit Signatory"
                                  >
                                    <RiEditLine size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingSigId(sig.id)}
                                    className="onco-action-btn danger !w-7 !h-7"
                                    title="Remove Signatory"
                                  >
                                    <RiDeleteBin6Line size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* White Canvas Signature Preview Box */}
                              <div className="h-16 w-full bg-white border border-surface-border rounded-xl flex items-center justify-center p-2 shadow-inner">
                                <img
                                  src={sig.signature_url}
                                  alt={`${sig.doctor_name} signature`}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>

                              {isDeleting && (
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                                    Remove this signature?
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSignature(sig.id)}
                                      disabled={loading}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-extrabold cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingSigId(null)}
                                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-ink-secondary hover:text-ink-primary cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: MASTER PARAMETERS
              ================================================================ */}
          {activeSubTab === 'parameters' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-surface-border">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20 mb-1.5">
                    <RiFlaskLine size={12} /> Biomarker Reference Calibration
                  </span>
                  <h2 className="text-lg font-extrabold text-ink-primary">
                    Master Parameter Configurations
                  </h2>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Manage oxidative damage and antioxidant defence biomarker names, units,
                    reference ranges, and default clinical interpretations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {!confirmResetParams ? (
                    <button
                      type="button"
                      onClick={() => setConfirmResetParams(true)}
                      className="flex-1 sm:flex-initial justify-center px-3 py-2 rounded-xl border border-surface-border bg-surface-base hover:bg-surface-hover text-xs font-bold text-ink-primary flex items-center gap-1.5 cursor-pointer"
                    >
                      <RiRefreshLine size={14} />
                      <span>Reset ICSR Defaults</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-base border border-brand-blue/40 w-full sm:w-auto">
                      <span className="text-xs font-bold text-ink-primary">
                        Restore ICSR defaults?
                      </span>
                      <button
                        type="button"
                        onClick={handleResetDefaultParameters}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-lg bg-brand-blue text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetParams(false)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-ink-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddParamForm((prev) => !prev)}
                    className="onco-hero-btn-primary flex-1 sm:flex-initial"
                  >
                    <RiAddLine size={16} />
                    <span>{showAddParamForm ? 'Close Form' : 'Add Parameter'}</span>
                  </button>
                </div>
              </div>

              {templates.map((tpl) => {
                const allParams = tpl.parameters || []
                const filteredParams =
                  paramSectionFilter === 'ALL'
                    ? allParams
                    : allParams.filter((p) => p.section === paramSectionFilter)

                return (
                  <div key={tpl.id} className="space-y-4">
                    {/* Template Header Card */}
                    <div className="p-4 rounded-2xl bg-surface-base border border-surface-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue/12 text-brand-blue flex items-center justify-center">
                          <RiFileList3Line size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-ink-primary">
                              {tpl.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                              {tpl.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-secondary mt-0.5">
                            {allParams.length} configured biomarker parameters · 3-Page ICSR
                            Diagnostic Layout
                          </p>
                        </div>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="onco-filter-pill-group">
                        {['ALL', 'Oxidative Damage', 'Antioxidant Defence'].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setParamSectionFilter(sec)}
                            className={`onco-filter-pill ${
                              paramSectionFilter === sec ? 'active' : ''
                            }`}
                          >
                            {sec === 'ALL' ? `All (${allParams.length})` : sec}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collapsible Add New Parameter Form */}
                    {showAddParamForm && (
                      <form
                        onSubmit={(e) => handleCreateParameter(e, tpl.id)}
                        className="p-5 rounded-2xl border border-brand-blue/35 bg-brand-blue/5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                            <RiAddLine size={15} className="text-brand-blue" />
                            <span>Add New Master Biomarker Parameter</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowAddParamForm(false)}
                            className="text-ink-secondary hover:text-ink-primary cursor-pointer"
                          >
                            <RiCloseLine size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <FormField label="Parameter Full Name" required>
                            <Input
                              value={newParamData.name}
                              onChange={(e) =>
                                setNewParamData({ ...newParamData, name: e.target.value })
                              }
                              placeholder="e.g. Superoxide Dismutase (SOD)"
                              className="h-9 text-xs"
                            />
                          </FormField>

                          <FormField label="Parameter Code" required>
                            <Input
                              value={newParamData.code}
                              onChange={(e) =>
                                setNewParamData({ ...newParamData, code: e.target.value })
                              }
                              placeholder="e.g. SOD"
                              className="h-9 text-xs font-mono uppercase"
                            />
                          </FormField>

                          <FormField label="Clinical Section" required>
                            <select
                              value={newParamData.section}
                              onChange={(e) =>
                                setNewParamData({ ...newParamData, section: e.target.value })
                              }
                              className="w-full h-9 px-3 rounded-md border border-surface-border bg-surface-card text-xs font-semibold text-ink-primary"
                            >
                              <option value="Oxidative Damage">Oxidative Damage</option>
                              <option value="Antioxidant Defence">Antioxidant Defence</option>
                            </select>
                          </FormField>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <FormField label="Reference Range" required>
                            <Input
                              value={newParamData.reference_range}
                              onChange={(e) =>
                                setNewParamData({
                                  ...newParamData,
                                  reference_range: e.target.value,
                                })
                              }
                              placeholder="e.g. 1.5 - 4.5"
                              className="h-9 text-xs font-mono"
                            />
                          </FormField>

                          <FormField label="Measurement Unit (Optional)">
                            <Input
                              value={newParamData.unit}
                              onChange={(e) =>
                                setNewParamData({ ...newParamData, unit: e.target.value })
                              }
                              placeholder="e.g. µmol/L"
                              className="h-9 text-xs font-mono"
                            />
                          </FormField>

                          <FormField label="Default Clinical Interpretation" required>
                            <Input
                              value={newParamData.default_interpretation}
                              onChange={(e) =>
                                setNewParamData({
                                  ...newParamData,
                                  default_interpretation: e.target.value,
                                })
                              }
                              placeholder="e.g. Enzymatic Defense Marker"
                              className="h-9 text-xs"
                            />
                          </FormField>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddParamForm(false)}
                            className="px-3.5 py-1.5 rounded-xl border border-surface-border text-xs font-bold text-ink-secondary cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="onco-hero-btn-primary"
                          >
                            <RiCheckLine size={15} />
                            <span>Save New Parameter</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Parameter Cards / Structured Table */}
                    <div className="space-y-3">
                      {filteredParams.map((param, idx) => {
                        const isEditing = editingParamId === param.id
                        const isDamage = param.section === 'Oxidative Damage'

                        return (
                          <div key={param.id} className="onco-master-param-card">
                            {isEditing ? (
                              <div className="space-y-3.5">
                                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                                  <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider">
                                    Editing Parameter: {param.code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingParamId(null)}
                                    className="text-ink-secondary hover:text-ink-primary cursor-pointer"
                                  >
                                    <RiCloseLine size={16} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <FormField label="Parameter Name" required>
                                    <Input
                                      value={editParamData.name}
                                      onChange={(e) =>
                                        setEditParamData({
                                          ...editParamData,
                                          name: e.target.value,
                                        })
                                      }
                                      className="h-9 text-xs font-semibold"
                                    />
                                  </FormField>

                                  <FormField label="Section Category" required>
                                    <select
                                      value={editParamData.section}
                                      onChange={(e) =>
                                        setEditParamData({
                                          ...editParamData,
                                          section: e.target.value,
                                        })
                                      }
                                      className="w-full h-9 px-3 rounded-md border border-surface-border bg-surface-card text-xs font-semibold text-ink-primary"
                                    >
                                      <option value="Oxidative Damage">Oxidative Damage</option>
                                      <option value="Antioxidant Defence">
                                        Antioxidant Defence
                                      </option>
                                    </select>
                                  </FormField>

                                  <FormField label="Measurement Unit">
                                    <Input
                                      value={editParamData.unit}
                                      onChange={(e) =>
                                        setEditParamData({
                                          ...editParamData,
                                          unit: e.target.value,
                                        })
                                      }
                                      placeholder="e.g. µmol/L or leave blank"
                                      className="h-9 text-xs font-mono"
                                    />
                                  </FormField>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <FormField label="Reference Range" required>
                                    <Input
                                      value={editParamData.reference_range}
                                      onChange={(e) =>
                                        setEditParamData({
                                          ...editParamData,
                                          reference_range: e.target.value,
                                        })
                                      }
                                      className="h-9 text-xs font-mono font-bold"
                                    />
                                  </FormField>

                                  <FormField label="Default Clinical Interpretation" required>
                                    <Input
                                      value={editParamData.default_interpretation}
                                      onChange={(e) =>
                                        setEditParamData({
                                          ...editParamData,
                                          default_interpretation: e.target.value,
                                        })
                                      }
                                      className="h-9 text-xs"
                                    />
                                  </FormField>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingParamId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold text-ink-secondary cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditParam(param.id)}
                                    disabled={loading}
                                    className="px-3.5 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <RiCheckLine size={14} />
                                    <span>Save Parameter</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-surface-base border border-surface-border flex items-center justify-center text-xs font-mono font-extrabold text-brand-blue shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xs sm:text-sm font-extrabold text-ink-primary">
                                        {param.name}
                                      </p>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                                        {param.code}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                          isDamage
                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                        }`}
                                      >
                                        {param.section}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-0.5">
                                      <span>
                                        Reference Range:{' '}
                                        <strong className="font-mono text-ink-primary bg-surface-base px-2 py-0.5 rounded border border-surface-border">
                                          {param.reference_range}
                                        </strong>
                                      </span>
                                      {param.unit && (
                                        <span>
                                          Unit:{' '}
                                          <strong className="font-mono text-ink-primary">
                                            {param.unit}
                                          </strong>
                                        </span>
                                      )}
                                      <span>
                                        Default Interpretation:{' '}
                                        <strong className="text-ink-primary">
                                          {param.default_interpretation}
                                        </strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleStartEditParam(param)}
                                  className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-xl border border-surface-border bg-surface-base hover:border-brand-blue hover:text-brand-blue text-xs font-bold text-ink-primary flex items-center gap-1.5 self-stretch sm:self-center shrink-0 transition-colors cursor-pointer"
                                >
                                  <RiEditLine size={14} />
                                  <span>Edit Range</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
