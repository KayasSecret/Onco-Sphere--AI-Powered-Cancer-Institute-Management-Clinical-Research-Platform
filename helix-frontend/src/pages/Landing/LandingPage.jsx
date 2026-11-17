import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import { RiArrowRightLine, RiShieldCheckLine } from 'react-icons/ri'
import ICSRLogo from '../../assets/ICSR-LOGO.png'
import { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   MolecularCanvas — lightweight CSS-canvas scientific background
   Pure JS Canvas. No external library. Respects prefers-reduced-motion.
───────────────────────────────────────────────────────────────────────────── */
function MolecularCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Node config
    const NODE_COUNT = 38
    const CONNECT_DIST = 160
    const nodes = []

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Seed nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const isMolecule = i < 8
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: isMolecule ? 3.5 + Math.random() * 2.5 : 1.5 + Math.random() * 2,
        vx: prefersReduced ? 0 : (Math.random() - 0.5) * 0.18,
        vy: prefersReduced ? 0 : (Math.random() - 0.5) * 0.18,
        alpha: 0.35 + Math.random() * 0.4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        isMolecule,
      })
    }

    let raf
    let t = 0

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 1

      // Update positions
      nodes.forEach(n => {
        if (!prefersReduced) {
          n.x += n.vx
          n.y += n.vy
          n.pulse += n.pulseSpeed
          if (n.x < -20) n.x = canvas.width + 20
          if (n.x > canvas.width + 20) n.x = -20
          if (n.y < -20) n.y = canvas.height + 20
          if (n.y > canvas.height + 20) n.y = -20
        }
      })

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist / CONNECT_DIST) * 0.22
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(56,189,248,${opacity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const pulse = n.isMolecule ? Math.sin(n.pulse) * 0.3 + 0.7 : 1
        const r = n.r * pulse
        const alpha = n.alpha * pulse

        if (n.isMolecule) {
          // Outer ring glow for molecule nodes
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.5)
          grad.addColorStop(0, `rgba(56,189,248,${alpha * 0.6})`)
          grad.addColorStop(1, `rgba(37,99,235,0)`)
          ctx.beginPath()
          ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }

        // Core dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.isMolecule
          ? `rgba(56,189,248,${alpha})`
          : `rgba(96,165,250,${alpha * 0.7})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
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
   LandingPage — Premium Clinical Intelligence Landing Page
───────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  return (
    <>
      {/* ── Injected styles for landing page only ──────────────────── */}
      <style>{`
        /* Landing page entrance animations */
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lp-badge-pop {
          0%   { opacity: 0; transform: translateY(10px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lp-glow-pulse {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.32; }
        }
        @keyframes lp-grid-drift {
          0%   { transform: translate(0,0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes lp-border-shine {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* Entrance timing */
        .lp-animate-nav    { animation: lp-fade-in  0.6s ease both; }
        .lp-animate-badge  { animation: lp-badge-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
        .lp-animate-h1     { animation: lp-fade-up  0.75s ease 0.4s both; }
        .lp-animate-p      { animation: lp-fade-up  0.75s ease 0.55s both; }
        .lp-animate-cta    { animation: lp-fade-up  0.75s ease 0.7s both; }

        /* Respect reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .lp-animate-nav, .lp-animate-badge, .lp-animate-h1,
          .lp-animate-p, .lp-animate-cta {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* Ambient glows */
        .lp-glow-top {
          animation: lp-glow-pulse 6s ease-in-out infinite;
        }
        .lp-glow-bottom {
          animation: lp-glow-pulse 8s ease-in-out 2s infinite;
        }

        /* Grid drift */
        .lp-grid {
          animation: lp-grid-drift 20s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-grid { animation: none !important; }
          .lp-glow-top, .lp-glow-bottom { animation: none !important; }
        }

        /* Navbar glass */
        .lp-nav {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: rgba(3, 8, 23, 0.78);
          border-bottom: 1px solid rgba(56, 189, 248, 0.12);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        /* Logo badge & icon container */
        .lp-logo-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(8, 21, 47, 0.65) 100%);
          border: 1px solid rgba(56, 189, 248, 0.28);
          box-shadow: 0 0 16px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.14);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-logo-group:hover .lp-logo-badge {
          border-color: rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        /* Sign-in button: transparent navy glass surface, refined border, cyan-blue hover illumination */
        .lp-nav-signin {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #E2E8F0;
          font-size: 0.84rem;
          font-weight: 600;
          letter-spacing: 0.015em;
          padding: 0.52rem 1.25rem;
          border-radius: 0.625rem;
          background: rgba(8, 21, 47, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.22);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .lp-nav-signin:hover {
          color: #FFFFFF;
          background: linear-gradient(180deg, rgba(20, 52, 115, 0.72) 0%, rgba(10, 27, 65, 0.85) 100%);
          border-color: rgba(56, 189, 248, 0.55);
          box-shadow: 0 0 22px rgba(56, 189, 248, 0.3), 0 4px 14px rgba(3, 8, 23, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transform: translateY(-1.5px);
        }
        .lp-nav-signin:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        /* Sign-up button: premium electric-blue gradient, subtle depth, sophisticated shadow, refined border, hover glow */
        .lp-nav-signup {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          color: #FFFFFF;
          font-size: 0.84rem;
          font-weight: 600;
          letter-spacing: 0.015em;
          padding: 0.52rem 1.4rem;
          border-radius: 0.625rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #173FB5 100%);
          border: 1px solid rgba(147, 197, 253, 0.4);
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.4), 0 3px 10px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.28);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .lp-nav-signup:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
          border-color: rgba(191, 219, 254, 0.7);
          box-shadow: 0 0 32px rgba(56, 189, 248, 0.55), 0 6px 18px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.45);
          transform: translateY(-1.5px);
        }
        .lp-nav-signup:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        }

        /* Backward-compatible aliases */
        .lp-btn-ghost {
          position: relative;
          color: #A7B7CE;
          font-size: 0.8125rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: color 0.2s ease, background 0.2s ease;
          letter-spacing: 0.01em;
        }
        .lp-btn-ghost:hover {
          color: #F8FAFC;
          background: rgba(37,99,235,0.1);
        }

        /* Primary CTA button */
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #2563EB 0%, #1B4FC0 100%);
          color: #F8FAFC;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          letter-spacing: 0.01em;
          box-shadow: 0 0 20px rgba(37,99,235,0.35), 0 2px 8px rgba(0,0,0,0.3);
          transition: box-shadow 0.25s ease, transform 0.2s ease, background 0.25s ease;
          border: 1px solid rgba(37,99,235,0.6);
        }
        .lp-btn-primary:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          box-shadow: 0 0 32px rgba(56,189,248,0.4), 0 4px 16px rgba(0,0,0,0.3);
          transform: translateY(-1px);
        }
        .lp-btn-primary:active {
          transform: translateY(0);
        }

        /* Hero CTA primary */
        .lp-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1B4FC0 100%);
          color: #F8FAFC;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          border-radius: 0.75rem;
          letter-spacing: 0.01em;
          box-shadow: 0 0 40px rgba(37,99,235,0.45), 0 4px 24px rgba(0,0,0,0.4);
          transition: box-shadow 0.3s ease, transform 0.25s ease, background 0.3s ease;
          border: 1px solid rgba(56,189,248,0.3);
        }
        .lp-cta-primary:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 60%, #1D4ED8 100%);
          box-shadow: 0 0 60px rgba(56,189,248,0.5), 0 8px 32px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }
        .lp-cta-primary:active { transform: translateY(0); }

        .lp-cta-primary .lp-arrow {
          transition: transform 0.2s ease;
        }
        .lp-cta-primary:hover .lp-arrow {
          transform: translateX(4px);
        }

        /* Hero CTA secondary */
        .lp-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          background: rgba(8,21,47,0.6);
          color: #CBD5E1;
          font-size: 0.9375rem;
          font-weight: 500;
          padding: 0.875rem 2rem;
          border-radius: 0.75rem;
          letter-spacing: 0.01em;
          border: 1px solid rgba(167,183,206,0.2);
          backdrop-filter: blur(8px);
          transition: color 0.25s ease, border-color 0.25s ease,
                      background 0.25s ease, transform 0.25s ease,
                      box-shadow 0.25s ease;
        }
        .lp-cta-secondary:hover {
          color: #F8FAFC;
          border-color: rgba(56,189,248,0.4);
          background: rgba(37,99,235,0.12);
          box-shadow: 0 0 24px rgba(56,189,248,0.15);
          transform: translateY(-2px);
        }
        .lp-cta-secondary:active { transform: translateY(0); }

        /* Badge */
        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #38BDF8;
          background: rgba(56,189,248,0.07);
          border: 1px solid rgba(56,189,248,0.2);
          padding: 0.4rem 1rem;
          border-radius: 9999px;
        }

        /* Hero h1 gradient */
        .lp-gradient-text {
          background: linear-gradient(90deg, #60A5FA 0%, #38BDF8 50%, #67E8F9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Glass divider line above footer */
        .lp-footer-line {
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(56,189,248,0.25) 30%,
            rgba(37,99,235,0.35) 50%,
            rgba(56,189,248,0.25) 70%,
            transparent 100%
          );
        }

        /* Focus rings on nav links */
        .lp-nav-signin:focus-visible,
        .lp-nav-signup:focus-visible,
        .lp-btn-ghost:focus-visible,
        .lp-btn-primary:focus-visible,
        .lp-cta-primary:focus-visible,
        .lp-cta-secondary:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 3px;
        }

        /* Technical grid lines */
        .lp-technical-grid {
          background-image:
            linear-gradient(rgba(56,189,248,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.045) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Scanline overlay */
        .lp-scanline {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.04) 2px,
            rgba(0,0,0,0.04) 4px
          );
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{
          background: 'linear-gradient(170deg, #030817 0%, #08152F 45%, #030F22 75%, #030817 100%)',
          color: '#F8FAFC',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >

        {/* ── Navigation Bar ─────────────────────────────────────────── */}
        <header className="lp-nav lp-animate-nav sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-[72px] px-6 lg:px-12">

            {/* Logo & Brand Name */}
            <div className="lp-logo-group flex items-center gap-3.5 shrink-0 cursor-default select-none">
              <div className="lp-logo-badge">
                <img
                  src={ICSRLogo}
                  alt="Onco Sphere Logo"
                  style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                />
              </div>
              <div className="flex flex-col justify-center leading-none">
                <span
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.025em',
                    lineHeight: '1.1',
                    whiteSpace: 'nowrap',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 18px rgba(56,189,248,0.2)',
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

            {/* Nav actions */}
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

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">

          {/* Technical grid */}
          <div
            className="lp-technical-grid lp-grid absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ opacity: 1 }}
          />

          {/* Scanline texture */}
          <div
            className="lp-scanline absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* Molecular network canvas */}
          <MolecularCanvas />

          {/* Ambient glow — top center */}
          <div
            className="lp-glow-top absolute pointer-events-none"
            aria-hidden="true"
            style={{
              top: '-120px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '800px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(37,99,235,0.22) 0%, rgba(56,189,248,0.08) 50%, transparent 70%)',
              filter: 'blur(1px)',
            }}
          />

          {/* Ambient glow — bottom right */}
          <div
            className="lp-glow-bottom absolute pointer-events-none"
            aria-hidden="true"
            style={{
              bottom: '-80px',
              right: '-80px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(56,189,248,0.1) 0%, transparent 65%)',
              filter: 'blur(2px)',
            }}
          />

          {/* Ambient glow — bottom left */}
          <div
            className="absolute pointer-events-none"
            aria-hidden="true"
            style={{
              bottom: '0',
              left: '-60px',
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(18,49,107,0.3) 0%, transparent 65%)',
              opacity: 0.6,
            }}
          />

          {/* Hero content */}
          <div
            className="relative z-10 flex flex-col items-center text-center"
            style={{
              maxWidth: '820px',
              padding: '6rem 2rem 5rem',
            }}
          >

            {/* Clinical intelligence badge */}
            <div className="lp-animate-badge lp-badge mb-7">
              <RiShieldCheckLine size={12} />
              Clinical Intelligence Platform
            </div>

            {/* Main headline */}
            <h1
              className="lp-animate-h1"
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                fontWeight: 300,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: '#F8FAFC',
                marginBottom: '1.5rem',
              }}
            >
              Every patient.{' '}
              <span className="lp-gradient-text" style={{ fontWeight: 600 }}>
                Every protocol.
              </span>
              <br />
              <span style={{ fontWeight: 300 }}>One clear line of sight.</span>
            </h1>

            {/* Supporting description */}
            <p
              className="lp-animate-p"
              style={{
                fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
                fontWeight: 400,
                lineHeight: 1.75,
                color: '#A7B7CE',
                maxWidth: '620px',
                marginBottom: '2.75rem',
              }}
            >
              Onco Sphere unites patient registries, longitudinal EMR charting,
              and oncology workflow management in a clean, quiet interface
              designed for hospital networks and cancer centers.
            </p>

            {/* CTA Buttons */}
            <div
              className="lp-animate-cta flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="lp-cta-primary"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Sign in to Onco Sphere'}
                <RiArrowRightLine size={18} className="lp-arrow" />
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/register/apply"
                  className="lp-cta-secondary"
                >
                  Request Access
                </Link>
              )}
            </div>

            {/* Trust indicator strip */}
            <div
              className="lp-animate-cta mt-10 flex items-center gap-2"
              style={{ animationDelay: '0.85s' }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#38BDF8',
                  boxShadow: '0 0 8px rgba(56,189,248,0.8)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: '#4B6A8A',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                HIPAA-aware architecture &nbsp;·&nbsp; PHI access audited &nbsp;·&nbsp; Institutional use only
              </span>
            </div>
          </div>
        </main>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer
          style={{
            background: 'rgba(3,8,23,0.95)',
            padding: '2rem 1.5rem',
          }}
        >
          <div className="lp-footer-line mb-6" />

          <div className="max-w-4xl mx-auto flex flex-col items-center gap-3 text-center">
            {/* Logo row */}
            <div className="flex items-center gap-2 mb-1">
              <img
                src={ICSRLogo}
                alt=""
                aria-hidden="true"
                style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: 0.5 }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4B6A8A',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Onco Sphere
              </span>
            </div>

            {/* Legal notice */}
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 400,
                color: '#2D4A6B',
                lineHeight: 1.65,
                maxWidth: '480px',
              }}
            >
              Onco Sphere is a medical information registry designed strictly for
              institutional use. Protected health information (PHI) access is
              audited continuously.
            </p>

            {/* Copyright */}
            <p
              style={{
                fontSize: '0.625rem',
                fontWeight: 400,
                color: '#1E3A5F',
                letterSpacing: '0.04em',
                marginTop: '0.25rem',
              }}
            >
              &copy; {new Date().getFullYear()} Onco Sphere — Oncology Intelligence. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
