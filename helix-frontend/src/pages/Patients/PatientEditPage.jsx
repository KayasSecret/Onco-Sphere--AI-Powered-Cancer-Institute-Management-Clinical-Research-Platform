import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  fetchPatientDetailThunk,
  updatePatientThunk,
  selectSelectedPatient,
  selectPatientStatus,
} from '../../redux/slices/patientSlice'
import PageHeader from '../../components/PageHeader'
import FormField from '../../components/FormField'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { toast } from 'sonner'
import PhotoSelector from '../../components/PhotoSelector'
import { cancerHierarchy, cancerCategories } from '../../config/cancerHierarchy'
import DatePicker from '../../components/DatePicker'
import { phoneRegex, emailRegex } from '../../lib/validation'

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

export default function PatientEditPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const patient = useSelector(selectSelectedPatient)
  const status = useSelector(selectPatientStatus)
  const [activeStep, setActiveStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  useEffect(() => {
    dispatch(fetchPatientDetailThunk(id))
  }, [dispatch, id])

  useEffect(() => {
    if (patient) {
      reset({
        ...patient,
        date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
        admission_date: patient.admission_date ? patient.admission_date.split('T')[0] : '',
      })
    }
  }, [patient, reset])

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

  // ── Final submit — called ONLY when user clicks "Save Record Changes" on step 3 ──
  const handleFinalSubmit = handleSubmit(
    async (data) => {
      if (isSubmitting) return          // guard against double-click
      setIsSubmitting(true)

      const formatDate = (val) => {
        if (!val || val === '') return null
        if (val instanceof Date) {
          const y = val.getFullYear()
          const m = String(val.getMonth() + 1).padStart(2, '0')
          const d = String(val.getDate()).padStart(2, '0')
          return `${y}-${m}-${d}`
        }
        return val
      }

      // Exclude read-only metadata fields from update payload
      const { id: _id, patient_code: _code, created_at: _ca, updated_at: _ua, ...cleanData } = data

      const formattedData = {
        ...cleanData,
        date_of_birth: formatDate(cleanData.date_of_birth),
        admission_date: formatDate(cleanData.admission_date),
        discharge_date: formatDate(cleanData.discharge_date),
        email: cleanData.email && cleanData.email.trim() !== '' ? cleanData.email.trim() : null,
        phone: cleanData.phone ? cleanData.phone.trim() : '',
        blood_group: cleanData.blood_group || '',
        photo_url: cleanData.photo_url || '',
        // Emergency contact: send empty string instead of null (DB column is NOT NULL)
        emergency_contact_name: cleanData.emergency_contact_name || '',
        emergency_contact_phone: cleanData.emergency_contact_phone || '',
        emergency_contact_relationship: cleanData.emergency_contact_relationship || '',
        medical_notes: cleanData.medical_notes || '',
        remarks: cleanData.remarks || '',
      }

      try {
        await dispatch(updatePatientThunk({ id, data: formattedData })).unwrap()
        toast.success('Patient record updated successfully.')
        navigate(`/patients/${id}`)
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to update patient record.')
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

  if (status === 'loading' && !patient) {
    return <div className="text-center py-12 text-ink-secondary">Loading patient profile...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Edit Chart: ${patient?.patient_code || ''}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Patient Register', to: '/patients' },
          { label: patient?.full_name || 'Profile', to: `/patients/${id}` },
          { label: 'Edit' },
        ]}
      />

      <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-6 text-xs font-semibold">
        {[
          { step: 1, label: 'Identity' },
          { step: 2, label: 'Contact' },
          { step: 3, label: 'Clinical' },
        ].map((item) => (
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
            className={[
              'flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer',
              activeStep === item.step
                ? 'border-brand-blue text-brand-blue font-bold'
                : 'border-transparent text-ink-secondary hover:text-ink-primary',
            ].join(' ')}
          >
            <span
              className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                activeStep === item.step ? 'bg-brand-blue text-ink-inverse font-bold' : 'bg-surface-hover text-ink-secondary',
              ].join(' ')}
            >
              {item.step}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/*
        ─────────────────────────────────────────────────────────────────────────
        IMPORTANT: The <form> element has NO onSubmit handler.
        Form submission is 100% controlled via the "Save Record Changes" button's
        onClick which calls handleFinalSubmit() programmatically.
        This eliminates ALL accidental submissions from:
          • Enter key in text inputs
          • SelectTrigger button clicks
          • Any other DOM event that would normally bubble to form submit
        ─────────────────────────────────────────────────────────────────────────
      */}
      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="space-y-6 bg-surface-card p-4 sm:p-6 rounded-xl border border-surface-border"
        onKeyDown={(e) => {
          // Block Enter key on ALL steps to prevent any residual submission path
          if (e.key === 'Enter') {
            e.preventDefault()
            if (activeStep < 3) nextStep()
          }
        }}
      >
        {/* Step 1: Identity */}
        {activeStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Demographics &amp; Identity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.full_name?.message} required>
                <Input {...register('full_name')} />
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
                  />
                )}
              />

              <FormField label="Gender" error={errors.gender?.message} required>
                <Select
                  value={formValues.gender || ''}
                  onValueChange={(val) => setValue('gender', val)}
                >
                  <SelectTrigger className="bg-surface-card">
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
                  value={formValues.blood_group || ''}
                  onValueChange={(val) => setValue('blood_group', val)}
                >
                  <SelectTrigger className="bg-surface-card">
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Photo Upload with Camera + Crop */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-ink-primary">Profile Photo</Label>
              <PhotoSelector
                value={formValues.photo_url}
                onChange={(url) => setValue('photo_url', url)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Contact */}
        {activeStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Contact details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Phone Number" error={errors.phone?.message} required>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  {...register('phone', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    },
                  })}
                />
              </FormField>

              <FormField label="Email Address" error={errors.email?.message}>
                <Input type="email" {...register('email')} />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Residential Address" error={errors.address?.message} required>
                  <Textarea rows={2} {...register('address')} />
                </FormField>
              </div>
            </div>

            <div className="h-px bg-surface-border my-4" />
            <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Emergency Contact</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Contact Name" error={errors.emergency_contact_name?.message}>
                <Input {...register('emergency_contact_name')} />
              </FormField>

              <FormField label="Contact Phone" error={errors.emergency_contact_phone?.message}>
                <Input
                  placeholder="9876543210"
                  maxLength={10}
                  {...register('emergency_contact_phone')}
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    register('emergency_contact_phone').onChange(e)
                  }}
                />
              </FormField>

              <FormField label="Relationship" error={errors.emergency_contact_relationship?.message}>
                <Input {...register('emergency_contact_relationship')} />
              </FormField>
            </div>
          </div>
        )}

        {/* Step 3: Clinical — stays mounted until user clicks "Save Record Changes" */}
        {activeStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Diagnosis &amp; Clinical Info</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Clinical Department" error={errors.department?.message}>
                <Select
                  value={formValues.department || ''}
                  onValueChange={(val) => setValue('department', val)}
                >
                  <SelectTrigger className="bg-surface-card">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    {['Oncology', 'Hematology', 'Radiology', 'Pathology', 'Clinical Trials'].map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Assigned Doctor" error={errors.assigned_doctor?.message}>
                <Input placeholder="Dr. James Okafor (Optional)" {...register('assigned_doctor')} />
              </FormField>

              <FormField label="Cancer Category" error={errors.cancer_category?.message}>
                <Select
                  value={formValues.cancer_category || ''}
                  onValueChange={(val) => {
                    setValue('cancer_category', val)
                    setValue('cancer_type', '') // Reset cancer type on category change
                  }}
                >
                  <SelectTrigger className="bg-surface-card">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-surface-card max-h-[250px] overflow-y-auto">
                    {cancerCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  <SelectTrigger className="bg-surface-card">
                    <SelectValue placeholder={formValues.cancer_category ? "Select Cancer Type" : "Choose Category First"} />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-surface-card max-h-[250px] overflow-y-auto">
                    {formValues.cancer_category && cancerHierarchy[formValues.cancer_category]?.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Cancer Stage" error={errors.cancer_stage?.message}>
                <Select
                  value={formValues.cancer_stage || ''}
                  onValueChange={(val) => setValue('cancer_stage', val)}
                >
                  <SelectTrigger className="bg-surface-card">
                    <SelectValue placeholder="Select Stage" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-surface-card">
                    {['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'].map((stg) => (
                      <SelectItem key={stg} value={stg}>{stg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Treatment Status" error={errors.treatment_status?.message}>
                <Select
                  value={formValues.treatment_status || ''}
                  onValueChange={(val) => setValue('treatment_status', val)}
                >
                  <SelectTrigger className="bg-surface-card">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card">
                    {['Newly Diagnosed', 'Under Treatment', 'In Remission', 'Palliative', 'Discharged'].map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        )}

        {/* Form Wizard Navigation Footer */}
        <div className="flex items-center justify-between border-t border-surface-border pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-surface-border text-ink-primary hover:bg-surface-hover"
            onClick={prevStep}
            disabled={activeStep === 1}
          >
            Back
          </Button>

          {activeStep < 3 ? (
            <Button
              type="button"
              disabled={isValidatingStep}
              className="bg-brand-blue hover:bg-brand-blue-dark text-ink-inverse flex items-center justify-center gap-2"
              onClick={nextStep}
            >
              {isValidatingStep ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating…</span>
                </>
              ) : (
                'Continue'
              )}
            </Button>
          ) : (
            /* Final submit button — calls handleFinalSubmit() programmatically.
               type="button" ensures the HTML form element is NEVER involved. */
            <Button
              type="button"
              disabled={isSubmitting}
              className="bg-brand-blue hover:bg-brand-blue-dark text-ink-inverse flex items-center justify-center gap-2"
              onClick={handleFinalSubmit}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes…</span>
                </>
              ) : (
                'Save Record Changes'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
