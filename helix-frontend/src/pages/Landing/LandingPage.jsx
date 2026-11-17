import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import { RiArrowRightLine, RiShieldCheckLine } from 'react-icons/ri'
import ICSRLogo from '../../assets/ICSR-LOGO.png'
import { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   MolecularCanvas — High-precision scientific laboratory background
   Pure 2D Canvas with HiDPI / Retina scaling. Zero heavy dependencies.
   Respects prefers-reduced-motion.
───────────────────────────────────────────────────────────────────────────── */
function MolecularCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Scientific node topology
    const NODE_COUNT = 42
    const CONNECT_DIST = 150
    const nodes = []

    for (let i = 0; i < NODE_COUNT; i++) {
      const isCoreMolecule = i < 9
      nodes.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * (height || window.innerHeight),
        r: isCoreMolecule ? 3.0 + Math.random() * 2.2 : 1.4 + Math.random() * 1.6,
        vx: prefersReduced ? 0 : (Math.random() - 0.5) * 0.16,
        vy: prefersReduced ? 0 : (Math.random() - 0.5) * 0.16,
        alpha: 0.35 + Math.random() * 0.45,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.009 + Math.random() * 0.012,
        isCore: isCoreMolecule,
      })
    }

    let rafId
    function render() {
      ctx.clearRect(0, 0, width, height)

      // Update positions
      if (!prefersReduced) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          n.x += n.vx
          n.y += n.vy
          n.pulse += n.pulseSpeed

          if (n.x < -20) n.x = width + 20
          if (n.x > width + 20) n.x = -20
          if (n.y < -20) n.y = height + 20
          if (n.y > height + 20) n.y = -20
        }
      }

      // Draw connective network lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECT_DIST) {
            const factor = 1 - dist / CONNECT_DIST
            const alpha = factor * (a.isCore || b.isCore ? 0.24 : 0.12)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
            ctx.lineWidth = 0.65
            ctx.stroke()
          }
        }
      }

      // Draw nodes and subtle orbital halos
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const pulse = n.isCore ? Math.sin(n.pulse) * 0.35 + 0.75 : 1
        const r = n.r * pulse
        const alpha = n.alpha * pulse

        if (n.isCore) {
          // Ambient cellular / molecular radial glow
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4.2)
          grad.addColorStop(0, `rgba(56, 189, 248, ${alpha * 0.55})`)
          grad.addColorStop(0.5, `rgba(37, 99, 235, ${alpha * 0.2})`)
          grad.addColorStop(1, 'rgba(3, 8, 23, 0)')
          ctx.beginPath()
          ctx.arc(n.x, n.y, r * 4.2, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }

        // Nucleus dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.isCore
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(147, 197, 253, ${alpha * 0.75})`
        ctx.fill()
      }

      rafId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   LandingPage — Onco Sphere Clinical Intelligence Platform
───────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  return (
    <>
      {/* ── Scoped styles for high-end oncology laboratory aesthetic ── */}
      <style>{`
        /* Smooth micro-animations */
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lp-badge-pop {
          0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lp-ambient-pulse {
          0%, 100% { opacity: 0.16; transform: scale(1) translate(-50%, -50%); }
          50%      { opacity: 0.28; transform: scale(1.08) translate(-50%, -50%); }
        }
        @keyframes lp-grid-drift {
          0%   { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        /* Entrance timing */
        .lp-anim-nav    { animation: lp-fade-in 0.55s ease both; }
        .lp-anim-badge  { animation: lp-badge-pop 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .lp-anim-h1     { animation: lp-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .lp-anim-p      { animation: lp-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both; }
        .lp-anim-cta    { animation: lp-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both; }
        .lp-anim-strip  { animation: lp-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.75s both; }

        @media (prefers-reduced-motion: reduce) {
          .lp-anim-nav, .lp-anim-badge, .lp-anim-h1, .lp-anim-p, .lp-anim-cta, .lp-anim-strip {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .lp-ambient-top, .lp-ambient-bottom, .lp-grid-bg {
            animation: none !important;
          }
        }

        /* Glassmorphic Top Navbar */
        .lp-navbar {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: rgba(3, 8, 23, 0.82);
          border-bottom: 1px solid rgba(56, 189, 248, 0.12);
        }

        /* ═══════════════════════════════════════════════════════
           BUTTON SYSTEM — All four landing page buttons
           Root cause of text-visibility bug: global index.css rule
             a:hover { color: var(--color-blue-dark) }
           overrides button text color because Link renders as <a>.
           Fix: explicit high-specificity color on every state,
           plus transition scoped to individual props (never 'all')
           so color is never animated from white to blue-dark.
        ═══════════════════════════════════════════════════════ */

        /* ── Nav Sign-In (glass navy, cyan hover illumination) ── */
        .lp-nav-signin {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #E8EEF8 !important;        /* locked — beats global a { color } */
          font-size: 0.84rem;
          font-weight: 600;
          letter-spacing: 0.015em;
          padding: 0.5rem 1.3rem;
          height: 38px;
          border-radius: 0.625rem;
          background: rgba(8, 21, 47, 0.75);
          border: 1px solid rgba(56, 189, 248, 0.26);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.09);
          /* Explicit property list — never animates color from white to blue-dark */
          transition:
            background 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          text-decoration: none !important;
          white-space: nowrap;
        }
        .lp-nav-signin:hover,
        .lp-nav-signin:focus {
          color: #FFFFFF !important;
          background: linear-gradient(180deg, rgba(22, 55, 125, 0.8) 0%, rgba(10, 27, 68, 0.92) 100%);
          border-color: rgba(56, 189, 248, 0.65);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.28), 0 4px 14px rgba(3, 8, 23, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transform: translateY(-1.5px);
          text-decoration: none !important;
        }
        .lp-nav-signin:active {
          color: #FFFFFF !important;
          transform: translateY(0) scale(0.98);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        /* ── Nav Sign-Up (electric-blue gradient, persistent white text) ── */
        .lp-nav-signup {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          color: #FFFFFF !important;        /* locked — beats global a:hover */
          font-size: 0.84rem;
          font-weight: 600;
          letter-spacing: 0.015em;
          padding: 0.5rem 1.4rem;
          height: 38px;
          border-radius: 0.625rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #173FB5 100%);
          border: 1px solid rgba(147, 197, 253, 0.45);
          box-shadow: 0 0 18px rgba(37, 99, 235, 0.42), 0 3px 10px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.28);
          transition:
            background 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          text-decoration: none !important;
          white-space: nowrap;
        }
        .lp-nav-signup:hover,
        .lp-nav-signup:focus {
          color: #FFFFFF !important;
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
          border-color: rgba(191, 219, 254, 0.72);
          box-shadow: 0 0 28px rgba(56, 189, 248, 0.5), 0 6px 18px rgba(37, 99, 235, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transform: translateY(-1.5px);
          text-decoration: none !important;
        }
        .lp-nav-signup:active {
          color: #FFFFFF !important;
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        }

        /* ── Hero Primary CTA (royal-blue gradient, always white text, arrow) ── */
        .lp-hero-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          color: #FFFFFF !important;        /* locked — beats global a:hover */
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: 0.012em;
          padding: 0.875rem 2.2rem;
          height: 52px;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #1B4FC0 100%);
          border: 1px solid rgba(147, 197, 253, 0.48);
          box-shadow:
            0 0 32px rgba(37, 99, 235, 0.45),
            0 4px 20px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.32);
          transition:
            background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none !important;
          white-space: nowrap;
        }
        .lp-hero-primary:hover,
        .lp-hero-primary:focus {
          color: #FFFFFF !important;
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 55%, #1D4ED8 100%);
          border-color: rgba(191, 219, 254, 0.78);
          box-shadow:
            0 0 48px rgba(56, 189, 248, 0.52),
            0 8px 28px rgba(37, 99, 235, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.46);
          transform: translateY(-2px);
          text-decoration: none !important;
        }
        .lp-hero-primary:active {
          color: #FFFFFF !important;
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.5);
        }
        /* Arrow micro-animation — isolated so it cannot interfere with text */
        .lp-hero-primary .lp-arrow {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .lp-hero-primary:hover .lp-arrow {
          transform: translateX(4px);
        }

        /* ── Hero Secondary CTA (navy glass, cyan outline, always readable) ── */
        .lp-hero-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          color: #E2EAF8 !important;        /* locked — beats global a { color } */
          font-size: 0.9375rem;
          font-weight: 500;
          letter-spacing: 0.012em;
          padding: 0.875rem 2.2rem;
          height: 52px;
          border-radius: 0.75rem;
          background: rgba(8, 21, 47, 0.68);
          border: 1px solid rgba(167, 183, 206, 0.28);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.07);
          transition:
            color 0.22s ease,
            background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none !important;
          white-space: nowrap;
        }
        .lp-hero-secondary:hover,
        .lp-hero-secondary:focus {
          color: #FFFFFF !important;
          background: rgba(16, 42, 100, 0.72);
          border-color: rgba(56, 189, 248, 0.55);
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.2), 0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          text-decoration: none !important;
        }
        .lp-hero-secondary:active {
          color: #FFFFFF !important;
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }

        /* Ambient Glow Spheres */
        .lp-ambient-top {
          position: absolute;
          top: 0;
          left: 50%;
          width: 860px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.26) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 70%);
          filter: blur(40px);
          animation: lp-ambient-pulse 8s ease-in-out infinite;
          pointer-events: none;
        }
        .lp-ambient-bottom {
          position: absolute;
          bottom: -100px;
          right: -100px;
          width: 580px;
          height: 580px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.12) 0%, rgba(18, 49, 107, 0.15) 50%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
        }

        /* Scientific Grid Pattern */
        .lp-grid-bg {
          background-image:
            linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: lp-grid-drift 24s linear infinite;
        }

        /* Subtle Laboratory Scanline Effect */
        .lp-scanlines {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.035) 2px,
            rgba(0, 0, 0, 0.035) 4px
          );
        }

        /* Divider gradient line */
        .lp-divider-line {
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(56, 189, 248, 0.15) 25%,
            rgba(37, 99, 235, 0.45) 50%,
            rgba(56, 189, 248, 0.15) 75%,
            transparent 100%
          );
        }

        /* Keyboard focus rings — clearly visible, locked text color */
        .lp-nav-signin:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 3px;
          color: #FFFFFF !important;
        }
        .lp-nav-signup:focus-visible {
          outline: 2px solid #93C5FD;
          outline-offset: 3px;
          color: #FFFFFF !important;
        }
        .lp-hero-primary:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 3px;
          color: #FFFFFF !important;
        }
        .lp-hero-secondary:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 3px;
          color: #FFFFFF !important;
        }

        /* Reduced-motion: preserve color, disable transform and glow transitions */
        @media (prefers-reduced-motion: reduce) {
          .lp-nav-signin,
          .lp-nav-signup,
          .lp-hero-primary,
          .lp-hero-secondary {
            transition: border-color 0.15s ease, background 0.15s ease !important;
          }
          .lp-nav-signin:hover, .lp-nav-signup:hover,
          .lp-hero-primary:hover, .lp-hero-secondary:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col relative select-none"
        style={{
          background: 'linear-gradient(175deg, #030817 0%, #061129 40%, #040D21 75%, #020612 100%)',
          color: '#F8FAFC',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── Top Navigation Bar ────────────────────────────────────────── */}
        <header className="lp-navbar lp-anim-nav sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-[70px] px-6 lg:px-12">
            
            {/* Branding: ONCO SPHERE · CLINICAL INTELLIGENCE */}
            <div className="flex items-center gap-3.5 shrink-0 cursor-default">
              <img
                src={ICSRLogo}
                alt="Onco Sphere Logo"
                style={{
                  width: '38px',
                  height: '38px',
                  objectFit: 'contain',
                  flexShrink: 0,
                  background: 'transparent',
                }}
              />
              <div className="flex flex-col justify-center leading-none">
                <span
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.025em',
                    lineHeight: '1.1',
                    whiteSpace: 'nowrap',
                    textShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(56,189,248,0.22)',
                  }}
                >
                  Onco Sphere
                </span>
                <span
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 600,
                    color: '#38BDF8',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    marginTop: '3px',
                    opacity: 0.9,
                  }}
                >
                  Clinical Intelligence
                </span>
              </div>
            </div>

            {/* Nav authentication controls */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="lp-nav-signup">
                  <span>Open Dashboard</span>
                  <RiArrowRightLine size={15} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="lp-nav-signin">
                    Sign In
                  </Link>
                  <Link to="/register/apply" className="lp-nav-signup">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Central Hero Section ──────────────────────────────────────── */}
        <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 lg:py-24 text-center">
          
          {/* Subtle laboratory background textures */}
          <div className="lp-grid-bg absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="lp-scanlines absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="lp-ambient-top" aria-hidden="true" />
          <div className="lp-ambient-bottom" aria-hidden="true" />

          {/* HiDPI Molecular connection canvas */}
          <MolecularCanvas />

          {/* Hero Content Container */}
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            
            {/* Clinical Intelligence Badge */}
            <div className="lp-anim-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/25 bg-sky-500/10 backdrop-blur-md mb-8 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
              <RiShieldCheckLine size={13} className="text-sky-400" />
              <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-sky-300">
                Clinical Intelligence Platform
              </span>
            </div>

            {/* Refined Headline */}
            <h1 className="lp-anim-h1 text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.14] mb-6">
              Precision in Every Patient.
              <br />
              <span className="font-semibold bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-200 bg-clip-text text-transparent">
                Clarity in Every Protocol.
              </span>
            </h1>

            {/* Concise Supporting Description */}
            <p className="lp-anim-p text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed mb-10">
              One intelligent platform connecting oncology workflows, clinical research and patient records.
            </p>

            {/* CTA Buttons */}
            <div className="lp-anim-cta flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="lp-hero-primary w-full sm:w-auto"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Sign in to Onco Sphere'}</span>
                <RiArrowRightLine size={18} className="lp-arrow" />
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/register/apply"
                  className="lp-hero-secondary w-full sm:w-auto"
                >
                  Request Access
                </Link>
              )}
            </div>

            {/* Institutional Trust Indicator Strip */}
            <div className="lp-anim-strip mt-12 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-400 tracking-[0.12em] uppercase">
                HIPAA-aware Architecture &nbsp;·&nbsp; Continuous PHI Audit &nbsp;·&nbsp; Institutional Oncology Use
              </span>
            </div>
          </div>
        </main>

        {/* ── Modern Compact Footer ─────────────────────────────────────── */}
        <footer className="relative z-10 bg-[#020614]/90 backdrop-blur-md px-6 py-8 text-center">
          <div className="lp-divider-line max-w-5xl mx-auto mb-6" />
          
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-2.5">
            {/* Logo and Subtitle */}
            <div className="flex items-center gap-2.5">
              <img
                src={ICSRLogo}
                alt="Onco Sphere Logo"
                aria-hidden="true"
                style={{ width: '22px', height: '22px', objectFit: 'contain', background: 'transparent' }}
              />
              <span className="text-xs font-bold text-slate-300 tracking-[0.1em] uppercase">
                Onco Sphere
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-[11px] font-semibold text-sky-400/80 tracking-[0.14em] uppercase">
                Clinical Intelligence
              </span>
            </div>

            {/* Institutional Notice */}
            <p className="text-[11px] font-normal text-slate-400 max-w-lg leading-relaxed">
              Institutional oncology research & clinical intelligence registry. Protected Health Information (PHI) access is strictly monitored and audited.
            </p>

            {/* Minimal Copyright */}
            <p className="text-[10px] font-normal text-slate-500 tracking-wider mt-1">
              &copy; {new Date().getFullYear()} Onco Sphere — Oncology Intelligence. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
