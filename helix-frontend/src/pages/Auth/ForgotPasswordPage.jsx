import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  RiMailLine,
  RiArrowLeftLine,
  RiErrorWarningLine,
  RiCheckLine,
  RiShieldKeyholeLine,
  RiRefreshLine,
} from 'react-icons/ri'
import { emailRegex } from '../../lib/validation'

const emailSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .matches(emailRegex, 'Enter a valid email address'),
})

const otpSchema = yup.object({
  otp: yup
    .string()
    .matches(/^\d{6}$/, 'Enter a valid 6-digit code')
    .required('Verification code is required'),
})

const fieldClasses =
  'pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 ' +
  'focus-visible:border-blue-400/60 focus-visible:ring-2 focus-visible:ring-blue-500/20'

const fieldErrorClasses = 'border-red-500/60 focus-visible:ring-red-500/20'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email Input, 2: OTP Input
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Form hooks
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm({ resolver: yupResolver(emailSchema) })

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    setValue: setOtpValue,
    formState: { errors: otpErrors },
  } = useForm({ resolver: yupResolver(otpSchema) })

  // Step 1 Submit: Request 6-digit OTP
  const onEmailSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      await axios.post('/api/v1/auth/forgot-password', { email: data.email })
      setEmail(data.email)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'No active user account found with this email address.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP handler
  const handleResend = async () => {
    setResendLoading(true)
    setError(null)
    setResendSuccess(false)
    try {
      await axios.post('/api/v1/auth/forgot-password', { email })
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // Step 2 Submit: Verify 6-digit OTP
  const onOtpSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post('/api/v1/auth/verify-reset-otp', {
        email,
        otp: data.otp,
      })

      const resetToken = res.data.reset_token
      navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect or expired 6-digit verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1.5">Forgot Password</h1>
        <p className="text-slate-400 text-sm">
          {step === 1
            ? 'Enter your registered email address to receive a 6-digit verification code.'
            : `Enter the 6-digit verification code sent to ${email}`}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-500/10 text-red-300 text-sm rounded-lg border border-red-500/20">
          <RiErrorWarningLine className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Request Email */}
      {step === 1 && (
        <form onSubmit={handleSubmitEmail(onEmailSubmit)} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
              Registered Email Address
            </Label>
            <div className="relative">
              <RiMailLine
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                id="email"
                type="email"
                placeholder="clinician@hospital.org"
                className={[fieldClasses, emailErrors.email ? fieldErrorClasses : ''].join(' ')}
                {...registerEmail('email')}
              />
            </div>
            {emailErrors.email && (
              <p className="text-red-400 text-xs mt-1">{emailErrors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium shadow-lg shadow-blue-600/20 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending OTP code…
              </span>
            ) : (
              'Send 6-Digit Verification Code'
            )}
          </Button>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <RiArrowLeftLine size={15} />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: Verify 6-digit OTP */}
      {step === 2 && (
        <form onSubmit={handleSubmitOtp(onOtpSubmit)} noValidate className="space-y-5">
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-400/20 rounded-lg text-blue-300 text-xs mb-2">
            <RiCheckLine size={16} className="shrink-0 text-blue-400" />
            <span>Verification code sent to <strong>{email}</strong> (valid for 10 mins).</span>
          </div>


          {resendSuccess && (
            <p className="text-emerald-400 text-xs flex items-center gap-1">
              <RiCheckLine size={14} /> A new verification code has been sent.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-slate-300 text-sm font-medium">
              Enter 6-Digit Code
            </Label>
            <div className="relative">
              <RiShieldKeyholeLine
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                className={[
                  fieldClasses,
                  'text-center tracking-widest text-lg font-mono',
                  otpErrors.otp ? fieldErrorClasses : '',
                ].join(' ')}
                {...registerOtp('otp', {
                  onChange: (e) => {
                    const cleaned = e.target.value.replace(/\D/g, '')
                    setOtpValue('otp', cleaned)
                  },
                })}
              />
            </div>
            {otpErrors.otp && (
              <p className="text-red-400 text-xs mt-1">{otpErrors.otp.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium shadow-lg shadow-blue-600/20 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying Code…
              </span>
            ) : (
              'Verify Code & Continue'
            )}
          </Button>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1)
                setError(null)
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Change Email
            </button>

            <button
              type="button"
              disabled={resendLoading}
              onClick={handleResend}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              <RiRefreshLine size={13} className={resendLoading ? 'animate-spin' : ''} />
              {resendLoading ? 'Resending…' : 'Resend Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}