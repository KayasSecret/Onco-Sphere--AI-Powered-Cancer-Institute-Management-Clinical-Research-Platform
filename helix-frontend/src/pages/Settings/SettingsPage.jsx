import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from '../../services/axiosInstance'
import {
  selectUser,
  selectUserRole,
  updateUserProfile,
  logoutThunk,
} from '../../redux/slices/authSlice'
import { selectSidebarOpen, setSidebarOpen } from '../../redux/slices/uiSlice'
import FormField from '../../components/FormField'
import { Input } from '../../components/ui/input'
import { toast } from 'sonner'
import {
  RiUserLine,
  RiPaletteLine,
  RiShieldKeyholeLine,
  RiInformationLine,
  RiCloudLine,
  RiDatabaseLine,
  RiShieldCheckLine,
  RiComputerLine,
  RiSunLine,
  RiMoonLine,
  RiServerLine,
  RiEditLine,
  RiCameraLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiDownload2Line,
  RiFileCopyLine,
  RiLockPasswordLine,
  RiLogoutBoxRLine,
  RiSparklingLine,
  RiLayoutLeftLine,
  RiFontSize,
  RiContrastDrop2Line,
  RiFilePdf2Line,
  RiImageLine,
  RiHardDrive2Line,
  RiUserSmileLine,
  RiArrowRightUpLine,
  RiDeleteBin6Line,
  RiAlertLine,
  RiCheckboxCircleFill,
} from 'react-icons/ri'
import authService from '../../services/authService'
import PhotoSelector from '../../components/PhotoSelector'
import { passwordRegex } from '../../lib/validation'
import ICSRLogo from '../../assets/ICSR-LOGO.png'
import './SettingsPage.css'

const passwordSchema = yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup
    .string()
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('New password is required'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('new_password')], 'Passwords do not match')
    .required('Please confirm your new password'),
})

const ACCENT_OPTIONS = [
  {
    id: 'royal',
    name: 'Onco Royal Blue',
    desc: 'Default institutional clinical blue',
    blue: '#3D6BC5',
    dark: '#2E56A8',
    light: '#5582D4',
  },
  {
    id: 'cyan',
    name: 'Cerulean Lab Cyan',
    desc: 'High-clarity diagnostic cyan',
    blue: '#0284C7',
    dark: '#0369A1',
    light: '#38BDF8',
  },
  {
    id: 'indigo',
    name: 'Molecular Indigo',
    desc: 'Deep genomic research violet-blue',
    blue: '#4F46E5',
    dark: '#4338CA',
    light: '#818CF8',
  },
  {
    id: 'teal',
    name: 'Biometric Teal',
    desc: 'Surgical precision emerald-teal',
    blue: '#0D9488',
    dark: '#0F766E',
    light: '#2DD4BF',
  },
]

const DENSITY_OPTIONS = [
  {
    id: '14px',
    label: 'Compact Clinical',
    sub: '14px base · Maximum table & telemetry density',
  },
  {
    id: '15px',
    label: 'Standard Laboratory',
    sub: '15px base · Calibrated default clinical hierarchy',
  },
  {
    id: '16px',
    label: 'Comfortable Review',
    sub: '16px base · Enlarged typography for extended reading',
  },
]

