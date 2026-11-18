/**
 * ResearcherApplicationPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen 5-step researcher registration wizard.
 *
 * Steps:
 *   1 — Personal Identity
 *   2 — Academic & Professional Background
 *   3 — Research Intent & Institute Connection
 *   4 — Documents & Declarations
 *   5 — Review & Confirm (read-only summary → Final Submit)
 *
 * Features:
 *   • Per-step Yup validation (prevents advancing with errors)
 *   • Auto-save draft every 60 seconds
 *   • Manual "Save Draft" button
 *   • OTP-verified draft resume on return visit
 *   • Frontend file validation (PDF/JPG/PNG, 5 MB max)
 *   • Password show/hide toggles
 *   • Animated progress bar + step pills
 *   • Animated success screen on submission
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { phoneRegex, emailRegex, passwordRegex} from '../../lib/validation'
import { calculateAge as calcAgeUtil } from '../../lib/utils'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import {
  RiUserLine, RiBookOpenLine, RiMicroscopeLine,
  RiFileLine, RiCheckDoubleLine, RiEyeLine, RiEyeOffLine,
  RiLockLine, RiUploadCloud2Line, RiCheckLine, RiArrowLeftLine,
  RiArrowRightLine, RiSaveLine, RiTimeLine, RiEditLine,
  RiMailLine, RiShieldCheckLine, RiErrorWarningLine,
} from 'react-icons/ri'
import ICSRLogo from '../../assets/ICSR-LOGO.png'
import { registerThunk, selectAuthStatus, selectAuthError, clearError } from '../../redux/slices/authSlice'
import researcherService from '../../services/researcherService'
import DOBPicker from '../../components/ui/dob-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const DRAFT_EMAIL_KEY  = 'helix_draft_email'
const DRAFT_ID_KEY     = 'helix_draft_id'
const MAX_FILE_BYTES   = 5 * 1024 * 1024
const ALLOWED_TYPES    = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXT_LABEL = 'PDF, JPG, PNG'
const AUTO_SAVE_MS     = 60_000

const calculateAge = (dobString) => calcAgeUtil(dobString, { asNumber: true })

const step1Schema = yup.object({
  full_name:         yup.string().min(2, 'At least 2 characters').required('Full name is required'),
  date_of_birth:     yup.string().required('Date of birth is required').test(
    'is-18-or-older',
    'You are not eligible. Minimum age requirement is 18 years.',
    function (val) {
      if (!val) return false
      const age = calculateAge(val)
      return age !== null && age >= 18
    }
  ),
  gender:            yup.string().required('Gender is required'),
  phone: yup
    .string()
    .trim()
    .required('Phone is required')
    .matches(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .matches(emailRegex, 'Enter a valid email address'),
  password: yup
    .string()
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirm_password:  yup.string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
})

const step2Schema = yup.object({
  institution:      yup.string().min(3).required('Institution is required'),
  qualification:    yup.string().required('Qualification is required'),
  specialization:   yup.string().optional(),
  researcher_role:  yup.string().required('Role / Designation is required'),
  experience_years: yup.string().required('Years of experience is required'),
})

const step3Schema = yup.object({
  research_area:       yup.string().required('Primary research area is required'),
  registration_reason: yup.string().min(50, 'Please provide at least 50 characters').required('Research objective is required'),
  research_duration:   yup.string().required('Expected duration is required'),
})

const step4Schema = yup.object({
  id_proof_url:         yup.string().url('Upload Government ID first').required('Government ID proof is required'),
  institutional_id_url: yup.string().url('Upload Institutional ID first').required('Institutional ID is required'),
  agree_accuracy:       yup.boolean().oneOf([true], 'You must certify the information is accurate'),
  agree_terms:          yup.boolean().oneOf([true], 'You must agree to the terms of data use'),
})

const STEP_SCHEMAS = [null, step1Schema, step2Schema, step3Schema, step4Schema]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers & Options
// ─────────────────────────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  'Medical Oncology',
  'Surgical Oncology',
  'Radiation Oncology',
  'Pediatric Oncology',
  'Gynecologic Oncology',
  'Hematologic Oncology',
  'Neuro-Oncology',
  'Thoracic Oncology',
  'Gastrointestinal Oncology',
  'Genitourinary Oncology',
  'Dermato-Oncology',
  'Molecular Oncology / Cancer Biology',
  'Immuno-Oncology',
  'Cancer Genomics & Bioinformatics',
  'Clinical Trials & Therapeutics',
  'Cancer Epidemiology & Prevention',
  'Translational Cancer Research',
  'Palliative & Supportive Care',
  'Onco-Pathology',
  'Onco-Radiology & Imaging',
  'General Medicine / Surgery',
  'Other',
]

const CANCER_TYPES = [
  'Breast Cancer',
  'Lung Cancer',
  'Colorectal Cancer',
  'Prostate Cancer',
  'Cervical Cancer',
  'Ovarian Cancer',
  'Head & Neck Cancer',
  'Oral / Mouth Cancer',
  'Esophageal Cancer',
  'Gastric / Stomach Cancer',
  'Liver Cancer',
  'Pancreatic Cancer',
  'Renal / Kidney Cancer',
  'Bladder Cancer',
  'Thyroid Cancer',
  'Brain & CNS Tumors',
  'Leukemia',
  'Lymphoma',
  'Multiple Myeloma',
  'Melanoma & Skin Cancer',
  'Bone & Soft Tissue Sarcoma',
  'Pediatric Cancers',
  'Multiple / All Cancer Types',
  'Others',
]

const QUALIFICATIONS = [
  "Bachelor's (B.Sc / MBBS)",
  "Master's (M.Sc / MD)",
  'PhD / DM',
  'Post-Doctoral',
  'Clinical Fellowship',
  'Other',
]

const ROLES = ['Intern', 'Researcher', 'Doctor', 'Other']

const EXPERIENCE_RANGES = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  'More than 10 years',
]

const RESEARCH_AREAS = [
  'Oncology',
  'Hematology',
  'Radiation Oncology',
  'Surgical Oncology',
  'Medical Oncology',
  'Palliative Care',
  'Radiology',
  'Pathology',
  'Clinical Trials',
  'Epidemiology',
  'Molecular Biology',
  'Genomics',
  'Other',
]

const DURATIONS = [
  '1 month',
  '3 months',
  '6 months',
  '1 year',
  'More than 1 year',
  'Ongoing / Permanent',
]

const STEPS = [
  { id: 1, label: 'Identity',   icon: RiUserLine },
  { id: 2, label: 'Academic',   icon: RiBookOpenLine },
  { id: 3, label: 'Research',   icon: RiMicroscopeLine },
  { id: 4, label: 'Documents',  icon: RiFileLine },
  { id: 5, label: 'Review',     icon: RiCheckDoubleLine },
]

const fieldCls = [
  'w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 px-3 text-sm',
  'outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20',
].join(' ')

// Selects get explicit dark bg so native options inherit dark colors too
const selectCls = [
  'w-full h-11 rounded-lg border border-white/10 text-white px-3 text-sm cursor-pointer',
  'outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20',
  'bg-slate-800 [&>option]:bg-slate-800 [&>option]:text-white',
].join(' ')

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><RiErrorWarningLine size={11}/>{msg}</p>
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4 sm:mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <Icon className="text-blue-400" size={16} />
        </div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function FormRow({ label, required, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <FieldError msg={error} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Component
// ─────────────────────────────────────────────────────────────────────────────
function DocumentUpload({ label, required, hint, value, onChange, onError }) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName]   = useState('')
  const [progress, setProgress]   = useState(0)
  const inputRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Frontend validation — instant feedback before any network call
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError(`Only ${ALLOWED_EXT_LABEL} files are allowed.`)
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      onError(`File must be under 5 MB (yours: ${(file.size / 1048576).toFixed(1)} MB).`)
      e.target.value = ''
      return
    }

    // Immediately show the selected filename for instant feedback
    setFileName(file.name)
    setUploading(true)
    setProgress(30)
    onError('')

    try {
      setProgress(60)
      const res = await researcherService.uploadDocument(file)
      setProgress(100)
      onChange(res.data.url)
    } catch (err) {
      setFileName('')
      setProgress(0)
      onError(err?.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          'flex items-center gap-3 h-14 px-4 rounded-xl border border-dashed cursor-pointer transition-all relative overflow-hidden',
          value
            ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400'
            : uploading
            ? 'border-blue-400/40 bg-blue-500/5 text-blue-300'
            : 'border-white/20 bg-slate-800/50 text-slate-400 hover:border-blue-400/40 hover:bg-blue-500/5',
        ].join(' ')}
      >
        {/* Progress bar underlay */}
        {uploading && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-blue-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        )}

        {uploading ? (
          <>
            <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-blue-300 font-medium">Uploading {fileName}…</span>
              <span className="text-[10px] text-blue-400/60">Please wait</span>
            </div>
          </>
        ) : value ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <RiCheckLine size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">{fileName || 'File uploaded'}</span>
              <span className="text-[10px] text-emerald-500/70">Verified & Uploaded</span>
            </div>
            <span className="ml-auto text-[10px] bg-emerald-500/20 px-2 py-1 rounded-md text-emerald-400 shrink-0">✓ OK</span>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <RiUploadCloud2Line size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">{hint || `Upload ${label}`}</span>
              <span className="text-[10px] text-slate-500">{ALLOWED_EXT_LABEL} · Max 5 MB</span>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ResearcherApplicationPage() {
  const dispatch = useDispatch()
  const authStatus = useSelector(selectAuthStatus)
  const authError  = useSelector(selectAuthError)

  const [step, setStep]               = useState(1)
  const [completedSteps, setCompleted]= useState(new Set())
  const [submitted, setSubmitted]     = useState(false)
  const [draftId, setDraftId]         = useState(null)
  const [lastSaved, setLastSaved]     = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  // Password toggles
  const [showPw,    setShowPw]    = useState(false)
  const [showCoPw,  setShowCoPw]  = useState(false)

  // Doc upload errors
  const [docErrors, setDocErrors] = useState({})
  const setDocError = (field, msg) => setDocErrors(prev => ({ ...prev, [field]: msg }))

  // Doc URL state (managed outside RHF so uploads work independently)
  const [docUrls, setDocUrls] = useState({
    id_proof_url: '', institutional_id_url: '',
    letter_of_intent_url: '', publications_url: '',
  })

  // OTP / resume modal state
  const [resumeModal,   setResumeModal]   = useState(false)
  const [otpModal,      setOtpModal]      = useState(false)
  const [otpEmail,      setOtpEmail]      = useState('')
  const [otpValue,      setOtpValue]      = useState('')
  const [otpLoading,    setOtpLoading]    = useState(false)
  const [otpError,      setOtpError]      = useState('')
  const [otpSent,       setOtpSent]       = useState(false)

  // ── React Hook Form (NO resolver — manual yup validation per step) ────────
  // IMPORTANT: yupResolver is NOT used here because the resolver is set once
  // at mount time (step=1) and never updates when step changes. This caused
  // step4Schema to never be validated. We use manual yup.validate() instead.
  const {
    register, watch, setValue, getValues,
  } = useForm({ mode: 'onChange' })

  // Per-step validation errors (replaces RHF formState.errors)
  const [stepErrors, setStepErrors] = useState({})

  const watchedReason = watch('registration_reason') || ''
  const watchedPrior  = watch('prior_institute_work')
  const watchedDob    = watch('date_of_birth')

  const userAge = calculateAge(watchedDob)
  const isUnderage = userAge !== null && userAge < 18

  useEffect(() => { dispatch(clearError()) }, [dispatch])

  // ── Check for existing draft on mount ─────────────────────────────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem(DRAFT_EMAIL_KEY)
    const savedId    = localStorage.getItem(DRAFT_ID_KEY)
    if (savedEmail && savedId) {
      setOtpEmail(savedEmail)
      setResumeModal(true)
    }
  }, [])

  // ── Collect all form data for draft / submit ───────────────────────────────
  const collectPayload = useCallback(() => {
    const vals = getValues()
    return { ...vals, ...docUrls }
  }, [getValues, docUrls])

  // ── Manual / auto save ────────────────────────────────────────────────────
  const autoSave = useCallback(async () => {
    if (!draftId) return
    const email = getValues('email')
    if (!email) return
    try {
      await researcherService.updateDraft(draftId, step, collectPayload())
      setLastSaved(new Date())
    } catch {}
  }, [draftId, step, collectPayload, getValues])

  // ── Auto-save every 60 seconds ────────────────────────────────────────────
  useEffect(() => {
    if (!draftId) return
    const interval = setInterval(() => { autoSave() }, AUTO_SAVE_MS)
    return () => clearInterval(interval)
  }, [draftId, autoSave])

  const handleManualSave = async () => {
    const email = getValues('email')
    if (!email) { alert('Please enter your email first.'); return }
    setSaveLoading(true)
    try {
      if (draftId) {
        await researcherService.updateDraft(draftId, step, collectPayload())
        setLastSaved(new Date())
      } else {
        const res = await researcherService.saveDraft(email, step, collectPayload())
        setDraftId(res.data.id)
        localStorage.setItem(DRAFT_EMAIL_KEY, email)
        localStorage.setItem(DRAFT_ID_KEY, String(res.data.id))
        setLastSaved(new Date())
      }
    } catch {} finally { setSaveLoading(false) }
  }

  // ── OTP flow ───────────────────────────────────────────────────────────────
  const handleRequestOTP = async () => {
    if (!otpEmail) return
    setOtpLoading(true)
    setOtpError('')
    try {
      await researcherService.requestOTP(otpEmail)
      setOtpSent(true)
    } catch (e) {
      setOtpError(e?.response?.data?.detail || 'Failed to send OTP.')
    } finally { setOtpLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (!otpValue) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await researcherService.verifyOTP(otpEmail, otpValue)
      const draft = res.data
      // Restore form values
      const fd = draft.form_data || {}
      Object.entries(fd).forEach(([k, v]) => {
        if (!['id_proof_url','institutional_id_url','letter_of_intent_url','publications_url'].includes(k)) {
          setValue(k, v)
        }
      })
      // Restore doc URLs
      setDocUrls({
        id_proof_url:         fd.id_proof_url         || '',
        institutional_id_url: fd.institutional_id_url || '',
        letter_of_intent_url: fd.letter_of_intent_url || '',
        publications_url:     fd.publications_url      || '',
      })
      setDraftId(draft.id)
      localStorage.setItem(DRAFT_ID_KEY, String(draft.id))
      setStep(Math.min(draft.current_step, 4))
      setOtpModal(false)
      setResumeModal(false)
    } catch (e) {
      setOtpError(e?.response?.data?.detail || 'Invalid or expired OTP.')
    } finally { setOtpLoading(false) }
  }

  // ── Manual per-step validation (fixes dynamic-resolver bug) ──────────────
  const validateStep = async (stepNum) => {
    const schema = STEP_SCHEMAS[stepNum]
    if (!schema) return true
    try {
      await schema.validate(getValues(), { abortEarly: false, stripUnknown: true })
      setStepErrors({})
      return true
    } catch (yupErr) {
      const errs = {}
      ;(yupErr.inner || []).forEach(e => { if (e.path) errs[e.path] = e.message })
      // If abortEarly fired (no .inner), capture the single error
      if (yupErr.path && !yupErr.inner?.length) errs[yupErr.path] = yupErr.message
      setStepErrors(errs)
      return false
    }
  }

  // ── Step navigation ────────────────────────────────────────────────────────
  const goNext = async () => {
    if (isAdvancing) return
    setIsAdvancing(true)
    try {
      if (step === 1) {
        const dobVal = getValues('date_of_birth')
        const age = calculateAge(dobVal)
        if (age !== null && age < 18) {
          setStepErrors({ date_of_birth: 'You are not eligible. Minimum age requirement is 18 years.' })
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }
      if (step < 4) {
        const valid = await validateStep(step)
        if (!valid) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        setCompleted(prev => new Set([...prev, step]))
        // Save draft on step advance
        const email = getValues('email')
        if (email) {
          try {
            if (draftId) {
              await researcherService.updateDraft(draftId, step + 1, collectPayload())
              setLastSaved(new Date())
            } else {
              const res = await researcherService.saveDraft(email, step + 1, collectPayload())
              setDraftId(res.data.id)
              localStorage.setItem(DRAFT_EMAIL_KEY, email)
              localStorage.setItem(DRAFT_ID_KEY, String(res.data.id))
              setLastSaved(new Date())
            }
          } catch {}
        }
        setStep(s => s + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (step === 4) {
        // Step 4 → Review: validate declarations + check doc uploads
        const vals = getValues()
        const errs = {}
        if (!vals.agree_accuracy) errs.agree_accuracy = 'You must certify the information is accurate'
        if (!vals.agree_terms)    errs.agree_terms    = 'You must agree to the terms of data use'

        const missing = []
        if (!docUrls.id_proof_url)         missing.push('Government ID Proof')
        if (!docUrls.institutional_id_url) missing.push('Institutional ID Card')

        if (Object.keys(errs).length > 0) setStepErrors(errs)
        if (missing.length > 0) setDocError('id_proof_url', `Required: ${missing.join(' and ')}`)

        if (Object.keys(errs).length > 0 || missing.length > 0) return

        setStepErrors({})
        setCompleted(prev => new Set([...prev, 4]))
        setStep(5)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } finally {
      setIsAdvancing(false)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const jumpToStep = (s) => {
    if (s > 1) {
      const dobVal = getValues('date_of_birth')
      const age = calculateAge(dobVal)
      if (age !== null && age < 18) return
    }
    if (s < step || completedSteps.has(s - 1) || s === 1) setStep(s)
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    const vals = getValues()
    const payload = {
      full_name:            vals.full_name,
      email:                vals.email,
      password:             vals.password,
      role:                 'STUDENT',
      registration_reason:  vals.registration_reason || '',
      phone:                vals.phone,
      date_of_birth:        vals.date_of_birth,
      gender:               vals.gender,
      photo_url:            vals.photo_url || null,
      institution:          vals.institution,
      qualification:        vals.qualification,
      specialization:       vals.specialization,
      researcher_role:      vals.researcher_role,
      experience_years:     vals.experience_years,
      linkedin_url:         vals.linkedin_url || null,
      research_area:        vals.research_area,
      cancer_interest:      vals.cancer_interest || null,
      research_duration:    vals.research_duration,
      supervisor_name:      vals.supervisor_name || null,
      prior_work_details:   vals.prior_work_details || null,
      ...docUrls,
    }

    const result = await dispatch(registerThunk(payload))
    if (registerThunk.fulfilled.match(result)) {
      // Clear draft from localStorage
      localStorage.removeItem(DRAFT_EMAIL_KEY)
      localStorage.removeItem(DRAFT_ID_KEY)
      setSubmitted(true)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <RiCheckDoubleLine className="text-emerald-400" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Application Submitted!</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Your researcher access application has been received. The Super Admin will review it shortly and you'll receive an email notification once a decision is made.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-left text-sm text-slate-300 space-y-3 mb-6">
            <p className="font-semibold text-white">What happens next?</p>
            <div className="space-y-2">
              {[
                'Your application is queued for Super Admin review.',
                'You\'ll receive an email confirmation of your submission.',
                'Once approved, you\'ll get a sign-in link via email.',
                'Do NOT attempt to log in until you receive approval.',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-400 text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/login" className="inline-block w-full">
            <button className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium transition-all shadow-lg shadow-blue-600/20">
              Return to Sign In
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const vals = getValues()

  // ─────────────────────────────────────────────────────────────────────────
  // Resume modal
  // ─────────────────────────────────────────────────────────────────────────
  const ResumeModal = resumeModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <RiTimeLine className="text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-white font-semibold">Continue your application?</p>
            <p className="text-slate-400 text-xs">We found a saved draft for {otpEmail}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setResumeModal(false); setOtpModal(true) }}
            className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
          >
            Continue Draft
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(DRAFT_EMAIL_KEY)
              localStorage.removeItem(DRAFT_ID_KEY)
              setResumeModal(false)
            }}
            className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-all"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // OTP modal
  // ─────────────────────────────────────────────────────────────────────────
  const OTPModal = otpModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <RiShieldCheckLine className="text-blue-400" size={20} />
          </div>
          <div>
            <p className="text-white font-semibold">Verify Your Email</p>
            <p className="text-slate-400 text-xs">To resume your application securely</p>
          </div>
        </div>

        {!otpSent ? (
          <>
            <p className="text-slate-300 text-sm mb-4">
              We'll send a 6-digit code to <span className="text-white font-medium">{otpEmail}</span> to verify it's you.
            </p>
            {otpError && <p className="text-red-400 text-xs mb-3 flex items-center gap-1"><RiErrorWarningLine size={12}/>{otpError}</p>}
            <button
              disabled={otpLoading}
              onClick={handleRequestOTP}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {otpLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiMailLine size={14} />}
              Send Verification Code
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-300 text-sm mb-1">Enter the 6-digit code sent to your email.</p>
            <p className="text-slate-500 text-xs mb-4">Check backend stdout for the OTP in development mode.</p>
            <input
              type="text"
              maxLength={6}
              value={otpValue}
              onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full h-12 rounded-lg bg-white/5 border border-white/10 text-white text-center text-xl tracking-widest outline-none focus:border-blue-400/60 mb-3"
            />
            {otpError && <p className="text-red-400 text-xs mb-3 flex items-center gap-1"><RiErrorWarningLine size={12}/>{otpError}</p>}
            <button
              disabled={otpLoading || otpValue.length < 6}
              onClick={handleVerifyOTP}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {otpLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Verify & Resume
            </button>
            <button
              onClick={() => { setOtpSent(false); setOtpValue(''); setOtpError('') }}
              className="w-full mt-2 text-slate-400 hover:text-white text-xs transition-all"
            >
              Resend code
            </button>
          </>
        )}

        <button
          onClick={() => { setOtpModal(false); setOtpSent(false); setOtpValue(''); setOtpError('') }}
          className="w-full mt-3 text-slate-500 hover:text-slate-300 text-xs transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — Personal Identity
  // ─────────────────────────────────────────────────────────────────────────
  const Step1 = (
    <div className="space-y-4">
      {/* High-priority Underage Eligibility Red Alert Banner */}
      {isUnderage && (
        <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/40 text-red-300 flex items-center gap-3 animate-fade-in shadow-xl shadow-red-500/10 backdrop-blur-md">
          <RiErrorWarningLine size={28} className="shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-red-400">You are not eligible.</p>
            <p className="text-xs text-red-300 font-medium mt-0.5">
              You must be at least 18 years old to register as an intern or researcher on Onco Sphere.
            </p>
          </div>
        </div>
      )}

      <SectionCard title="Personal Identity" icon={RiUserLine}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormRow label="Full Name" required error={stepErrors.full_name}>
            <input {...register('full_name')} placeholder="Dr. Arjun Sharma" className={fieldCls} />
          </FormRow>
          <FormRow label="Date of Birth" required error={stepErrors.date_of_birth}>
            <DOBPicker
              value={watch('date_of_birth') || ''}
              onChange={(val) => setValue('date_of_birth', val, { shouldValidate: true })}
              error={stepErrors.date_of_birth}
              placeholder="Select Date of Birth"
            />
          </FormRow>
          <FormRow label="Gender" required error={stepErrors.gender}>
            <select {...register('gender')} className={selectCls} style={{ colorScheme: 'dark' }}>
              <option value="">Select gender</option>
              <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
            </select>
          </FormRow>
          <FormRow label="Phone Number" required error={stepErrors.phone}>
            <input
              {...register('phone', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                },
              })}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              className={fieldCls}
            />
          </FormRow>
        </div>
        <FormRow label="Email Address" required error={stepErrors.email}>
          <input {...register('email')} type="email" placeholder="arjun@aiims.edu" className={fieldCls} />
        </FormRow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormRow label="Password" required error={stepErrors.password}>
            <div className="relative">
              <RiLockLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                {...register('password')}
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className={fieldCls + ' pl-9 pr-9'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                {showPw ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </button>
            </div>
          </FormRow>
          <FormRow label="Confirm Password" required error={stepErrors.confirm_password}>
            <div className="relative">
              <RiLockLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                {...register('confirm_password')}
                type={showCoPw ? 'text' : 'password'}
                placeholder="Repeat password"
                className={fieldCls + ' pl-9 pr-9'}
              />
              <button type="button" onClick={() => setShowCoPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                {showCoPw ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </button>
            </div>
          </FormRow>
        </div>
      </SectionCard>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 — Academic
  // ─────────────────────────────────────────────────────────────────────────
  const Step2 = (
    <SectionCard title="Academic & Professional Background" icon={RiBookOpenLine}>
      <FormRow label="Current Institution / University" required error={stepErrors.institution}>
        <input {...register('institution')} placeholder="AIIMS New Delhi / Tata Memorial Hospital" className={fieldCls} />
      </FormRow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormRow label="Highest Qualification" required error={stepErrors.qualification}>
          <Select
            value={watch('qualification') || ''}
            onValueChange={(val) => setValue('qualification', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {QUALIFICATIONS.map(q => (
                <SelectItem key={q} value={q} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Field of Specialization" error={stepErrors.specialization}>
          <Select
            value={watch('specialization') || ''}
            onValueChange={(val) => setValue('specialization', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select specialization (Optional)" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {SPECIALIZATIONS.map(s => (
                <SelectItem key={s} value={s} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Role / Designation" required error={stepErrors.researcher_role}>
          <Select
            value={watch('researcher_role') || ''}
            onValueChange={(val) => setValue('researcher_role', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {ROLES.map(r => (
                <SelectItem key={r} value={r} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Years of Experience" required error={stepErrors.experience_years}>
          <Select
            value={watch('experience_years') || ''}
            onValueChange={(val) => setValue('experience_years', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {EXPERIENCE_RANGES.map(y => (
                <SelectItem key={y} value={y} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      </div>
      <FormRow label="LinkedIn / ResearchGate Profile URL" error={stepErrors.linkedin_url}>
        <input {...register('linkedin_url')} type="url" placeholder="https://linkedin.com/in/yourprofile" className={fieldCls} />
      </FormRow>
    </SectionCard>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3 — Research Intent
  // ─────────────────────────────────────────────────────────────────────────
  const Step3 = (
    <SectionCard title="Research Intent & Institute Connection" icon={RiMicroscopeLine}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormRow label="Primary Research Area" required error={stepErrors.research_area}>
          <Select
            value={watch('research_area') || ''}
            onValueChange={(val) => setValue('research_area', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {RESEARCH_AREAS.map(a => (
                <SelectItem key={a} value={a} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Cancer Type of Interest" error={stepErrors.cancer_interest}>
          <Select
            value={watch('cancer_interest') || ''}
            onValueChange={(val) => setValue('cancer_interest', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select cancer type (Optional)" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {CANCER_TYPES.map(c => (
                <SelectItem key={c} value={c} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Expected Research Duration" required error={stepErrors.research_duration}>
          <Select
            value={watch('research_duration') || ''}
            onValueChange={(val) => setValue('research_duration', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full h-11 rounded-lg bg-slate-800/80 border border-white/10 text-white px-3 text-sm focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 data-[placeholder]:text-slate-500">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" sideOffset={4} className="bg-slate-800 border border-white/10 text-white max-h-60 overflow-y-auto shadow-2xl z-50">
              {DURATIONS.map(d => (
                <SelectItem key={d} value={d} className="focus:bg-blue-600 focus:text-white text-slate-200 cursor-pointer py-2 text-sm">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Supervisor / Referral Name">
          <input {...register('supervisor_name')} placeholder="Dr. (optional)" className={fieldCls} />
        </FormRow>
      </div>

      <FormRow label="Research Objective — Why do you want to join Onco Sphere?" required error={stepErrors.registration_reason}>
        <div className="relative">
          <textarea
            {...register('registration_reason')}
            rows={5}
            maxLength={2000}
            placeholder="Describe your research goals, specific areas of interest, and how this institute will support your work (minimum 50 characters)..."
            className="w-full rounded-lg bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 p-3 text-sm leading-relaxed outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-mono">
            {watchedReason.length} / 2000
          </span>
        </div>
      </FormRow>

      <div className="space-y-2">
        <label className="text-slate-300 text-sm font-medium">Prior work with cancer institutes?</label>
        <div className="flex gap-4">
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" {...register('prior_institute_work')} value={opt} className="accent-blue-500" />
              <span className="text-slate-300 text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {watchedPrior === 'Yes' && (
          <textarea
            {...register('prior_work_details')}
            rows={2}
            placeholder="Briefly describe your prior experience..."
            className="w-full rounded-lg bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 p-3 text-sm outline-none focus:border-blue-400/60 resize-none mt-2"
          />
        )}
      </div>
    </SectionCard>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4 — Documents & Declarations
  // ─────────────────────────────────────────────────────────────────────────
  const Step4 = (
    <SectionCard title="Documents & Declarations" icon={RiFileLine}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <DocumentUpload
            label="Government ID Proof" required
            hint="Aadhar Card, Passport, or Voter ID"
            fieldName="id_proof_url"
            value={docUrls.id_proof_url}
            onChange={url => setDocUrls(p => ({ ...p, id_proof_url: url }))}
            onError={msg => setDocError('id_proof_url', msg)}
          />
          {docErrors.id_proof_url && <FieldError msg={docErrors.id_proof_url} />}
        </div>
        <div className="space-y-1">
          <DocumentUpload
            label="Institutional ID Card" required
            hint="Your institute / university ID"
            fieldName="institutional_id_url"
            value={docUrls.institutional_id_url}
            onChange={url => setDocUrls(p => ({ ...p, institutional_id_url: url }))}
            onError={msg => setDocError('institutional_id_url', msg)}
          />
          {docErrors.institutional_id_url && <FieldError msg={docErrors.institutional_id_url} />}
        </div>
        <DocumentUpload
          label="Letter of Intent / Cover Letter"
          hint="Optional — PDF preferred"
          fieldName="letter_of_intent_url"
          value={docUrls.letter_of_intent_url}
          onChange={url => setDocUrls(p => ({ ...p, letter_of_intent_url: url }))}
          onError={msg => setDocError('letter_of_intent_url', msg)}
        />
        <DocumentUpload
          label="Research Publications (optional)"
          hint="Upload a PDF of your latest publication"
          fieldName="publications_url"
          value={docUrls.publications_url}
          onChange={url => setDocUrls(p => ({ ...p, publications_url: url }))}
          onError={msg => setDocError('publications_url', msg)}
        />
      </div>

      <div className="pt-4 border-t border-white/10 space-y-3">
        <p className="text-white text-sm font-semibold mb-2">Declarations</p>
        {[
          { field: 'agree_accuracy', label: 'I certify that all information provided in this application is accurate, complete, and truthful to the best of my knowledge.' },
          { field: 'agree_terms',    label: 'I agree to comply with Onco Sphere\'s terms of data use, research ethics guidelines, and confidentiality policies.' },
        ].map(({ field, label }) => (
          <label key={field} className="flex items-start gap-3 cursor-pointer group">
            <input {...register(field)} type="checkbox" className="mt-0.5 w-4 h-4 accent-blue-500 shrink-0" />
            <span className="text-slate-300 text-sm group-hover:text-white transition-colors leading-relaxed">{label}</span>
          </label>
        ))}
        {stepErrors.agree_accuracy && <FieldError msg={stepErrors.agree_accuracy} />}
        {stepErrors.agree_terms    && <FieldError msg={stepErrors.agree_terms} />}
      </div>
    </SectionCard>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 5 — Review & Confirm
  // ─────────────────────────────────────────────────────────────────────────
  const ReviewRow = ({ label, value }) => value ? (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-slate-400 text-xs sm:w-40 shrink-0">{label}</span>
      <span className="text-white text-xs flex-1 break-words">{value}</span>
    </div>
  ) : null

  const Step5 = (
    <div className="space-y-4">
      {/* Section 1 Review */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><RiUserLine className="text-blue-400" size={14}/></div>
            <span className="text-white font-semibold text-sm">Personal Identity</span>
          </div>
          <button onClick={() => jumpToStep(1)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <RiEditLine size={12}/>Edit
          </button>
        </div>
        <ReviewRow label="Full Name"    value={vals.full_name} />
        <ReviewRow label="Date of Birth" value={vals.date_of_birth} />
        <ReviewRow label="Gender"       value={vals.gender} />
        <ReviewRow label="Phone"        value={vals.phone} />
        <ReviewRow label="Email"        value={vals.email} />
      </div>

      {/* Section 2 Review */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><RiBookOpenLine className="text-blue-400" size={14}/></div>
            <span className="text-white font-semibold text-sm">Academic Background</span>
          </div>
          <button onClick={() => jumpToStep(2)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <RiEditLine size={12}/>Edit
          </button>
        </div>
        <ReviewRow label="Institution"    value={vals.institution} />
        <ReviewRow label="Qualification"  value={vals.qualification} />
        <ReviewRow label="Specialization" value={vals.specialization} />
        <ReviewRow label="Role"           value={vals.researcher_role} />
        <ReviewRow label="Experience"     value={vals.experience_years} />
        <ReviewRow label="LinkedIn URL"   value={vals.linkedin_url} />
      </div>

      {/* Section 3 Review */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><RiMicroscopeLine className="text-blue-400" size={14}/></div>
            <span className="text-white font-semibold text-sm">Research Intent</span>
          </div>
          <button onClick={() => jumpToStep(3)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <RiEditLine size={12}/>Edit
          </button>
        </div>
        <ReviewRow label="Research Area"    value={vals.research_area} />
        <ReviewRow label="Cancer Interest"  value={vals.cancer_interest} />
        <ReviewRow label="Duration"         value={vals.research_duration} />
        <ReviewRow label="Supervisor"       value={vals.supervisor_name} />
        <ReviewRow label="Research Objective" value={vals.registration_reason} />
        <ReviewRow label="Prior Institute Work" value={vals.prior_institute_work} />
      </div>

      {/* Section 4 Review — Documents */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><RiFileLine className="text-blue-400" size={14}/></div>
            <span className="text-white font-semibold text-sm">Documents</span>
          </div>
          <button onClick={() => jumpToStep(4)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <RiEditLine size={12}/>Edit
          </button>
        </div>
        {[
          ['Government ID', docUrls.id_proof_url],
          ['Institutional ID', docUrls.institutional_id_url],
          ['Letter of Intent', docUrls.letter_of_intent_url],
          ['Publications', docUrls.publications_url],
        ].map(([label, url]) => url ? (
          <div key={label} className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 py-2 border-b border-white/5 last:border-0 items-center">
            <span className="text-slate-400 text-xs sm:w-40 shrink-0">{label}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs underline transition-colors">View Document</a>
            <span className="ml-auto text-emerald-400 text-[10px] flex items-center gap-1"><RiCheckLine size={10}/>Uploaded</span>
          </div>
        ) : null)}
      </div>

      {/* Declaration reminder */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
        <RiCheckDoubleLine className="text-emerald-400 shrink-0 mt-0.5" size={18}/>
        <p className="text-emerald-300 text-sm">
          You have agreed to our data use terms and certified accuracy of all information provided.
        </p>
      </div>

      {/* Submit */}
      {authError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20">
          <RiErrorWarningLine className="shrink-0 mt-0.5" size={16}/>{authError}
        </div>
      )}
      <button
        onClick={handleFinalSubmit}
        disabled={authStatus === 'loading'}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {authStatus === 'loading'
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting Application…</>
          : <><RiCheckDoubleLine size={16} /> Submit Final Application</>
        }
      </button>
    </div>
  )

  const STEP_CONTENT = [null, Step1, Step2, Step3, Step4, Step5]

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 relative">
      {ResumeModal}
      {OTPModal}

      {/* Ambient glows */}
      <div className="fixed -top-40 -left-20 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={ICSRLogo} alt="Onco Sphere Logo" className="h-9 w-auto object-contain bg-transparent" />
            <span className="hidden sm:block text-slate-600 text-xs ml-2">Researcher Application</span>
          </div>

          {/* Save draft button + last saved */}
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500">
                <RiTimeLine size={10} />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {step < 5 && (
              <button
                onClick={handleManualSave}
                disabled={saveLoading}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-all disabled:opacity-50"
              >
                {saveLoading
                  ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  : <RiSaveLine size={12} />
                }
                Save Draft
              </button>
            )}
            <Link to="/" className="text-slate-500 hover:text-white text-xs transition-colors">← Back</Link>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        />
      </div>

      {/* Step pills */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center justify-between sm:justify-center sm:gap-4">
          {STEPS.map((s) => {
            const done    = completedSteps.has(s.id) || step > s.id
            const active  = step === s.id
            const Icon    = s.icon
            return (
              <button
                key={s.id}
                onClick={() => jumpToStep(s.id)}
                className={[
                  'flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl transition-all text-xs font-medium',
                  active  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : done  ? 'text-emerald-400 hover:bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-400',
                ].join(' ')}
              >
                <div className={[
                  'w-6 h-6 rounded-full flex items-center justify-center border text-[10px]',
                  active  ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                  : done  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/20 text-slate-500',
                ].join(' ')}>
                  {done ? <RiCheckLine size={10} /> : <Icon size={10} />}
                </div>
                <span className="hidden sm:block">{s.label}</span>
                <span className="sm:hidden text-[9px]">{s.id}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Page title */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {step === 5 ? 'Review Your Application' : `Step ${step} — ${STEPS[step - 1]?.label}`}
        </h1>
        {step < 5 && (
          <p className="text-slate-400 text-sm mt-0.5">
            {step === 1 && 'Enter your personal and contact details.'}
            {step === 2 && 'Tell us about your academic and professional background.'}
            {step === 3 && 'Describe your research goals and how this institute fits your work.'}
            {step === 4 && 'Upload required identity documents and agree to our terms.'}
          </p>
        )}
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <form onSubmit={e => e.preventDefault()} noValidate>
          {STEP_CONTENT[step]}
        </form>

        {/* Navigation buttons (steps 1–4) */}
        {step < 5 && (
          <div className="flex gap-3 mt-4">
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
              >
                <RiArrowLeftLine size={14} /> Back
              </button>
            )}
            <button
              onClick={goNext}
              disabled={isAdvancing}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isAdvancing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving &amp; Continuing…</span>
                </>
              ) : (
                <>
                  {step === 4 ? 'Review Application' : 'Continue'}
                  {step < 4 && <RiArrowRightLine size={14} />}
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 5 back */}
        {step === 5 && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 mt-3 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <RiArrowLeftLine size={14} /> Back to Documents
          </button>
        )}

        <p className="text-center text-slate-500 text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
