import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowLeftLine,
  RiErrorWarningLine,
} from 'react-icons/ri'
import { toast } from 'sonner'
import { passwordRegex } from '../../lib/validation'

const schema = yup.object({
  password: yup
    .string()
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
})

const fieldClasses =
  'pl-9 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 ' +
  'focus-visible:border-blue-400/60 focus-visible:ring-2 focus-visible:ring-blue-500/20'

const fieldErrorClasses = 'border-red-500/60 focus-visible:ring-red-500/20'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token. Please request a new verification code.')
    }
  }, [token])

  const onSubmit = async (data) => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      await axios.post('/api/v1/auth/reset-password', {
        token,
        new_password: data.password,
      })
      toast.success('Password has been reset successfully. Please log in with your new password.')
      navigate('/login', {
        state: {
          message: 'Password has been reset successfully. Please log in with your new password.',
        },
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please request a new verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1.5">Reset Your Password</h1>
        <p className="text-slate-400 text-sm">
          Create a secure new password for your account.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-500/10 text-red-300 text-sm rounded-lg border border-red-500/20 space-y-2">
          <div className="flex items-start gap-2">
            <RiErrorWarningLine className="shrink-0 mt-0.5 text-red-400" size={16} />
            <span>{error}</span>
          </div>
          <div>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-400 font-semibold underline hover:text-blue-300"
            >
              Request new verification code
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
            New Password
          </Label>
          <div className="relative">
            <RiLockLine
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className={[fieldClasses, errors.password ? fieldErrorClasses : ''].join(' ')}
              {...register('password')}
              disabled={!token}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
            Confirm New Password
          </Label>
          <div className="relative">
            <RiLockLine
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat new password"
              className={[fieldClasses, errors.confirmPassword ? fieldErrorClasses : ''].join(' ')}
              {...register('confirmPassword')}
              disabled={!token}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !token}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Resetting Password…
            </span>
          ) : (
            'Reset Password & Sign In'
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
    </div>
  )
}
