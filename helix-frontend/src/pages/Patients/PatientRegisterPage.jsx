import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { createPatientThunk } from '../../redux/slices/patientSlice'
import FormField from '../../components/FormField'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { toast } from 'sonner'
import PhotoSelector from '../../components/PhotoSelector'
import StatusBadge from '../../components/StatusBadge'
import { cancerHierarchy, cancerCategories } from '../../config/cancerHierarchy'
import DatePicker from '../../components/DatePicker'
import { phoneRegex, emailRegex } from '../../lib/validation'
import {
  RiUserHeartLine,
  RiContactsBook2Line,
  RiMicroscopeLine,
  RiCheckLine,
  RiUser3Line,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiShieldUserLine,
  RiStethoscopeLine,
  RiCameraLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiHeartPulseLine,
  RiFlaskLine,
} from 'react-icons/ri'
import './PatientRegisterPage.css'

const schema = yup.object({
  full_name: yup.string().trim().min(2, 'Name must be at least 2 characters').required('Name is required'),
  date_of_birth: yup
    .mixed()
    .test('is-valid-dob', 'Date of Birth is required', function (val) {
      if (!val) return this.createError({ message: 'Date of Birth is required' })
      const d = val instanceof Date ? val : new Date(val)
      if (isNaN(d.getTime())) return this.createError({ message: 'Please select a valid date' })
      if (d.getFullYear() < 1900) return this.createError({ message: 'Year cannot be earlier than 1900' })
      if (d > new Date()) return this.createError({ message: 'Date of Birth cannot be in the future' })
      return true
    }),
  gender: yup.string().required('Gender is required'),
  blood_group: yup.string().nullable(),
  photo_url: yup.string().nullable(),
  phone: yup
    .string()
    .trim()
    .required('Phone number is required')
    .matches(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  email: yup
    .string()
    .trim()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .matches(emailRegex, 'Enter a valid email address'),
  address: yup.string().min(5, 'Enter detailed address').required('Address is required'),
  emergency_contact_name: yup.string().nullable(),
  emergency_contact_phone: yup
    .string()
    .trim()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .matches(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  emergency_contact_relationship: yup.string().nullable(),
  department: yup.string().nullable(),
  assigned_doctor: yup.string().nullable(),
  primary_diagnosis: yup.string().nullable(),
  cancer_category: yup.string().nullable(),
  cancer_type: yup.string().nullable(),
  cancer_stage: yup.string().nullable(),
  treatment_status: yup.string().nullable(),
  admission_date: yup.mixed().nullable(),
})

const WIZARD_STEPS = [
  {
    step: 1,
    label: 'Identity',
    subtitle: 'Demographics & Biometrics',
    icon: RiUserHeartLine,
  },
  {
    step: 2,
    label: 'Contact',
    subtitle: 'Communication & Next of Kin',
    icon: RiContactsBook2Line,
  },
  {
    step: 3,
    label: 'Clinical',
    subtitle: 'Oncology Staging & Protocol',
    icon: RiMicroscopeLine,
  },
]

export default function PatientRegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      gender: '',
      blood_group: '',
      treatment_status: 'Newly Diagnosed',
      photo_url: '',
      cancer_category: '',
      cancer_type: '',
    },
  })

  const formValues = watch()

  const STEP_FIELDS = {
    1: ['full_name', 'date_of_birth', 'gender', 'blood_group', 'photo_url'],
    2: ['phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'],
    3: ['department', 'assigned_doctor', 'cancer_category', 'cancer_type', 'cancer_stage', 'treatment_status'],
  }

  const [isValidatingStep, setIsValidatingStep] = useState(false)

  // ── Step navigation ──────────────────────────────────────────────────────────
  const nextStep = async () => {
    if (isValidatingStep) return
    const fieldsToValidate = STEP_FIELDS[activeStep]
    if (fieldsToValidate) {
      setIsValidatingStep(true)
      try {
        const isValid = await trigger(fieldsToValidate)
        if (!isValid) return
      } finally {
        setIsValidatingStep(false)
      }
    }
    setActiveStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1))

  // ── Final submit — called ONLY when user clicks "Register Record" on step 3 ──
  const handleFinalSubmit = handleSubmit(
    async (data) => {
      if (isSubmitting) return // guard against double-click
      setIsSubmitting(true)

      const formatDate = (val) => {
        if (!val) return null
        if (val instanceof Date) {
          const y = val.getFullYear()
          const m = String(val.getMonth() + 1).padStart(2, '0')
          const d = String(val.getDate()).padStart(2, '0')
          return `${y}-${m}-${d}`
        }
        const parsed = new Date(val)
        if (isNaN(parsed.getTime())) return val
        const y = parsed.getFullYear()
        const m = String(parsed.getMonth() + 1).padStart(2, '0')
        const d = String(parsed.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      const formattedData = {
        ...data,
        date_of_birth: formatDate(data.date_of_birth),
        admission_date: formatDate(data.admission_date),
      }

      try {
        const newPatient = await dispatch(createPatientThunk(formattedData)).unwrap()
        toast.success('Patient registered successfully.')
        if (newPatient && newPatient.id) {
          navigate(`/patients/${newPatient.id}`)
        } else {
          navigate('/patients')
        }
      } catch (err) {
        toast.error(err || 'Failed to register patient.')
      } finally {
        setIsSubmitting(false)
      }
    },
    // onError: jump to first step that has a validation error
    (formErrors) => {
      for (let step = 1; step <= 3; step++) {
        const stepFields = STEP_FIELDS[step]
        if (stepFields && stepFields.some((f) => formErrors[f])) {
          setActiveStep(step)
          break
        }
      }
    }
  )

  const progressPercentage = Math.round((activeStep / 3) * 100)

  return (
    <div className="onco-wiz-root space-y-5 max-w-4xl mx-auto pb-6">
      {/* ── Clinical Intake Header Banner ─────────────────────────────────── */}
      <div className="onco-wiz-banner">
        {/* Decorative DNA / Molecular SVG Watermark */}
        <svg
          width="175"
          height="84"
          viewBox="0 0 175 84"
          fill="none"
          aria-hidden="true"
          className="absolute right-5 top-1/2 -translate-y-1/2 opacity-[0.09] dark:opacity-[0.14] hidden md:block pointer-events-none text-brand-navy dark:text-sky-400"
        >
          <path
            d="M8 18 C 42 18, 42 66, 76 66 C 110 66, 110 18, 144 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M8 66 C 42 66, 42 18, 76 18 C 110 18, 110 66, 144 66"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="76" cy="42" r="3.5" fill="currentColor" />
          <circle cx="144" cy="18" r="3" fill="currentColor" />
          <circle cx="144" cy="66" r="3" fill="currentColor" />
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
                className="font-semibold text-brand-blue dark:text-sky-400 hover:underline"
              >
                Dashboard
              </Link>
              <span className="opacity-40">/</span>
              <Link
                to="/patients"
                className="font-semibold text-brand-blue dark:text-sky-400 hover:underline"
              >
                Patient Register
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-ink-secondary font-medium">Register</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                Register Patient
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] bg-brand-blue/10 dark:bg-sky-500/15 text-brand-navy dark:text-sky-300 border border-brand-blue/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Clinical Intake Protocol
              </span>
            </div>

            <p className="text-xs sm:text-sm text-ink-secondary max-w-xl">
              Enroll a new oncology patient record across biometric identity, emergency contacts, and primary clinical staging.
            </p>
          </div>

          {/* Step Completion Pill */}
          <div className="flex items-center gap-3 self-start sm:self-center shrink-0 bg-surface-card/90 border border-surface-border px-3.5 py-2 rounded-xl shadow-2xs">
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                Protocol Stage
              </span>
              <span className="text-xs font-mono font-bold text-brand-navy dark:text-sky-300">
                Step {activeStep} of 3 · {progressPercentage}%
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-brand-blue/10 dark:bg-sky-500/15 border border-brand-blue/20 flex items-center justify-center text-brand-blue dark:text-sky-400">
              <RiHeartPulseLine size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-Stage Diagnostic Wizard Stepper ─────────────────────────────── */}
      <div className="onco-wiz-stepper">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {WIZARD_STEPS.map((item) => {
            const isComplete = item.step < activeStep
            const isActive = item.step === activeStep
            const stateClass = isActive
              ? 'is-active'
              : isComplete
              ? 'is-complete'
              : 'is-upcoming'

            return (
              <button
                type="button"
                key={item.step}
                onClick={async () => {
                  if (item.step < activeStep) {
                    setActiveStep(item.step)
                  } else if (item.step > activeStep) {
                    const fieldsToValidate = STEP_FIELDS[activeStep]
                    if (fieldsToValidate) {
                      const isValid = await trigger(fieldsToValidate)
                      if (isValid) setActiveStep(item.step)
                    }
                  }
                }}
                className={`onco-step-btn ${stateClass}`}
              >
                <span className="onco-step-orb">
                  {isComplete ? <RiCheckLine size={16} /> : item.step}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        isActive
                          ? 'text-brand-blue dark:text-sky-300'
                          : isComplete
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-ink-secondary'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-ink-secondary truncate">
                    {item.subtitle}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Continuous Animated Progress Track */}
        <div className="mt-3 w-full h-1.5 bg-surface-hover dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-navy via-brand-blue to-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${((activeStep - 1) / 2) * 50 + (activeStep === 3 ? 50 : 25)}%` }}
          />
        </div>
      </div>

      {/*
        ─────────────────────────────────────────────────────────────────────────
        IMPORTANT: The <form> element has NO onSubmit handler.
        Form submission is 100% controlled via the "Register Record" button's
        onClick which calls handleFinalSubmit() programmatically.
        ─────────────────────────────────────────────────────────────────────────
      */}
      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="onco-wiz-card p-6 sm:p-8 space-y-6"
        onKeyDown={(e) => {
          // Block Enter key on ALL steps to prevent any residual submission path
          if (e.key === 'Enter') {
            e.preventDefault()
            if (activeStep < 3) nextStep()
          }
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            STEP 1: DEMOGRAPHICS & IDENTITY
        ══════════════════════════════════════════════════════════════════ */}
        {activeStep === 1 && (
          <div className="onco-step-panel space-y-6">
            {/* Step Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-border/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-blue-500/10 border border-indigo-500/20 flex items-center justify-center text-brand-navy dark:text-sky-300 shrink-0">
                  <RiUserHeartLine size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-brand-navy dark:text-sky-300 uppercase tracking-wider">
                    Demographics &amp; Identity
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Core patient identification, birth chronology, blood group, and profile photo
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-ink-secondary bg-surface-base border border-surface-border px-2.5 py-1 rounded-lg self-start sm:self-center">
                Fields marked <span className="text-status-critical font-bold">*</span> required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Full Name" error={errors.full_name?.message} required>
                <div className="onco-input-wrap">
                  <RiUser3Line size={16} className="onco-input-icon" />
                  <Input
                    placeholder="John Doe"
                    className="onco-field-input pl-9"
                    {...register('full_name')}
                  />
                </div>
              </FormField>

              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Date of Birth"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.date_of_birth?.message}
                    maxDate={new Date()}
                    className="onco-field-input"
                  />
                )}
              />

              <FormField label="Gender" error={errors.gender?.message} required>
                <Select
                  value={formValues.gender}
                  onValueChange={(val) => setValue('gender', val)}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Blood Group" error={errors.blood_group?.message}>
                <Select
                  value={formValues.blood_group}
                  onValueChange={(val) => setValue('blood_group', val)}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <Controller
                name="admission_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Admission Date"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.admission_date?.message}
                    maxDate={new Date()}
                    className="onco-field-input"
                  />
                )}
              />

              {/* Photo Upload with Camera + Crop */}
              <div className="space-y-1.5">
                <Label className="text-ink-primary text-sm font-semibold block">
                  Profile Photo
                </Label>
                <PhotoSelector
                  value={formValues.photo_url}
                  onChange={(url) => setValue('photo_url', url)}
                  customTrigger={({ openModal }) => (
                    <div className="onco-photo-tile">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-surface-card border border-surface-border overflow-hidden flex items-center justify-center text-[11px] text-ink-disabled font-semibold shrink-0 shadow-2xs">
                          {formValues.photo_url ? (
                            <img
                              src={formValues.photo_url}
                              alt="Patient preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <RiCameraLine size={20} className="text-brand-blue dark:text-sky-400 opacity-75" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink-primary truncate">
                            {formValues.photo_url ? 'Biometric Photo Attached' : 'No Photo Attached'}
                          </p>
                          <p className="text-[11px] text-ink-secondary truncate">
                            Capture via webcam or upload JPG/PNG
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openModal}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-card hover:bg-surface-hover text-brand-blue dark:text-sky-300 border border-brand-blue/25 transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        {formValues.photo_url ? 'Change Photo' : 'Attach Photo'}
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2: CONTACT & EMERGENCY NEXT-OF-KIN
        ══════════════════════════════════════════════════════════════════ */}
        {activeStep === 2 && (
          <div className="onco-step-panel space-y-6">
            {/* Primary Contact Section Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-surface-border/70">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/15 to-cyan-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-300 shrink-0">
                <RiContactsBook2Line size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-brand-navy dark:text-sky-300 uppercase tracking-wider">
                  Contact Details
                </h3>
                <p className="text-xs text-ink-secondary">
                  Direct patient mobile number, digital correspondence, and residential address
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Phone Number" error={errors.phone?.message} required>
                <div className="onco-input-wrap">
                  <RiPhoneLine size={16} className="onco-input-icon" />
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    className="onco-field-input pl-9 font-mono"
                    {...register('phone', {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      },
                    })}
                  />
                </div>
              </FormField>

              <FormField label="Email Address" error={errors.email?.message}>
                <div className="onco-input-wrap">
                  <RiMailLine size={16} className="onco-input-icon" />
                  <Input
                    type="email"
                    placeholder="patient@gmail.com"
                    className="onco-field-input pl-9"
                    {...register('email')}
                  />
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Residential Address" error={errors.address?.message} required>
                  <div className="relative">
                    <RiMapPinLine
                      size={16}
                      className="absolute left-3.5 top-3 text-ink-secondary pointer-events-none"
                    />
                    <Textarea
                      placeholder="123 Hospital St"
                      rows={2}
                      className="pl-9 rounded-xl bg-surface-base/55 dark:bg-slate-900/55 border-surface-border focus-visible:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/15 text-sm"
                      {...register('address')}
                    />
                  </div>
                </FormField>
              </div>
            </div>

            {/* Emergency Contact Divider & Sub-panel */}
            <div className="pt-2">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-surface-border/70">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <RiShieldUserLine size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-brand-navy dark:text-sky-300 uppercase tracking-wider">
                    Emergency Contact
                  </h3>
                  <p className="text-[11px] text-ink-secondary">
                    Designated next-of-kin or primary caregiver for urgent clinical communication
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Contact Name" error={errors.emergency_contact_name?.message}>
                  <Input
                    placeholder="Samant Mishra"
                    className="onco-field-input"
                    {...register('emergency_contact_name')}
                  />
                </FormField>

                <FormField label="Contact Phone" error={errors.emergency_contact_phone?.message}>
                  <Input
                    placeholder="9876543210"
                    maxLength={10}
                    className="onco-field-input font-mono"
                    {...register('emergency_contact_phone')}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      register('emergency_contact_phone').onChange(e)
                    }}
                  />
                </FormField>

                <FormField label="Relationship" error={errors.emergency_contact_relationship?.message}>
                  <Input
                    placeholder="Spouse"
                    className="onco-field-input"
                    {...register('emergency_contact_relationship')}
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3: ONCOLOGY DIAGNOSIS & CLINICAL PROTOCOL
        ══════════════════════════════════════════════════════════════════ */}
        {activeStep === 3 && (
          <div className="onco-step-panel space-y-6">
            {/* Clinical Diagnostic Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <RiMicroscopeLine size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-brand-navy dark:text-sky-300 uppercase tracking-wider">
                    Diagnosis &amp; Clinical Info
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Oncology department assignment, tumor classification hierarchy, and staging status
                  </p>
                </div>
              </div>

              {formValues.treatment_status && (
                <div className="self-start sm:self-center">
                  <StatusBadge status={formValues.treatment_status} />
                </div>
              )}
            </div>

            {/* Live Oncology Diagnostic Telemetry Bar */}
            <div className="onco-diag-strip flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <RiFlaskLine size={16} className="text-brand-blue dark:text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-ink-primary">
                  Diagnostic Telemetry Preview:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-ink-primary font-semibold">
                  Dept: {formValues.department || 'Unassigned'}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-ink-primary font-semibold">
                  Site: {formValues.cancer_category || 'Pending'}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold">
                  Stage: {formValues.cancer_stage || 'Pending'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Clinical Department" error={errors.department?.message}>
                <Select
                  value={formValues.department}
                  onValueChange={(val) => setValue('department', val)}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    {['Oncology', 'Hematology', 'Radiology', 'Pathology', 'Clinical Trials'].map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Assigned Doctor" error={errors.assigned_doctor?.message}>
                <div className="onco-input-wrap">
                  <RiStethoscopeLine size={16} className="onco-input-icon" />
                  <Input
                    placeholder="Dr. James Okafor (Optional)"
                    className="onco-field-input pl-9"
                    {...register('assigned_doctor')}
                  />
                </div>
              </FormField>

              <FormField label="Cancer Category" error={errors.cancer_category?.message}>
                <Select
                  value={formValues.cancer_category || ''}
                  onValueChange={(val) => {
                    setValue('cancer_category', val)
                    setValue('cancer_type', '') // Reset cancer type on category change
                  }}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    sideOffset={4}
                    className="bg-surface-card max-h-[250px] overflow-y-auto"
                  >
                    {cancerCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Cancer Type" error={errors.cancer_type?.message}>
                <Select
                  value={formValues.cancer_type || ''}
                  onValueChange={(val) => setValue('cancer_type', val)}
                  disabled={!formValues.cancer_category}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue
                      placeholder={
                        formValues.cancer_category ? 'Select Cancer Type' : 'Choose Category First'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    sideOffset={4}
                    className="bg-surface-card max-h-[250px] overflow-y-auto"
                  >
                    {formValues.cancer_category &&
                      cancerHierarchy[formValues.cancer_category]?.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Cancer Stage" error={errors.cancer_stage?.message}>
                <Select
                  value={formValues.cancer_stage}
                  onValueChange={(val) => setValue('cancer_stage', val)}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue placeholder="Select Stage" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    sideOffset={4}
                    className="bg-surface-card"
                  >
                    {['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'].map((stg) => (
                      <SelectItem key={stg} value={stg}>
                        {stg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Treatment Status" error={errors.treatment_status?.message}>
                <Select
                  value={formValues.treatment_status}
                  onValueChange={(val) => setValue('treatment_status', val)}
                >
                  <SelectTrigger className="onco-field-input bg-surface-card">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    {[
                      'Newly Diagnosed',
                      'Under Treatment',
                      'In Remission',
                      'Palliative',
                      'Discharged',
                    ].map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        )}

        {/* ── Form Wizard Navigation Footer ──────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-surface-border/80 pt-5">
          <button
            type="button"
            className="onco-wiz-btn-back"
            onClick={prevStep}
            disabled={activeStep === 1}
          >
            <RiArrowLeftLine size={15} />
            <span>Back</span>
          </button>

          {activeStep < 3 ? (
            <button
              type="button"
              disabled={isValidatingStep}
              className="onco-wiz-btn-primary"
              onClick={nextStep}
            >
              {isValidatingStep ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating…</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <RiArrowRightLine size={16} />
                </>
              )}
            </button>
          ) : (
            /* Final submit button — calls handleFinalSubmit() programmatically.
               type="button" ensures the HTML form element is NEVER involved. */
            <button
              type="button"
              disabled={isSubmitting}
              className="onco-wiz-btn-primary"
              onClick={handleFinalSubmit}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering…</span>
                </>
              ) : (
                <>
                  <RiShieldCheckLine size={16} />
                  <span>Register Record</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
