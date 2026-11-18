import { Outlet } from 'react-router-dom'
import ICSRLogo from '../assets/ICSR-LOGO.png'

/**
 * AuthLayout — centered card layout for Login, Signup, ForgotPassword, Reset pages.
 * Left panel carries brand storytelling (desktop only); right panel renders
 * whichever auth form is active via <Outlet />.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Left brand panel (desktop only) ────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12 border-r border-white/10">

        {/* Ambient glow + grid texture — matches landing page */}
        <div className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:40px_40px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img src={ICSRLogo} alt="Onco Sphere Logo" className="h-12 w-auto object-contain bg-transparent" />
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <blockquote className="text-white text-2xl lg:text-3xl font-light leading-relaxed mb-6">
            "Every patient.{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Every protocol.
            </span>{' '}
            One clear line of sight."
          </blockquote>
          <p className="text-slate-400 text-sm leading-relaxed">
            A precision oncology platform built for clinicians, coordinators, and researchers —
            bringing structure, clarity, and continuity to complex care.
          </p>
        </div>

        {/* Trust band */}
        <div className="flex gap-8 relative z-10 pt-8 border-t border-white/10">
          {[
            { stat: '10,000+', label: 'Patients Tracked' },
            { stat: '99.9%', label: 'Uptime' },
            { stat: '15+', label: 'Departments' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-white text-xl font-bold">{item.stat}</p>
              <p className="text-slate-400 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-3.5 sm:p-6 relative overflow-x-hidden">

        {/* Subtle glow so mobile view (no left panel) still feels on-brand */}
        <div className="lg:hidden absolute -top-32 left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] h-[320px] sm:h-[400px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8 justify-center">
            <img src={ICSRLogo} alt="Onco Sphere Logo" className="h-10 w-auto object-contain bg-transparent" />
          </div>

          {/* Auth form content injected here */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}