export default function SettingsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const role = useSelector(selectUserRole)
  const sidebarOpen = useSelector(selectSidebarOpen)
  const isSuperAdmin = role === 'SUPER_ADMIN'

  // Active Section Tab
  const [activeTab, setActiveTab] = useState('account')

  // Profile Edit & Confirmation State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(user?.full_name || '')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photo_url || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false)
  const [copiedField, setCopiedField] = useState('')

  // Sync profile inputs when user loads
  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '')
      setProfilePhotoUrl(user.photo_url || '')
    }
  }, [user])

  // Appearance States (Persisted in localStorage & applied live to DOM)
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'light')
  const [accentId, setAccentId] = useState(() => localStorage.getItem('helix_accent') || 'royal')
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('helix_font_scale') || '15px')
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem('helix_reduced_motion') === 'true'
  )
  const [confirmResetAppearance, setConfirmResetAppearance] = useState(false)

  // Storage & Cloud States
  const [cloudinaryStatus, setCloudinaryStatus] = useState(null)
  const [loadingCloudinary, setLoadingCloudinary] = useState(false)
  const [storageStats, setStorageStats] = useState(null)
  const [loadingStorage, setLoadingStorage] = useState(false)
  const [highlightedStorageCat, setHighlightedStorageCat] = useState(null)

  // Security & Password States
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmLogoutSession, setConfirmLogoutSession] = useState(false)

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: yupResolver(passwordSchema),
  })

  const watchedNewPassword = watchPassword('new_password', '')

  // Password complexity live evaluation
  const passwordChecks = useMemo(() => {
    const val = watchedNewPassword || ''
    return [
      { id: 'len', label: '8+ Characters', met: val.length >= 8 },
      { id: 'upper', label: 'Uppercase (A-Z)', met: /[A-Z]/.test(val) },
      { id: 'lower', label: 'Lowercase (a-z)', met: /[a-z]/.test(val) },
      { id: 'num', label: 'Number (0-9)', met: /\d/.test(val) },
      { id: 'spec', label: 'Special Symbol', met: /[^A-Za-z0-9]/.test(val) },
    ]
  }, [watchedNewPassword])

  const passwordStrengthScore = useMemo(
    () => passwordChecks.filter((c) => c.met).length,
    [passwordChecks]
  )

  // Detect current client environment for Security session telemetry
  const sessionEnvironment = useMemo(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    let browser = 'Modern Web Browser'
    if (ua.includes('Edg/')) browser = 'Microsoft Edge (Chromium)'
    else if (ua.includes('Chrome/')) browser = 'Google Chrome'
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox'
    else if (ua.includes('Safari/')) browser = 'Apple Safari'

    let os = 'Workstation OS'
    if (ua.includes('Win')) os = 'Windows Workstation'
    else if (ua.includes('Mac')) os = 'macOS Workstation'
    else if (ua.includes('Linux')) os = 'Linux System'

    return `${browser} · ${os}`
  }, [])

  // Load Storage Stats
  const loadStorageStats = () => {
    setLoadingStorage(true)
    api
      .get('/api/v1/upload/storage')
      .then((res) => {
        setStorageStats(res.data)
      })
      .catch((err) => {
        console.error('Failed to load storage stats:', err)
        toast.error('Unable to refresh storage telemetry.')
      })
      .finally(() => {
        setLoadingStorage(false)
      })
  }

  useEffect(() => {
    if ((activeTab === 'storage' || activeTab === 'about') && role !== 'STUDENT') {
      loadStorageStats()
    }
  }, [activeTab, role])

  useEffect(() => {
    if (isSuperAdmin) {
      setLoadingCloudinary(true)
      api
        .get('/api/v1/upload/status')
        .then((res) => {
          setCloudinaryStatus(res.data)
        })
        .catch(() => {
          setCloudinaryStatus({ provider: 'Local Storage (Fallback)', active: false })
        })
        .finally(() => {
          setLoadingCloudinary(false)
        })
    }
  }, [isSuperAdmin])

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleCopyText = (text, label) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedField(label)
    toast.success(`${label} copied to clipboard.`)
    setTimeout(() => setCopiedField(''), 2000)
  }

  // ── Appearance Handlers ──────────────────────────────────────────────────
  const handleThemeChange = (mode) => {
    setThemeMode(mode)
    localStorage.setItem('theme', mode)
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    toast.success(
      `Appearance theme set to ${mode === 'dark' ? 'Sleek Dark' : 'Classic Light'} mode.`
    )
  }

  const handleAccentChange = (option) => {
    setAccentId(option.id)
    localStorage.setItem('helix_accent', option.id)
    const root = document.documentElement
    root.style.setProperty('--color-blue', option.blue)
    root.style.setProperty('--color-blue-dark', option.dark)
    root.style.setProperty('--color-blue-light', option.light)
    toast.success(`Clinical accent calibrated to ${option.name}.`)
  }

  const handleFontScaleChange = (scale) => {
    setFontScale(scale)
    localStorage.setItem('helix_font_scale', scale)
    document.documentElement.style.fontSize = scale
    const found = DENSITY_OPTIONS.find((d) => d.id === scale)
    toast.success(`Interface density set to ${found ? found.label : scale}.`)
  }

  const handleReducedMotionToggle = () => {
    const next = !reducedMotion
    setReducedMotion(next)
    localStorage.setItem('helix_reduced_motion', String(next))
    if (next) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
    toast.success(
      next ? 'Reduced motion enabled for clinical accessibility.' : 'Standard animations restored.'
    )
  }

  const handleSidebarDefaultToggle = () => {
    const next = !sidebarOpen
    dispatch(setSidebarOpen(next))
    toast.success(next ? 'Navigation sidebar expanded.' : 'Navigation sidebar collapsed.')
  }

  const handleResetAppearance = () => {
    handleThemeChange('light')
    handleAccentChange(ACCENT_OPTIONS[0])
    handleFontScaleChange('15px')
    setReducedMotion(false)
    localStorage.setItem('helix_reduced_motion', 'false')
    document.documentElement.classList.remove('reduce-motion')
    dispatch(setSidebarOpen(true))
    setConfirmResetAppearance(false)
    toast.success('All appearance settings restored to factory clinical defaults.')
  }

  // ── Profile Handlers ─────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profileName.trim()) {
      toast.error('Name cannot be empty.')
      return
    }
    setSavingProfile(true)
    try {
      const res = await authService.updateProfile({
        full_name: profileName.trim(),
        photo_url: profilePhotoUrl || '',
      })

      dispatch(
        updateUserProfile({
          full_name: res.data.full_name,
          photo_url: res.data.photo_url,
        })
      )

      toast.success('Profile details saved successfully.')
      setIsEditingProfile(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      let errorMsg = 'Failed to update profile details.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ')
      }
      toast.error(errorMsg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDirectPhotoChange = async (newPhotoUrl) => {
    setSavingProfile(true)
    try {
      const res = await authService.updateProfile({
        full_name: user?.full_name || profileName,
        photo_url: newPhotoUrl || '',
      })

      setProfilePhotoUrl(res.data.photo_url || '')
      dispatch(
        updateUserProfile({
          full_name: res.data.full_name,
          photo_url: res.data.photo_url,
        })
      )
      setConfirmRemovePhoto(false)
      toast.success(newPhotoUrl ? 'Profile photo updated successfully.' : 'Profile photo removed.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile photo.')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Password & Session Handlers ──────────────────────────────────────────
  const handlePasswordSubmit = async (data) => {
    setLoadingPassword(true)
    try {
      await authService.changePassword(user.id, data.current_password, data.new_password)
      toast.success('Password changed successfully.')
      resetPassword()
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          'Failed to update password. Please check your current password.'
      )
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleTerminateSession = async () => {
    await dispatch(logoutThunk())
    toast.success('Clinical session terminated securely.')
    navigate('/login', { replace: true })
  }

  // ── Export Storage Audit Snapshot ────────────────────────────────────────
  const handleExportStorageAudit = (stats) => {
    const payload = {
      platform: 'Onco Sphere — Clinical Intelligence Platform',
      generated_at: new Date().toISOString(),
      audited_by: user?.email || user?.full_name,
      role: user?.role,
      storage_provider: stats.cloudinary_active ? 'Cloudinary Encrypted Cloud' : 'Local Storage',
      metrics: {
        total_used_bytes: stats.total_used_bytes,
        total_used_formatted: formatBytes(stats.total_used_bytes),
        capacity_bytes: stats.capacity_bytes,
        capacity_formatted: formatBytes(stats.capacity_bytes),
        utilized_percent: `${stats.utilized_percent}%`,
        breakdown: {
          clinical_reports: formatBytes(stats.reports_bytes),
          cancer_scan_images: formatBytes(stats.images_bytes),
          system_backups_logs: formatBytes(stats.backups_bytes),
          profile_avatars: formatBytes(stats.avatars_bytes),
        },
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `onco-sphere-storage-audit-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Storage audit telemetry report downloaded.')
  }

  // Navigation items definition
  const navTabs = [
    {
      id: 'account',
      label: 'Account Overview',
      desc: 'Identity & role clearance',
      icon: RiUserLine,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      desc: 'Theme, accents & density',
      icon: RiPaletteLine,
    },
    {
      id: 'storage',
      label: 'Storage',
      desc: 'Media & capacity analytics',
      icon: RiDatabaseLine,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      id: 'security',
      label: 'Security',
      desc: 'Credentials & protection',
      icon: RiShieldKeyholeLine,
    },
    {
      id: 'about',
      label: 'About Onco Sphere',
      desc: 'Architecture & release specs',
      icon: RiInformationLine,
    },
  ].filter((tab) => !tab.roles || tab.roles.includes(role))

  const roleClearanceLabel =
    role === 'SUPER_ADMIN'
      ? 'Tier 1 · Institutional Super Admin'
      : role === 'ADMIN'
      ? 'Tier 2 · Clinical Administrator'
      : 'Tier 3 · Research Fellow / Student'

  return (
    <div className="onco-settings-page">
      {/* ── Top Clinical Control Center Hero Banner ───────────────────────── */}
      <section className="onco-settings-hero">
        <div className="onco-settings-hero-inner">
          <div>
            <div className="onco-settings-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span className="text-white">System Settings</span>
            </div>
            <div className="onco-settings-eyebrow">
              <RiSparklingLine size={12} />
              <span>Clinical Control Center · Preferences & Telemetry</span>
            </div>
            <h1 className="onco-settings-title">Settings & Platform Configuration</h1>
            <p className="onco-settings-subtitle">
              Calibrate your clinical operator profile, visual laboratory interface, encrypted storage
              allocation, authentication credentials, and system specifications.
            </p>
          </div>

          {/* Right Live Telemetry Strip */}
          <div className="onco-settings-telemetry-strip">
            <div className="onco-settings-telemetry-pill">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <RiShieldCheckLine size={17} />
              </div>
              <div>
                <div className="onco-settings-telemetry-label">Clearance Level</div>
                <div className="onco-settings-telemetry-val">
                  {user?.role?.replace('_', ' ') || 'AUTHENTICATED'}
                </div>
              </div>
            </div>

            <div className="onco-settings-telemetry-pill">
              <div className="w-8 h-8 rounded-lg bg-blue-400/15 border border-blue-400/30 flex items-center justify-center text-blue-300">
                {themeMode === 'dark' ? <RiMoonLine size={17} /> : <RiSunLine size={17} />}
              </div>
              <div>
                <div className="onco-settings-telemetry-label">Interface Mode</div>
                <div className="onco-settings-telemetry-val">
                  {themeMode === 'dark' ? 'Sleek Dark' : 'Classic Light'}
                </div>
              </div>
            </div>

            <div className="onco-settings-telemetry-pill">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="onco-settings-telemetry-label">Security State</div>
                <div className="onco-settings-telemetry-val text-emerald-300">Audited · Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Split Workspace ──────────────────────────────────────────── */}
      <div className="onco-settings-shell">
        {/* Left Sub-Navigation Dock */}
        <aside className="onco-settings-dock">
          {/* Operator Mini Summary Card */}
          <div className="onco-dock-operator-card">
            <div className="onco-dock-avatar">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-ink-primary truncate">
                {user?.full_name || 'Clinical Operator'}
              </p>
              <p className="text-[11px] text-ink-secondary truncate">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-brand-blue/15 text-brand-blue border border-brand-blue/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Section Navigation Buttons */}
          <nav className="onco-dock-nav-list" aria-label="Settings Sections">
            {navTabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`onco-dock-nav-btn ${isActive ? 'active' : ''}`}
                >
                  <div className="onco-dock-nav-icon">
                    <IconComponent size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="onco-dock-nav-title">{tab.label}</div>
                    <div className="onco-dock-nav-desc hidden md:block">{tab.desc}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Right Content Workspace */}
        <div className="onco-settings-content">
          {/* ================================================================
              SECTION 1: ACCOUNT OVERVIEW
              ================================================================ */}
          {activeTab === 'account' && (
            <div className="onco-section-pane">
              <div className="onco-section-header">
                <div>
                  <span className="onco-section-badge">
                    <RiUserLine size={12} /> Operator Identity & Dossier
                  </span>
                  <h2 className="onco-section-title">Account Profile Overview</h2>
                  <p className="onco-section-desc">
                    Manage your verified clinical operator credentials, biometric avatar, and
                    role-based access clearance.
                  </p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="onco-btn-primary"
                  >
                    <RiEditLine size={15} />
                    <span>Edit Profile Details</span>
                  </button>
                )}
              </div>

              {/* Hero Identity Card */}
              <div className="onco-identity-banner">
                <div className="onco-identity-banner-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                    <PhotoSelector
                      value={user?.photo_url}
                      onChange={(newUrl) => handleDirectPhotoChange(newUrl)}
                      customTrigger={({ openModal }) => (
                        <button
                          type="button"
                          onClick={openModal}
                          title="Click to capture or upload profile picture"
                          className="onco-avatar-trigger"
                        >
                          {user?.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user?.full_name?.charAt(0) || 'U'
                          )}
                          <div className="onco-avatar-overlay">
                            <RiCameraLine size={20} />
                            <span className="text-[9px] font-extrabold tracking-wider mt-0.5 uppercase">
                              Update
                            </span>
                          </div>
                        </button>
                      )}
                    />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-extrabold !text-white tracking-tight truncate">
                          {user?.full_name || 'Clinical Operator'}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/35">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active / Audited
                        </span>
                      </div>

                      <p className="text-xs text-sky-100/85 font-medium truncate">{user?.email}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/12 text-sky-200 border border-white/15">
                          <RiShieldCheckLine size={13} className="text-cyan-300" />
                          {user?.role?.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-900/45 text-slate-200 border border-white/10">
                          {roleClearanceLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Avatar Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {user?.photo_url && !confirmRemovePhoto && (
                      <button
                        type="button"
                        onClick={() => setConfirmRemovePhoto(true)}
                        disabled={savingProfile}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-colors cursor-pointer"
                      >
                        <RiDeleteBin6Line size={14} />
                        <span>Remove Photo</span>
                      </button>
                    )}

                    {confirmRemovePhoto && (
                      <div className="flex items-center gap-2 bg-slate-950/75 border border-rose-400/40 px-3 py-1.5 rounded-xl">
                        <span className="text-[11px] font-bold text-rose-200">Remove avatar?</span>
                        <button
                          type="button"
                          onClick={() => handleDirectPhotoChange('')}
                          disabled={savingProfile}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemovePhoto(false)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Mode Form OR Structured Dossier Cards */}
              {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="onco-settings-card space-y-5">
                  <div className="flex items-center justify-between border-b border-surface-border pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-ink-primary">
                        Edit Operator Profile Credentials
                      </h4>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        Changes synchronize immediately across your clinical workspace and audit
                        trail.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                      Editing Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Registered Full Name" required>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Dr. Maya Sharma"
                        className="h-10 font-semibold"
                      />
                    </FormField>

                    <FormField label="Institutional Email (Read-Only Identifier)">
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="h-10 opacity-75 cursor-not-allowed"
                      />
                    </FormField>
                  </div>

                  <FormField label="Profile Picture (Webcam Selfie Capture or Local Image File)">
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <PhotoSelector
                        value={profilePhotoUrl}
                        onChange={(url) => setProfilePhotoUrl(url)}
                      />
                      {profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setProfilePhotoUrl('')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-status-critical bg-status-critical/10 hover:bg-status-critical/15 border border-status-critical/20 transition-colors cursor-pointer"
                        >
                          <RiDeleteBin6Line size={14} />
                          <span>Clear Selected Photo</span>
                        </button>
                      )}
                    </div>
                  </FormField>

                  <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
                    <button type="submit" disabled={savingProfile} className="onco-btn-primary">
                      {savingProfile ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Profile…</span>
                        </>
                      ) : (
                        <>
                          <RiCheckLine size={16} />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileName(user?.full_name || '')
                        setProfilePhotoUrl(user?.photo_url || '')
                        setIsEditingProfile(false)
                      }}
                      className="onco-btn-secondary"
                    >
                      <RiCloseLine size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* 4-Card Structured Operator Dossier */}
                  <div className="onco-dossier-grid">
                    <div className="onco-field-tile">
                      <div>
                        <div className="onco-field-label">Registered Operator Name</div>
                        <div className="onco-field-val">{user?.full_name || '—'}</div>
                        <p className="text-[11px] text-ink-secondary mt-1">
                          Displayed on clinical reports & system logs
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(user?.full_name, 'Registered Name')}
                        title="Copy name"
                        className="p-2 rounded-lg text-ink-secondary hover:text-brand-blue hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        {copiedField === 'Registered Name' ? (
                          <RiCheckLine size={15} className="text-emerald-500" />
                        ) : (
                          <RiFileCopyLine size={15} />
                        )}
                      </button>
                    </div>

                    <div className="onco-field-tile">
                      <div>
                        <div className="onco-field-label">Institutional Email Address</div>
                        <div className="onco-field-val">{user?.email || '—'}</div>
                        <p className="text-[11px] text-ink-secondary mt-1">
                          Primary login identifier & security alert channel
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(user?.email, 'Email Address')}
                        title="Copy email"
                        className="p-2 rounded-lg text-ink-secondary hover:text-brand-blue hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        {copiedField === 'Email Address' ? (
                          <RiCheckLine size={15} className="text-emerald-500" />
                        ) : (
                          <RiFileCopyLine size={15} />
                        )}
                      </button>
                    </div>

                    <div className="onco-field-tile">
                      <div>
                        <div className="onco-field-label">System Authority Role</div>
                        <div className="onco-field-val">{user?.role || '—'}</div>
                        <p className="text-[11px] text-ink-secondary mt-1">{roleClearanceLabel}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                        RBAC Verified
                      </span>
                    </div>

                    <div className="onco-field-tile">
                      <div>
                        <div className="onco-field-label">Account Status & Compliance</div>
                        <div className="onco-field-val text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active / Audited
                        </div>
                        <p className="text-[11px] text-ink-secondary mt-1">
                          Continuous HIPAA-aware PHI access auditing enabled
                        </p>
                      </div>
                      <RiShieldCheckLine size={20} className="text-emerald-500 shrink-0" />
                    </div>
                  </div>

                  {/* Role Permissions & Module Clearance Matrix */}
                  <div className="onco-settings-card space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                          Authorized Clinical Module Clearances
                        </h4>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Capabilities active for your <strong className="text-ink-primary">{user?.role}</strong> credential tier.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-0.5 rounded-full">
                        {role === 'SUPER_ADMIN'
                          ? '5 / 5 Modules Authorized'
                          : role === 'ADMIN'
                          ? '4 / 5 Modules Authorized'
                          : '2 / 5 Modules Authorized'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {[
                        {
                          name: 'Onco Dashboard Telemetry',
                          allowed: true,
                          desc: 'Cohort metrics & distribution analytics',
                        },
                        {
                          name: 'Onco Register (Patient Records)',
                          allowed: true,
                          desc:
                            role === 'STUDENT'
                              ? 'Read-only clinical registry access'
                              : 'Full patient registration & profile management',
                        },
                        {
                          name: 'Onco Receipt (Oxidative PDF)',
                          allowed: role === 'SUPER_ADMIN' || role === 'ADMIN',
                          desc: '3-Page ICSR diagnostic report generation',
                        },
                        {
                          name: 'Onco Access (Personnel Control)',
                          allowed: role === 'SUPER_ADMIN' || role === 'ADMIN',
                          desc: 'Admin provisioning & researcher approvals',
                        },
                        {
                          name: 'Storage & Cloud Telemetry',
                          allowed: role === 'SUPER_ADMIN' || role === 'ADMIN',
                          desc: 'Disk utilization & media pipeline audit',
                        },
                      ].map((mod) => (
                        <div
                          key={mod.name}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                            mod.allowed
                              ? 'bg-surface-card border-surface-border'
                              : 'bg-surface-base/50 border-surface-border/60 opacity-60'
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              mod.allowed
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-400/15 text-slate-400'
                            }`}
                          >
                            {mod.allowed ? <RiCheckLine size={13} /> : <RiCloseLine size={13} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink-primary truncate">{mod.name}</p>
                            <p className="text-[10px] text-ink-secondary leading-snug mt-0.5">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================
              SECTION 2: APPEARANCE
              ================================================================ */}
          {activeTab === 'appearance' && (
            <div className="onco-section-pane">
              <div className="onco-section-header">
                <div>
                  <span className="onco-section-badge">
                    <RiPaletteLine size={12} /> Visual Interface Calibration
                  </span>
                  <h2 className="onco-section-title">Appearance & Display Preferences</h2>
                  <p className="onco-section-desc">
                    Customize the clinical surface theme, laboratory accent color, typography scale,
                    and workspace behavior with instant live previews.
                  </p>
                </div>

                {!confirmResetAppearance ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetAppearance(true)}
                    className="onco-btn-secondary"
                  >
                    <RiRefreshLine size={14} />
                    <span>Restore Defaults</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-surface-base border border-surface-border px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-ink-primary">Reset appearance?</span>
                    <button
                      type="button"
                      onClick={handleResetAppearance}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-blue text-white cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetAppearance(false)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-ink-secondary hover:text-ink-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* 1. Theme Surface Mode Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-ink-primary uppercase tracking-wider flex items-center gap-2">
                    <RiSunLine size={15} className="text-brand-blue" />
                    <span>1. Clinical Surface Theme Mode</span>
                  </label>
                  <span className="text-[11px] font-semibold text-ink-secondary">
                    Persisted automatically to browser storage
                  </span>
                </div>

                <div className="onco-theme-grid">
                  {[
                    {
                      id: 'light',
                      name: 'Classic Light Laboratory',
                      desc: 'Clean daylight medical white surfaces with deep navy and royal blue contrast.',
                      icon: RiSunLine,
                      shellBg: 'bg-slate-100 border-slate-200',
                      sidebarBg: 'bg-white border-r border-slate-200',
                      cardBg: 'bg-white border border-slate-200',
                      textPrimary: 'bg-slate-800',
                      textSecondary: 'bg-slate-300',
                    },
                    {
                      id: 'dark',
                      name: 'Sleek Dark Telemetry',
                      desc: 'High-contrast obsidian slate environment engineered for low-light clinical rooms.',
                      icon: RiMoonLine,
                      shellBg: 'bg-slate-950 border-slate-800',
                      sidebarBg: 'bg-slate-900 border-r border-slate-800',
                      cardBg: 'bg-slate-900 border border-slate-800',
                      textPrimary: 'bg-slate-100',
                      textSecondary: 'bg-slate-700',
                    },
                  ].map((theme) => {
                    const ThemeIcon = theme.icon
                    const isSelected = themeMode === theme.id
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleThemeChange(theme.id)}
                        className={`onco-theme-card ${isSelected ? 'selected' : ''}`}
                      >
                        {/* Live Miniature Workspace Mockup */}
                        <div
                          className={`w-full h-28 rounded-xl border overflow-hidden flex ${theme.shellBg}`}
                        >
                          {/* Mock Sidebar */}
                          <div className={`w-14 h-full p-2 flex flex-col gap-1.5 ${theme.sidebarBg}`}>
                            <div className="w-5 h-5 rounded-md bg-brand-blue/90 mb-1" />
                            <div className="w-full h-2 rounded bg-brand-blue" />
                            <div className={`w-4/5 h-1.5 rounded ${theme.textSecondary}`} />
                            <div className={`w-3/4 h-1.5 rounded ${theme.textSecondary}`} />
                          </div>
                          {/* Mock Main Area */}
                          <div className="flex-1 p-2.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <div className={`w-20 h-2.5 rounded ${theme.textPrimary}`} />
                              <div className="w-5 h-5 rounded-full bg-brand-blue/80" />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 my-1">
                              <div className={`h-9 rounded-lg p-1.5 ${theme.cardBg}`}>
                                <div className="w-4 h-1.5 rounded bg-brand-blue mb-1" />
                                <div className={`w-7 h-2 rounded ${theme.textPrimary}`} />
                              </div>
                              <div className={`h-9 rounded-lg p-1.5 ${theme.cardBg}`}>
                                <div className="w-4 h-1.5 rounded bg-emerald-500 mb-1" />
                                <div className={`w-6 h-2 rounded ${theme.textPrimary}`} />
                              </div>
                              <div className={`h-9 rounded-lg p-1.5 ${theme.cardBg}`}>
                                <div className="w-4 h-1.5 rounded bg-cyan-500 mb-1" />
                                <div className={`w-7 h-2 rounded ${theme.textPrimary}`} />
                              </div>
                            </div>
                            <div className={`w-full h-4 rounded-md p-1 flex items-center ${theme.cardBg}`}>
                              <div className="w-2/3 h-1.5 rounded bg-brand-blue/70" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <ThemeIcon
                              size={18}
                              className={isSelected ? 'text-brand-blue' : 'text-ink-secondary'}
                            />
                            <span className="text-sm font-extrabold text-ink-primary">
                              {theme.name}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold bg-brand-blue/15 text-brand-blue px-2.5 py-0.5 rounded-full border border-brand-blue/30">
                              <RiCheckLine size={12} /> Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-ink-secondary">
                              Click to apply
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-secondary leading-relaxed">{theme.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Clinical Accent Color Calibration */}
              <div className="onco-settings-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                      <RiContrastDrop2Line size={15} className="text-brand-blue" />
                      <span>2. Primary Clinical Accent Palette</span>
                    </h4>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Calibrates active buttons, indicators, badges, and interactive focus rings
                      across Onco Sphere.
                    </p>
                  </div>
                </div>

                <div className="onco-accent-swatch-grid">
                  {ACCENT_OPTIONS.map((opt) => {
                    const isSelected = accentId === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAccentChange(opt)}
                        className={`onco-accent-btn ${isSelected ? 'selected' : ''}`}
                      >
                        <span
                          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${opt.dark} 0%, ${opt.blue} 100%)`,
                          }}
                        >
                          {isSelected && <RiCheckLine size={15} />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-ink-primary truncate">
                            {opt.name}
                          </p>
                          <p className="text-[10px] text-ink-secondary truncate">{opt.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Typography & Clinical Information Density */}
              <div className="onco-settings-card space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                    <RiFontSize size={15} className="text-brand-blue" />
                    <span>3. Interface Typography & Clinical Density</span>
                  </h4>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Adjusts root font scaling across patient registries, diagnostic forms, and
                    dashboards.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DENSITY_OPTIONS.map((opt) => {
                    const isSelected = fontScale === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleFontScaleChange(opt.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-blue bg-brand-blue/10 shadow-sm'
                            : 'border-surface-border bg-surface-card hover:border-brand-blue/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-ink-primary">
                            {opt.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-base text-brand-blue border border-surface-border">
                            {opt.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-secondary mt-1.5 leading-snug">
                          {opt.sub}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Interactive Workspace Behavior Toggles */}
              <div className="onco-settings-card space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                  <RiLayoutLeftLine size={15} className="text-brand-blue" />
                  <span>4. Workspace Layout & Accessibility Controls</span>
                </h4>

                <div className="divide-y divide-surface-border">
                  {/* Toggle 1: Expanded Navigation Sidebar */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-ink-primary">
                        Expanded Navigation Sidebar
                      </p>
                      <p className="text-[11px] text-ink-secondary mt-0.5">
                        Keep the left clinical module navigation drawer expanded with full labels on
                        desktop viewports.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sidebarOpen}
                      onClick={handleSidebarDefaultToggle}
                      className={`onco-switch ${sidebarOpen ? 'checked' : ''}`}
                    >
                      <div className="onco-switch-thumb" />
                    </button>
                  </div>

                  {/* Toggle 2: Reduced Motion */}
                  <div className="pt-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-ink-primary">
                        Reduced Interface Motion (Accessibility)
                      </p>
                      <p className="text-[11px] text-ink-secondary mt-0.5">
                        Minimize non-essential transitions and micro-animations across all screens.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reducedMotion}
                      onClick={handleReducedMotionToggle}
                      className={`onco-switch ${reducedMotion ? 'checked' : ''}`}
                    >
                      <div className="onco-switch-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 3: STORAGE (SUPER_ADMIN & ADMIN)
              ================================================================ */}
          {role !== 'STUDENT' && activeTab === 'storage' && (
            <div className="onco-section-pane">
              <div className="onco-section-header">
                <div>
                  <span className="onco-section-badge">
                    <RiDatabaseLine size={12} /> Media & Registry Telemetry
                  </span>
                  <h2 className="onco-section-title">System Storage Analytics</h2>
                  <p className="onco-section-desc">
                    Real-time capacity breakdown across clinical PDF reports, oncology scan images,
                    automated database backups, and profile avatars.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadStorageStats}
                    disabled={loadingStorage}
                    className="onco-btn-secondary"
                  >
                    <RiRefreshLine
                      size={15}
                      className={loadingStorage ? 'animate-spin text-brand-blue' : ''}
                    />
                    <span>{loadingStorage ? 'Refreshing…' : 'Refresh Telemetry'}</span>
                  </button>

                  {storageStats && (
                    <button
                      type="button"
                      onClick={() => handleExportStorageAudit(storageStats)}
                      className="onco-btn-primary"
                    >
                      <RiDownload2Line size={15} />
                      <span>Export Audit JSON</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingStorage && !storageStats ? (
                <div className="onco-settings-card py-16 flex flex-col items-center justify-center gap-3 text-ink-secondary">
                  <span className="w-7 h-7 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                  <p className="text-xs font-semibold">
                    Analyzing clinical file repositories & database volume…
                  </p>
                </div>
              ) : (
                (() => {
                  const stats = storageStats || {
                    reports_bytes: 0,
                    images_bytes: 0,
                    backups_bytes: 0,
                    avatars_bytes: 0,
                    total_used_bytes: 1,
                    capacity_bytes: 524288000,
                    utilized_percent: 0,
                    cloudinary_active: false,
                  }

                  const total = Math.max(stats.total_used_bytes || 1, 1)
                  const freeBytes = Math.max((stats.capacity_bytes || 524288000) - total, 0)

                  const categories = [
                    {
                      id: 'reports',
                      label: 'Clinical Reports (PDF / DOC)',
                      desc: 'Oxidative stress PDFs, pathology & lab documents',
                      bytes: stats.reports_bytes || 0,
                      pct: ((stats.reports_bytes || 0) / total) * 100,
                      color: '#2563EB',
                      icon: RiFilePdf2Line,
                    },
                    {
                      id: 'images',
                      label: 'Cancer Scan Images',
                      desc: 'Histopathology, radiology & diagnostic captures',
                      bytes: stats.images_bytes || 0,
                      pct: ((stats.images_bytes || 0) / total) * 100,
                      color: '#10B981',
                      icon: RiImageLine,
                    },
                    {
                      id: 'backups',
                      label: 'System Backups & Audit Logs',
                      desc: 'Relational database snapshots & PHI access logs',
                      bytes: stats.backups_bytes || 0,
                      pct: ((stats.backups_bytes || 0) / total) * 100,
                      color: '#F59E0B',
                      icon: RiHardDrive2Line,
                    },
                    {
                      id: 'avatars',
                      label: 'User & Patient Avatars',
                      desc: 'Biometric profile photos for patients & personnel',
                      bytes: stats.avatars_bytes || 0,
                      pct: ((stats.avatars_bytes || 0) / total) * 100,
                      color: '#8B5CF6',
                      icon: RiUserSmileLine,
                    },
                  ]

                  // SVG Donut Geometry
                  const radius = 74
                  const circumference = 2 * Math.PI * radius
                  let cumulativePct = 0

                  const activeCat =
                    categories.find((c) => c.id === highlightedStorageCat) || null

                  return (
                    <>
                      {/* Storage Summary KPI Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="onco-field-tile">
                          <div>
                            <div className="onco-field-label">Total Volume Utilized</div>
                            <div className="onco-field-val text-brand-blue">
                              {formatBytes(stats.total_used_bytes)}
                            </div>
                            <p className="text-[11px] text-ink-secondary mt-0.5">
                              {stats.utilized_percent}% of allocated pool
                            </p>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                            <RiDatabaseLine size={18} />
                          </div>
                        </div>

                        <div className="onco-field-tile">
                          <div>
                            <div className="onco-field-label">Available Free Capacity</div>
                            <div className="onco-field-val text-emerald-600 dark:text-emerald-400">
                              {formatBytes(freeBytes)}
                            </div>
                            <p className="text-[11px] text-ink-secondary mt-0.5">
                              Total Pool: {formatBytes(stats.capacity_bytes)}
                            </p>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <RiServerLine size={18} />
                          </div>
                        </div>

                        <div className="onco-field-tile">
                          <div>
                            <div className="onco-field-label">Active Storage Engine</div>
                            <div className="onco-field-val">
                              {stats.cloudinary_active ? 'Cloudinary Cloud' : 'Local Repository'}
                            </div>
                            <p className="text-[11px] text-ink-secondary mt-0.5">
                              {stats.cloudinary_active
                                ? 'Encrypted CDN delivery active'
                                : 'Local static file persistence'}
                            </p>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                            <RiCloudLine size={18} />
                          </div>
                        </div>
                      </div>

                      {/* Main Interactive Donut Chart + Category Cards */}
                      <div className="onco-settings-card onco-storage-layout">
                        {/* Left: Animated SVG Multi-Segment Donut Chart */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative w-52 h-52 flex items-center justify-center">
                            <svg
                              className="w-full h-full -rotate-90"
                              viewBox="0 0 200 200"
                              aria-label="Storage distribution chart"
                            >
                              <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke="var(--surface-border)"
                                strokeWidth="20"
                              />
                              {categories.map((cat) => {
                                const dashLen = (cat.pct / 100) * circumference
                                const dashOffset = -((cumulativePct / 100) * circumference)
                                cumulativePct += cat.pct
                                const isHighlighted = highlightedStorageCat === cat.id

                                return (
                                  <circle
                                    key={cat.id}
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    fill="transparent"
                                    stroke={cat.color}
                                    strokeWidth={isHighlighted ? '25' : '20'}
                                    strokeDasharray={`${dashLen} ${circumference}`}
                                    strokeDashoffset={dashOffset}
                                    className="transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => setHighlightedStorageCat(cat.id)}
                                    onMouseLeave={() => setHighlightedStorageCat(null)}
                                  />
                                )
                              })}
                            </svg>

                            {/* Donut Center Telemetry Readout */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-secondary">
                                {activeCat ? activeCat.id.toUpperCase() : 'TOTAL USED'}
                              </span>
                              <span className="text-base font-extrabold text-ink-primary mt-0.5">
                                {activeCat
                                  ? formatBytes(activeCat.bytes)
                                  : formatBytes(stats.total_used_bytes)}
                              </span>
                              <span className="text-[11px] font-bold text-brand-blue mt-0.5">
                                {activeCat
                                  ? `${activeCat.pct.toFixed(1)}% share`
                                  : `${stats.utilized_percent}% utilized`}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-ink-secondary text-center mt-2">
                            Hover any category to inspect its volume share
                          </p>
                        </div>

                        {/* Right: 4 Category Breakdown Cards */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                              Repository Distribution Breakdown
                            </h4>
                            <span className="text-[11px] font-mono text-ink-secondary">
                              4 Active Buckets
                            </span>
                          </div>

                          {categories.map((cat) => {
                            const CatIcon = cat.icon
                            const isHighlighted = highlightedStorageCat === cat.id
                            return (
                              <div
                                key={cat.id}
                                onMouseEnter={() => setHighlightedStorageCat(cat.id)}
                                onMouseLeave={() => setHighlightedStorageCat(null)}
                                className={`onco-storage-cat-card ${
                                  isHighlighted ? 'highlighted' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                                      style={{ backgroundColor: cat.color }}
                                    >
                                      <CatIcon size={16} />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-ink-primary truncate">
                                        {cat.label}
                                      </p>
                                      <p className="text-[10px] text-ink-secondary truncate">
                                        {cat.desc}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-mono font-extrabold text-ink-primary">
                                      {formatBytes(cat.bytes)}
                                    </p>
                                    <p
                                      className="text-[10px] font-mono font-bold"
                                      style={{ color: cat.color }}
                                    >
                                      {cat.pct.toFixed(1)}% of used
                                    </p>
                                  </div>
                                </div>

                                <div className="w-full h-1.5 bg-surface-base rounded-full overflow-hidden mt-2.5">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.max(cat.pct, 2)}%`,
                                      backgroundColor: cat.color,
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Overall Pool Utilization Gauge Bar */}
                      <div className="onco-settings-card space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                              Institutional Storage Pool Allocation
                            </h4>
                            <p className="text-[11px] text-ink-secondary">
                              {formatBytes(stats.total_used_bytes)} consumed out of{' '}
                              {formatBytes(stats.capacity_bytes)} provisioned capacity
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            Optimal Storage Health ({stats.utilized_percent}%)
                          </span>
                        </div>

                        <div className="w-full h-3 bg-surface-card rounded-full overflow-hidden border border-surface-border p-0.5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(Math.max(stats.utilized_percent, 1.5), 100)}%`,
                              background:
                                'linear-gradient(90deg, #1D3888 0%, var(--color-blue) 60%, #06B6D4 100%)',
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )
                })()
              )}
            </div>
          )}

          {/* ================================================================
              SECTION 4: SECURITY
              ================================================================ */}
          {activeTab === 'security' && (
            <div className="onco-section-pane">
              <div className="onco-section-header">
                <div>
                  <span className="onco-section-badge">
                    <RiShieldKeyholeLine size={12} /> Credential & Session Defense
                  </span>
                  <h2 className="onco-section-title">Security & Access Protection</h2>
                  <p className="onco-section-desc">
                    Update your encrypted login password, verify password complexity standards, and
                    monitor active clinical session controls.
                  </p>
                </div>
              </div>

              {/* Security Posture Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="onco-field-tile">
                  <div>
                    <div className="onco-field-label">Credential Hashing</div>
                    <div className="onco-field-val">Bcrypt Salted Hash</div>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Zero-plaintext storage enforcement
                    </p>
                  </div>
                  <RiLockPasswordLine size={20} className="text-brand-blue shrink-0" />
                </div>

                <div className="onco-field-tile">
                  <div>
                    <div className="onco-field-label">Session Transport</div>
                    <div className="onco-field-val">JWT Bearer Token</div>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      Signed token + bfcache history lock
                    </p>
                  </div>
                  <RiShieldCheckLine size={20} className="text-emerald-500 shrink-0" />
                </div>

                <div className="onco-field-tile">
                  <div>
                    <div className="onco-field-label">Workstation Environment</div>
                    <div className="onco-field-val text-xs">{sessionEnvironment}</div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      ● Current Authenticated Session
                    </p>
                  </div>
                  <RiComputerLine size={20} className="text-cyan-500 shrink-0" />
                </div>
              </div>

              {/* Password Update Form with Live Complexity Meter */}
              <div className="onco-settings-card space-y-5">
                <div className="border-b border-surface-border pb-3">
                  <h3 className="text-sm font-extrabold text-ink-primary flex items-center gap-2">
                    <RiLockPasswordLine size={17} className="text-brand-blue" />
                    <span>Rotate Account Password</span>
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Verify your current password to commit a new cryptographic credential.
                  </p>
                </div>

                <form onSubmit={handleSubmitPassword(handlePasswordSubmit)} className="space-y-4">
                  <FormField
                    label="Current Password"
                    error={passwordErrors.current_password?.message}
                    required
                  >
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        {...registerPassword('current_password')}
                        className="pr-10 h-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-ink-secondary hover:text-ink-primary cursor-pointer"
                        aria-label="Toggle current password visibility"
                      >
                        {showCurrentPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                      </button>
                    </div>
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="New Password"
                      error={passwordErrors.new_password?.message}
                      required
                    >
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          {...registerPassword('new_password')}
                          className="pr-10 h-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-ink-secondary hover:text-ink-primary cursor-pointer"
                          aria-label="Toggle new password visibility"
                        >
                          {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                        </button>
                      </div>
                    </FormField>

                    <FormField
                      label="Confirm New Password"
                      error={passwordErrors.confirm_password?.message}
                      required
                    >
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          {...registerPassword('confirm_password')}
                          className="pr-10 h-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-ink-secondary hover:text-ink-primary cursor-pointer"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? (
                            <RiEyeOffLine size={16} />
                          ) : (
                            <RiEyeLine size={16} />
                          )}
                        </button>
                      </div>
                    </FormField>
                  </div>

                  {/* Live Password Complexity Checklist & 5-Segment Bar */}
                  <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink-secondary uppercase tracking-wider text-[10px]">
                        Clinical Password Policy Compliance
                      </span>
                      <span className="font-extrabold text-[11px] text-brand-blue">
                        {passwordStrengthScore} / 5 Requirements Met
                      </span>
                    </div>

                    <div className="onco-strength-bar-track">
                      {[1, 2, 3, 4, 5].map((idx) => {
                        const active = passwordStrengthScore >= idx
                        const barColor =
                          passwordStrengthScore <= 2
                            ? '#EF4444'
                            : passwordStrengthScore <= 4
                            ? '#F59E0B'
                            : '#10B981'
                        return (
                          <div
                            key={idx}
                            className="onco-strength-segment"
                            style={{ backgroundColor: active ? barColor : undefined }}
                          />
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {passwordChecks.map((chk) => (
                        <span
                          key={chk.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            chk.met
                              ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-surface-base text-ink-secondary border-surface-border'
                          }`}
                        >
                          {chk.met ? (
                            <RiCheckboxCircleFill size={12} className="text-emerald-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400/50" />
                          )}
                          {chk.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1">
                    <button type="submit" disabled={loadingPassword} className="onco-btn-primary">
                      {loadingPassword ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Updating Password…</span>
                        </>
                      ) : (
                        <>
                          <RiShieldKeyholeLine size={15} />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Session Protection & Sign Out Control */}
              <div className="onco-settings-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary flex items-center gap-2">
                    <RiLogoutBoxRLine size={15} className="text-rose-500" />
                    <span>Session Termination & Token Revocation</span>
                  </h4>
                  <p className="text-xs text-ink-secondary">
                    Immediately clear local authentication tokens and sign out of this clinical
                    workstation.
                  </p>
                </div>

                {!confirmLogoutSession ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutSession(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-rose-500/12 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 transition-colors shrink-0 cursor-pointer"
                  >
                    <RiLogoutBoxRLine size={15} />
                    <span>Sign Out of Workstation</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-surface-card border border-rose-500/35 px-3 py-2 rounded-xl shrink-0">
                    <RiAlertLine size={15} className="text-rose-500" />
                    <span className="text-xs font-bold text-ink-primary">End session now?</span>
                    <button
                      type="button"
                      onClick={handleTerminateSession}
                      className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLogoutSession(false)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-ink-secondary hover:text-ink-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 5: ABOUT ONCO SPHERE
              ================================================================ */}
          {activeTab === 'about' && (
            <div className="onco-section-pane">
              <div className="onco-section-header">
                <div>
                  <span className="onco-section-badge">
                    <RiInformationLine size={12} /> Platform Identity & Architecture
                  </span>
                  <h2 className="onco-section-title">About Onco Sphere</h2>
                  <p className="onco-section-desc">
                    Institutional oncology intelligence platform specifications, technical stack
                    verification, and module directory.
                  </p>
                </div>
              </div>

              {/* Brand Identity Hero Card */}
              <div className="onco-identity-banner">
                <div className="onco-identity-banner-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img
                      src={ICSRLogo}
                      alt="Onco Sphere"
                      style={{
                        width: '62px',
                        height: '62px',
                        objectFit: 'contain',
                        background: 'transparent',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl font-extrabold !text-white tracking-tight">
                          Onco Sphere
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-400/20 text-cyan-200 border border-cyan-400/35">
                          v1.1.0 · Clinical Release
                        </span>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-sky-300 mt-0.5">
                        Clinical Intelligence for Better Oncology Outcomes
                      </p>
                      <p className="text-xs text-sky-100/85 mt-2 max-w-2xl leading-relaxed">
                        An AI-Powered Cancer Institute Management & Clinical Research Platform
                        unifying longitudinal patient registries, standardized oxidative stress
                        biomarker reporting, and role-audited research collaboration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Card Technical Architecture & System Health Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                  Platform Architecture & Integration Telemetry
                </h4>

                <div className="onco-dossier-grid">
                  {/* Spec 1: Framework */}
                  <div className="onco-field-tile">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                        <RiComputerLine size={18} />
                      </div>
                      <div>
                        <div className="onco-field-label">Onco Sphere Clinical UI</div>
                        <div className="onco-field-val text-sm">Version 1.1.0 (Production)</div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          React 19 · Vite 8 · Redux Toolkit · Tailwind CSS
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                      Active
                    </span>
                  </div>

                  {/* Spec 2: Database */}
                  <div className="onco-field-tile">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <RiDatabaseLine size={18} />
                      </div>
                      <div>
                        <div className="onco-field-label">Database Engine</div>
                        <div className="onco-field-val text-sm">SQLAlchemy ORM + MySQL 8.0</div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Relational clinical registry & longitudinal visit engine
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                      <RiServerLine size={11} /> Connected
                    </span>
                  </div>

                  {/* Spec 3: Cloud Media Pipeline */}
                  <div className="onco-field-tile">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <RiCloudLine size={18} />
                      </div>
                      <div>
                        <div className="onco-field-label">Media Storage Pipeline</div>
                        <div className="onco-field-val text-sm">
                          {cloudinaryStatus?.active || storageStats?.cloudinary_active
                            ? 'Cloudinary Encrypted Cloud'
                            : 'Local Static Sandbox Fallback'}
                        </div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          {loadingCloudinary
                            ? 'Checking media pipeline status…'
                            : cloudinaryStatus?.active || storageStats?.cloudinary_active
                            ? 'Encrypted cloud media uploads are active.'
                            : 'Local filesystem storage fallback active.'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${
                        cloudinaryStatus?.active || storageStats?.cloudinary_active
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                      }`}
                    >
                      {cloudinaryStatus?.active || storageStats?.cloudinary_active
                        ? 'Active Cloud'
                        : 'Local Mode'}
                    </span>
                  </div>

                  {/* Spec 4: Security Auditing */}
                  <div className="onco-field-tile">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <RiShieldCheckLine size={18} />
                      </div>
                      <div>
                        <div className="onco-field-label">Security Auditing Status</div>
                        <div className="onco-field-val text-sm">Role-Aware RBAC + JWT</div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Full role-aware access controls enforced across endpoints
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                      Audited
                    </span>
                  </div>

                  {/* Spec 5: Diagnostic PDF Engine */}
                  <div className="onco-field-tile">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <RiFilePdf2Line size={18} />
                      </div>
                      <div>
                        <div className="onco-field-label">Diagnostic Report Generator</div>
                        <div className="onco-field-val text-sm">ICSR 3-Page Oxidative PDF</div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Real-time vector PDF rendering for FOX2, MDA, GRIESS, DNPH & TAC
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-blue/15 text-brand-blue border border-brand-blue/25 shrink-0">
                      Calibrated
                    </span>
                  </div>

                  {/* Spec 6: Backend API */}
                  <div className="onco-field-tile">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <RiServerLine size={18} />
                      </div>
                      <div>
                        <div className="onco-field-label">Clinical API Core</div>
                        <div className="onco-field-val text-sm">FastAPI + Pydantic v2</div>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          RESTful clinical intelligence & report versioning service
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick-Launch Clinical Modules Directory */}
              <div className="onco-settings-card space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-primary">
                  Core Clinical Modules Directory
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    {
                      title: 'Onco Dashboard',
                      sub: 'Cohort telemetry & KPIs',
                      to: '/dashboard',
                      roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
                    },
                    {
                      title: 'Onco Register',
                      sub: 'Patient records & clinical dossier',
                      to: '/patients',
                      roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
                    },
                    {
                      title: 'Onco Receipt',
                      sub: 'Oxidative stress PDF reports',
                      to: '/reports',
                      roles: ['SUPER_ADMIN', 'ADMIN'],
                    },
                    {
                      title: 'Onco Access',
                      sub: 'Researcher & admin verification',
                      to: '/admin-management',
                      roles: ['SUPER_ADMIN', 'ADMIN'],
                    },
                  ]
                    .filter((item) => item.roles.includes(role))
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="p-3 rounded-xl bg-surface-card border border-surface-border hover:border-brand-blue transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-ink-primary group-hover:text-brand-blue transition-colors truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-ink-secondary truncate mt-0.5">
                            {item.sub}
                          </p>
                        </div>
                        <RiArrowRightUpLine
                          size={16}
                          className="text-ink-secondary group-hover:text-brand-blue shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </Link>
                    ))}
                </div>
              </div>

              {/* Institutional & Engineering Credits Footer */}
              <div className="onco-settings-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-secondary">
                <div>
                  <p className="font-extrabold text-ink-primary">
                    Institute for Cancer & Stem Cell Research (ICSR) · Onco Sphere Platform
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Engineered for precision clinical oncology workflows, biomarker reporting, and
                    protected health information integrity.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-ink-primary shrink-0">
                  © 2026 Onco Sphere
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
