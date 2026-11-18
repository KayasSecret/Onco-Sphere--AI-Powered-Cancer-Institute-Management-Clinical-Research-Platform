import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loginThunk, selectAuthStatus, selectAuthError, clearError } from '../../redux/slices/authSlice'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { RiEyeLine, RiEyeOffLine, RiLockLine, RiMailLine, RiErrorWarningLine, RiArrowLeftLine, RiCheckLine } from 'react-icons/ri'
import { emailRegex } from '../../lib/validation'

const schema = yup.object({
 email: yup
    .string()
    .trim()
    .required('Email is required')
    .matches(emailRegex, 'Enter a valid email address'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  rememberMe: yup.boolean().default(false),
})

// Shared dark-theme styles for form fields — kept in one place so every
// input stays consistent and easy to update later.
const fieldClasses =
  'pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 ' +
  'focus-visible:border-blue-400/60 focus-visible:ring-2 focus-visible:ring-blue-500/20'

const fieldErrorClasses = 'border-red-500/60 focus-visible:ring-red-500/20'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const status = useSelector(selectAuthStatus)
  const error = useSelector(selectAuthError)
  const [showPassword, setShowPassword] = useState(false)
  const successMessage = location.state?.message

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data) => {
    const result = await dispatch(
      loginThunk({ email: data.email, password: data.password, rememberMe: data.rememberMe })
    )
    if (loginThunk.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="animate-fade-in bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">

      {/* Back button to Home */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <RiArrowLeftLine size={13} />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1.5">Welcome back</h1>
        <p className="text-slate-400 text-sm">
          Sign in to your HELIX account to continue.
        </p>
      </div>

      {/* Success alert banner (e.g. from password reset) */}
      {successMessage && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-300 text-sm rounded-lg border border-emerald-500/20">
          <RiCheckLine className="shrink-0 mt-0.5 text-emerald-400" size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-500/10 text-red-300 text-sm rounded-lg border border-red-500/20">
          <RiErrorWarningLine className="shrink-0 mt-0.5" size={16} />
          {error}
        </div>
      )}


      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
            Email address
          </Label>
          <div className="relative">
            <RiMailLine
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="clinician@hospital.org"
              className={[fieldClasses, errors.email ? fieldErrorClasses : ''].join(' ')}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <RiLockLine
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={[fieldClasses, 'pr-10', errors.password ? fieldErrorClasses : ''].join(' ')}
              {...register('password')}
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

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500"
            {...register('rememberMe')}
          />
          <Label htmlFor="rememberMe" className="text-slate-400 text-sm cursor-pointer">
            Remember me for 7 days
          </Label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white hover:text-white font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-slate-400 text-sm">
        Don't have an account?{' '}
        <Link to="/register/apply" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Register in Onco Sphere
        </Link>
      </p>
    </div>
  )
}