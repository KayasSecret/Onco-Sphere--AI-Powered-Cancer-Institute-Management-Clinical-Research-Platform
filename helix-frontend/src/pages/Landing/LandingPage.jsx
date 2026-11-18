import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import { RiArrowRightLine, RiShieldCheckLine } from 'react-icons/ri'
import ICSRLogo from '../../assets/ICSR-LOGO.png'
import { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   ScientificLabCanvas — Immersive oncology research laboratory animation
   Layers: molecular network · glass flasks · microscopic particles ·
           cellular structures · liquid chemistry · volumetric lighting
   Pure 2D Canvas, HiDPI/Retina aware. Respects prefers-reduced-motion.
───────────────────────────────────────────────────────────────────────────── */
function MolecularCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0, H = 0, dpr = 1, rafId = null, t = 0

    // ── Resize & HiDPI ──────────────────────────────────────────────────────
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      initScene()
    }

    // ── Seeded helpers ───────────────────────────────────────────────────────
    const rng = (() => { let s = 42; return () => { s ^= s<<13; s ^= s>>7; s ^= s<<17; return (s >>> 0) / 4294967295 } })()

    // ── LAYER 1: Molecular network nodes ────────────────────────────────────
    const MOL_COUNT = 38
    let molecules = []
    function initMolecules() {
      molecules = []
      for (let i = 0; i < MOL_COUNT; i++) {
        const core = i < 10
        molecules.push({
          x: rng() * W, y: rng() * H,
          vx: prefersReduced ? 0 : (rng() - 0.5) * 0.14,
          vy: prefersReduced ? 0 : (rng() - 0.5) * 0.14,
          r: core ? 2.8 + rng() * 2.0 : 1.2 + rng() * 1.4,
          alpha: 0.3 + rng() * 0.45,
          phase: rng() * Math.PI * 2,
          speed: 0.008 + rng() * 0.011,
          core,
          // color channel: 0=cyan, 1=blue, 2=purple
          hue: core ? Math.floor(rng() * 2) : Math.floor(rng() * 3),
        })
      }
    }

    // ── LAYER 2: Travelling pulses along connections ─────────────────────────
    let pulses = []
    function spawnPulse(a, b) {
      pulses.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, prog: 0, speed: 0.004 + rng() * 0.006 })
    }

    // ── LAYER 3: Hexagonal molecular formations ──────────────────────────────
    const HEX_COUNT = 5
    let hexRings = []
    function initHex() {
      hexRings = []
      const positions = [
        [W * 0.08,  H * 0.18],
        [W * 0.88,  H * 0.12],
        [W * 0.92,  H * 0.78],
        [W * 0.05,  H * 0.80],
        [W * 0.50,  H * 0.07],
      ]
      for (let k = 0; k < HEX_COUNT; k++) {
        const [cx, cy] = positions[k] || [rng() * W, rng() * H]
        hexRings.push({
          cx, cy,
          r: 32 + rng() * 22,
          rot: rng() * Math.PI * 2,
          rotSpeed: prefersReduced ? 0 : (rng() - 0.5) * 0.0018,
          alpha: 0.08 + rng() * 0.08,
        })
      }
    }

    // ── LAYER 4: Floating microscopic dust/spore particles ───────────────────
    const DUST_COUNT = 55
    let dust = []
    function initDust() {
      dust = []
      for (let i = 0; i < DUST_COUNT; i++) {
        dust.push({
          x: rng() * W, y: rng() * H,
          r: 0.5 + rng() * 1.6,
          vx: prefersReduced ? 0 : (rng() - 0.5) * 0.08,
          vy: prefersReduced ? 0 : -0.04 - rng() * 0.06,   // slight upward drift
          alpha: 0.12 + rng() * 0.28,
          phase: rng() * Math.PI * 2,
          speed: 0.012 + rng() * 0.018,
          depth: rng(),   // 0=far, 1=near
        })
      }
    }

    // ── LAYER 5: Glass flasks ────────────────────────────────────────────────
    const FLASK_DEFS = [
      // [normX, normY, scaleW, scaleH, liquidHue, bubbleCount]
      [0.04,  0.60, 0.055, 0.28, 0, 4],
      [0.90,  0.42, 0.045, 0.22, 1, 3],
      [0.95,  0.72, 0.038, 0.18, 2, 2],
      [0.01,  0.30, 0.035, 0.16, 3, 2],
    ]
    let flasks = []

    // Bubble per-flask state
    function initFlasks() {
      flasks = FLASK_DEFS.map(([nx, ny, nw, nh, hue, nBubbles]) => {
        const x = nx * W, y = ny * H
        const w = nw * W, h = nh * H
        const bubbles = []
        for (let i = 0; i < nBubbles; i++) {
          bubbles.push({
            px: 0.2 + rng() * 0.6,   // relative x inside flask
            py: 0.5 + rng() * 0.45,  // relative y (0=top 1=bottom)
            r: 1.2 + rng() * 2.2,
            speed: prefersReduced ? 0 : 0.0008 + rng() * 0.0012,
          })
        }
        return { x, y, w, h, hue, bubbles, liquidPhase: rng() * Math.PI * 2, liquidSpeed: 0.006 + rng() * 0.006 }
      })
    }

    // Liquid hue helper → RGBA string
    function liquidColor(hue, alpha) {
      const palettes = [
        [8, 124, 255, alpha],      // electric blue
        [25, 217, 255, alpha],     // cyan
        [121, 91, 255, alpha],     // soft purple
        [56, 189, 248, alpha],     // sky
      ]
      const [r, g, b, a] = palettes[hue % palettes.length]
      return `rgba(${r},${g},${b},${a})`
    }

    // ── LAYER 6: Scanning light beam ─────────────────────────────────────────
    let scanPhase = 0

    // ── LAYER 7: Cellular membrane circles ──────────────────────────────────
    const CELL_COUNT = 4
    let cells = []
    function initCells() {
      cells = []
      const positions = [[W*0.12, H*0.70], [W*0.84, H*0.60], [W*0.60, H*0.88], [W*0.30, H*0.15]]
      for (let i = 0; i < CELL_COUNT; i++) {
        const [cx, cy] = positions[i] || [rng()*W, rng()*H]
        cells.push({
          cx, cy,
          r: 28 + rng() * 36,
          phase: rng() * Math.PI * 2,
          speed: 0.004 + rng() * 0.005,
          alpha: 0.07 + rng() * 0.06,
          hue: Math.floor(rng() * 4),
        })
      }
    }

    // ── Init all layers ──────────────────────────────────────────────────────
    function initScene() {
      initMolecules(); initHex(); initDust(); initFlasks(); initCells()
    }

    resize()
    window.addEventListener('resize', resize)

    // ── Draw helpers ─────────────────────────────────────────────────────────
    function molColor(hue, alpha) {
      if (hue === 0) return `rgba(56,189,248,${alpha})`   // cyan
      if (hue === 1) return `rgba(37,99,235,${alpha})`    // blue
      return `rgba(121,91,255,${alpha})`                   // purple
    }

    function drawHexRing(hx) {
      const { cx, cy, r, rot, alpha } = hx
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2
        const px = Math.cos(a) * r, py = Math.sin(a) * r
        k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(56,189,248,${alpha})`
      ctx.lineWidth = 0.8
      ctx.stroke()

      // vertices as small nodes
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(56,189,248,${alpha * 2.2})`
        ctx.fill()
      }
      ctx.restore()
    }

    function drawFlask({ x, y, w, h, hue, bubbles, liquidPhase }) {
      const neckW = w * 0.28
      const neckH = h * 0.28
      const bodyBottom = y + h

      // ── Glass body outline (Erlenmeyer-ish) ─────────────────────────────
      ctx.save()
      ctx.beginPath()
      // neck
      ctx.moveTo(x + w/2 - neckW/2, y)
      ctx.lineTo(x + w/2 + neckW/2, y)
      // neck to body
      ctx.lineTo(x + w, bodyBottom)
      ctx.lineTo(x, bodyBottom)
      ctx.closePath()

      // subtle glass fill
      const glassGrad = ctx.createLinearGradient(x, y, x + w, y)
      glassGrad.addColorStop(0,   'rgba(56,189,248,0.04)')
      glassGrad.addColorStop(0.4, 'rgba(255,255,255,0.02)')
      glassGrad.addColorStop(1,   'rgba(56,189,248,0.03)')
      ctx.fillStyle = glassGrad
      ctx.fill()

      // outline
      ctx.strokeStyle = `rgba(56,189,248,0.18)`
      ctx.lineWidth = 0.8
      ctx.stroke()

      // ── Liquid inside ────────────────────────────────────────────────────
      const liquidTop = y + h * (0.35 + 0.06 * Math.sin(liquidPhase))
      const liquidPath = new Path2D()
      liquidPath.moveTo(x + 2, bodyBottom - 1)
      liquidPath.lineTo(x + w - 2, bodyBottom - 1)
      liquidPath.lineTo(x + w * (0.7 + 0.04 * Math.cos(liquidPhase * 1.3)), liquidTop + 2)
      // gentle wave on surface
      for (let wx = 0; wx <= 1; wx += 0.1) {
        const waveY = liquidTop + Math.sin(liquidPhase * 2 + wx * Math.PI * 2) * 2
        liquidPath.lineTo(x + w * (1 - wx), waveY)
      }
      liquidPath.closePath()
      ctx.save()
      ctx.clip(liquidPath)

      const liqGrad = ctx.createLinearGradient(x, liquidTop, x, bodyBottom)
      liqGrad.addColorStop(0, liquidColor(hue, 0.22))
      liqGrad.addColorStop(0.5, liquidColor(hue, 0.30))
      liqGrad.addColorStop(1,   liquidColor(hue, 0.18))
      ctx.fillStyle = liqGrad
      ctx.fillRect(x, liquidTop, w, bodyBottom - liquidTop)

      // inner glow
      const lgInner = ctx.createRadialGradient(x + w*0.5, bodyBottom, 0, x + w*0.5, bodyBottom, h*0.5)
      lgInner.addColorStop(0, liquidColor(hue, 0.18))
      lgInner.addColorStop(1, liquidColor(hue, 0))
      ctx.fillStyle = lgInner
      ctx.fillRect(x, liquidTop, w, bodyBottom - liquidTop)

      ctx.restore() // unclip

      // ── Bubbles ──────────────────────────────────────────────────────────
      for (const b of bubbles) {
        const bx = x + (b.px * w) * 0.6 + w * 0.2
        const by = y + h * b.py
        if (by < liquidTop) continue
        ctx.beginPath()
        ctx.arc(bx, by, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = liquidColor(hue, 0.45)
        ctx.lineWidth = 0.6
        ctx.stroke()
        // inner shimmer
        ctx.beginPath()
        ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,0.18)`
        ctx.fill()
      }

      // ── Glass highlight streak ───────────────────────────────────────────
      ctx.beginPath()
      ctx.moveTo(x + w * 0.08, y + h * 0.1)
      ctx.lineTo(x + w * 0.14, y + h * 0.75)
      ctx.strokeStyle = 'rgba(255,255,255,0.09)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.restore()
    }

    function drawScanLine(scanX) {
      const grad = ctx.createLinearGradient(scanX - 60, 0, scanX + 60, 0)
      grad.addColorStop(0,   'rgba(56,189,248,0)')
      grad.addColorStop(0.4, 'rgba(56,189,248,0.04)')
      grad.addColorStop(0.5, 'rgba(56,189,248,0.07)')
      grad.addColorStop(0.6, 'rgba(56,189,248,0.04)')
      grad.addColorStop(1,   'rgba(56,189,248,0)')
      ctx.fillStyle = grad
      ctx.fillRect(scanX - 60, 0, 120, H)
    }

    // ── Main render loop ─────────────────────────────────────────────────────
    function render() {
      ctx.clearRect(0, 0, W, H)
      t += prefersReduced ? 0 : 1

      // ── Update molecules ─────────────────────────────────────────────────
      for (const m of molecules) {
        if (!prefersReduced) {
          m.x += m.vx; m.y += m.vy; m.phase += m.speed
          if (m.x < -20) m.x = W + 20; if (m.x > W + 20) m.x = -20
          if (m.y < -20) m.y = H + 20; if (m.y > H + 20) m.y = -20
        }
      }

      // ── Update hex rings ─────────────────────────────────────────────────
      for (const h of hexRings) h.rot += h.rotSpeed

      // ── Update dust ──────────────────────────────────────────────────────
      for (const d of dust) {
        if (!prefersReduced) {
          d.x += d.vx; d.y += d.vy; d.phase += d.speed
          if (d.y < -10) { d.y = H + 10; d.x = rng() * W }
          if (d.x < -10) d.x = W + 10; if (d.x > W + 10) d.x = -10
        }
      }

      // ── Update bubbles (rise up) ─────────────────────────────────────────
      for (const f of flasks) {
        f.liquidPhase += f.liquidSpeed
        for (const b of f.bubbles) {
          b.py -= b.speed
          if (b.py < 0.05) { b.py = 0.9 + rng() * 0.08; b.px = 0.2 + rng() * 0.6 }
        }
      }

      // ── Update scan ──────────────────────────────────────────────────────
      scanPhase += 0.0012

      // ── Update cells ─────────────────────────────────────────────────────
      for (const c of cells) c.phase += c.speed

      // ══ DRAW LAYERS (back → front) ═══════════════════════════════════════

      // 1. Volumetric ambient light pools
      const ambPulse = Math.sin(t * 0.008) * 0.5 + 0.5
      ;[
        [W * 0.5, H * 0.3, 420, 0.13 + ambPulse * 0.06, [37, 99, 235]],
        [W * 0.1, H * 0.7, 280, 0.08 + ambPulse * 0.03, [56, 189, 248]],
        [W * 0.9, H * 0.5, 260, 0.07, [121, 91, 255]],
      ].forEach(([ax, ay, ar, aa, [r, g, b]]) => {
        const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar)
        ag.addColorStop(0,   `rgba(${r},${g},${b},${aa})`)
        ag.addColorStop(0.5, `rgba(${r},${g},${b},${aa * 0.4})`)
        ag.addColorStop(1,   `rgba(${r},${g},${b},0)`)
        ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2)
        ctx.fillStyle = ag; ctx.fill()
      })

      // 2. Cellular membrane structures (deep back)
      for (const c of cells) {
        const pulse = Math.sin(c.phase) * 0.3 + 0.7
        ctx.save()
        ctx.translate(c.cx, c.cy)
        // outer membrane
        ctx.beginPath()
        ctx.arc(0, 0, c.r * pulse, 0, Math.PI * 2)
        ctx.strokeStyle = liquidColor(c.hue, c.alpha * pulse)
        ctx.lineWidth = 1.2
        ctx.stroke()
        // inner membrane
        ctx.beginPath()
        ctx.arc(0, 0, c.r * 0.62 * pulse, 0, Math.PI * 2)
        ctx.strokeStyle = liquidColor(c.hue, c.alpha * 0.5 * pulse)
        ctx.lineWidth = 0.6
        ctx.stroke()
        // nucleus
        const nucGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r * 0.18)
        nucGrad.addColorStop(0, liquidColor(c.hue, c.alpha * 1.5 * pulse))
        nucGrad.addColorStop(1, liquidColor(c.hue, 0))
        ctx.beginPath(); ctx.arc(0, 0, c.r * 0.18, 0, Math.PI * 2)
        ctx.fillStyle = nucGrad; ctx.fill()
        ctx.restore()
      }

      // 3. Glass flasks (laboratory equipment)
      for (const f of flasks) drawFlask(f)

      // 4. Hexagonal molecular formations
      for (const h of hexRings) drawHexRing(h)

      // 5. Molecular connection network
      for (let i = 0; i < molecules.length; i++) {
        for (let j = i + 1; j < molecules.length; j++) {
          const a = molecules[i], b = molecules[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 155) {
            const fac = 1 - dist / 155
            const lineAlpha = fac * (a.core || b.core ? 0.22 : 0.10)
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(56,189,248,${lineAlpha})`
            ctx.lineWidth = 0.6; ctx.stroke()

            // occasionally spawn pulse
            if (!prefersReduced && t % 180 === 0 && fac > 0.6 && rng() < 0.15) spawnPulse(a, b)
          }
        }
      }

      // 6. Travelling pulses along edges
      pulses = pulses.filter(p => p.prog <= 1)
      for (const p of pulses) {
        p.prog += p.speed
        const px = p.ax + (p.bx - p.ax) * p.prog
        const py = p.ay + (p.by - p.ay) * p.prog
        const pGrad = ctx.createRadialGradient(px, py, 0, px, py, 5)
        pGrad.addColorStop(0,   'rgba(56,189,248,0.90)')
        pGrad.addColorStop(0.4, 'rgba(56,189,248,0.30)')
        pGrad.addColorStop(1,   'rgba(56,189,248,0)')
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fillStyle = pGrad; ctx.fill()
      }

      // 7. Molecule nodes (core + secondary)
      for (const m of molecules) {
        const pulse = m.core ? Math.sin(m.phase) * 0.32 + 0.78 : 1
        const r = m.r * pulse, a = m.alpha * pulse

        if (m.core) {
          const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 5)
          glow.addColorStop(0,   molColor(m.hue, a * 0.5))
          glow.addColorStop(0.4, molColor(m.hue, a * 0.15))
          glow.addColorStop(1,   molColor(m.hue, 0))
          ctx.beginPath(); ctx.arc(m.x, m.y, r * 5, 0, Math.PI * 2)
          ctx.fillStyle = glow; ctx.fill()
        }

        ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI * 2)
        ctx.fillStyle = molColor(m.hue, m.core ? a : a * 0.72)
        ctx.fill()

        // small ring on core nodes
        if (m.core) {
          ctx.beginPath(); ctx.arc(m.x, m.y, r * 2.4, 0, Math.PI * 2)
          ctx.strokeStyle = molColor(m.hue, a * 0.18)
          ctx.lineWidth = 0.6; ctx.stroke()
        }
      }

      // 8. Foreground microscopic dust (depth: near)
      for (const d of dust) {
        const pa = d.alpha * (0.5 + 0.5 * Math.sin(d.phase)) * (0.4 + d.depth * 0.6)
        const pr = d.r * (0.5 + d.depth * 0.5)
        ctx.beginPath(); ctx.arc(d.x, d.y, pr, 0, Math.PI * 2)
        ctx.fillStyle = d.depth > 0.6
          ? `rgba(56,189,248,${pa})`
          : `rgba(147,197,253,${pa})`
        ctx.fill()
      }

      // 9. Scanning laboratory light beam
      if (!prefersReduced) {
        const scanX = ((Math.sin(scanPhase) * 0.5 + 0.5)) * W
        drawScanLine(scanX)
      }

      rafId = requestAnimationFrame(render)
    }

    render()
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
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
        @keyframes lp-flask-glow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes lp-cell-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes lp-liquid-drift {
          0%   { transform: translateX(0px) rotate(0deg); }
          50%  { transform: translateX(3px) rotate(0.6deg); }
          100% { transform: translateX(0px) rotate(0deg); }
        }
        @keyframes lp-scanbeam {
          0%   { left: -20%; }
          100% { left: 110%; }
        }

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
            linear-gradient(rgba(56, 189, 248, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.035) 1px, transparent 1px);
          background-size: 52px 52px;
          animation: lp-grid-drift 28s linear infinite;
        }

        /* CSS lab depth layers — complement the Canvas */
        .lp-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(2,8,23,0.65) 100%);
        }
        .lp-depth-left {
          position: absolute;
          top: 0; left: 0;
          width: 220px; height: 100%;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(6,27,58,0.38) 0%, transparent 100%);
        }
        .lp-depth-right {
          position: absolute;
          top: 0; right: 0;
          width: 220px; height: 100%;
          pointer-events: none;
          background: linear-gradient(-90deg, rgba(6,27,58,0.38) 0%, transparent 100%);
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

        /* ══════════════════════════════════════════════════════════
           MOBILE RESPONSIVENESS — 320px · 375px · 390px · 430px
           All fixes are additive — no desktop rules are overridden
           outside of the relevant breakpoints.
        ══════════════════════════════════════════════════════════ */

        /* Root — prevent any horizontal overflow */
        .lp-root-wrap {
          max-width: 100vw;
          overflow-x: hidden;
        }

        /* ── Navbar responsive shell ──────────────────────────── */
        .lp-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 60px;
          padding: 0 1rem;
          box-sizing: border-box;
          gap: 0.5rem;
        }
        @media (min-width: 480px) {
          .lp-navbar-inner { height: 70px; padding: 0 1.5rem; gap: 0.75rem; }
        }
        @media (min-width: 1024px) {
          .lp-navbar-inner { max-width: 80rem; margin: 0 auto; padding: 0 3rem; gap: 1rem; }
        }

        /* ── Brand block — shrinks gracefully on narrow screens ── */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 1;
          min-width: 0;
          cursor: default;
        }
        .lp-brand-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
          flex-shrink: 0;
          background: transparent;
        }
        @media (min-width: 480px) {
          .lp-brand { gap: 0.75rem; }
          .lp-brand-logo { width: 34px; height: 34px; }
        }
        @media (min-width: 768px) {
          .lp-brand-logo { width: 38px; height: 38px; }
        }
        .lp-brand-name {
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.025em;
          line-height: 1.1;
          white-space: nowrap;
          text-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(56,189,248,0.22);
          /* fluid font: 1.05rem at 320px → 1.45rem at 768px+ */
          font-size: clamp(1.0rem, 3.5vw, 1.45rem);
        }
        .lp-brand-sub {
          font-weight: 600;
          color: #38BDF8;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 2px;
          opacity: 0.9;
          white-space: nowrap;
          /* fluid: 0.48rem at 320px → 0.58rem at 480px+ */
          font-size: clamp(0.44rem, 1.4vw, 0.58rem);
        }
        /* Hide subtitle below 360px to save space */
        @media (max-width: 359px) {
          .lp-brand-sub { display: none; }
        }

        /* ── Nav auth buttons — mobile-compact ─────────────────── */
        .lp-nav-buttons {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 0.4rem;
        }
        @media (min-width: 480px) {
          .lp-nav-buttons { gap: 0.75rem; }
        }

        /* Compact Sign In on mobile */
        @media (max-width: 479px) {
          .lp-nav-signin {
            padding: 0.4rem 0.75rem !important;
            height: 34px !important;
            font-size: 0.78rem !important;
            letter-spacing: 0 !important;
          }
          .lp-nav-signup {
            padding: 0.4rem 0.85rem !important;
            height: 34px !important;
            font-size: 0.78rem !important;
            letter-spacing: 0 !important;
          }
        }

        /* ── Hero section — responsive padding & text ──────────── */
        .lp-main {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          text-align: center;
          padding: 3.5rem 1.25rem;
          box-sizing: border-box;
        }
        @media (min-width: 480px) {
          .lp-main { padding: 4rem 1.5rem; }
        }
        @media (min-width: 768px) {
          .lp-main { padding: 5rem 1.5rem; }
        }
        @media (min-width: 1024px) {
          .lp-main { padding: 6rem 1.5rem; }
        }

        /* ── Hero heading — fluid type ─────────────────────────── */
        .lp-h1 {
          font-weight: 300;
          tracking-tight: tight;
          color: #FFFFFF;
          line-height: 1.14;
          margin-bottom: 1.25rem;
          /* fluid: 1.9rem at 320px → 3.75rem at 1024px */
          font-size: clamp(1.9rem, 7vw, 3.75rem);
          letter-spacing: -0.02em;
        }
        @media (min-width: 640px) {
          .lp-h1 { font-size: clamp(2.4rem, 6vw, 3.75rem); margin-bottom: 1.5rem; }
        }

        /* ── Hero description — mobile tightened ───────────────── */
        .lp-desc {
          color: #CBD5E1;
          font-weight: 300;
          line-height: 1.65;
          margin-bottom: 2rem;
          /* fluid: 0.9rem at 320px → 1.125rem at 640px+ */
          font-size: clamp(0.9rem, 2.5vw, 1.125rem);
          max-width: 90%;
        }
        @media (min-width: 480px) {
          .lp-desc { max-width: 36rem; }
        }

        /* ── Hero CTA row — always vertical on mobile ──────────── */
        .lp-cta-row {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
        }
        @media (min-width: 480px) {
          .lp-cta-row {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            width: auto;
            max-width: none;
            gap: 1rem;
          }
        }

        /* Hero primary button — full width on mobile */
        @media (max-width: 479px) {
          .lp-hero-primary {
            width: 100% !important;
            height: 48px !important;
            font-size: 0.875rem !important;
            padding: 0.75rem 1.5rem !important;
            justify-content: center !important;
          }
          .lp-hero-secondary {
            width: 100% !important;
            height: 48px !important;
            font-size: 0.875rem !important;
            padding: 0.75rem 1.5rem !important;
            justify-content: center !important;
          }
        }

        /* ── Trust strip — wraps on tiny screens ───────────────── */
        .lp-trust-strip {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .lp-trust-text {
          font-weight: 500;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          line-height: 1.5;
          text-align: center;
          font-size: clamp(0.6rem, 1.8vw, 0.75rem);
        }

        /* ── Footer — tighter on mobile ────────────────────────── */
        .lp-footer {
          position: relative;
          z-index: 10;
          background: rgba(2,6,20,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 1.5rem 1.25rem;
          text-align: center;
        }
        .lp-footer-brand {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        /* Ambient spheres — clamp width on mobile to avoid overflow */
        @media (max-width: 639px) {
          .lp-ambient-top {
            width: min(860px, 140vw) !important;
            height: 400px !important;
          }
          .lp-ambient-bottom {
            width: min(580px, 100vw) !important;
            height: min(580px, 100vw) !important;
          }
        }
      `}</style>

      <div
        className="lp-root-wrap min-h-screen flex flex-col relative select-none"
        style={{
          background: 'linear-gradient(175deg, #030817 0%, #061129 40%, #040D21 75%, #020612 100%)',
          color: '#F8FAFC',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── Top Navigation Bar ────────────────────────────────────────── */}
        <header className="lp-navbar lp-anim-nav sticky top-0 z-50 w-full">
          <div className="lp-navbar-inner">

            {/* Branding: ONCO SPHERE · CLINICAL INTELLIGENCE */}
            <div className="lp-brand">
              <img
                src={ICSRLogo}
                alt="Onco Sphere Logo"
                className="lp-brand-logo"
              />
              <div className="flex flex-col justify-center leading-none">
                <span className="lp-brand-name">Onco Sphere</span>
                <span className="lp-brand-sub">Clinical Intelligence</span>
              </div>
            </div>

            {/* Nav authentication controls */}
            <div className="lp-nav-buttons">
              {isAuthenticated ? (
                <Link to="/dashboard" className="lp-nav-signup">
                  <span>Dashboard</span>
                  <RiArrowRightLine size={14} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="lp-nav-signin">Sign In</Link>
                  <Link to="/register/apply" className="lp-nav-signup">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Central Hero Section ──────────────────────────────────────── */}
        <main className="lp-main">

          {/* Laboratory background textures */}
          <div className="lp-grid-bg absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="lp-scanlines absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="lp-ambient-top" aria-hidden="true" />
          <div className="lp-ambient-bottom" aria-hidden="true" />

          {/* CSS depth-of-field vignette + side depth gradients */}
          <div className="lp-vignette" aria-hidden="true" />
          <div className="lp-depth-left" aria-hidden="true" />
          <div className="lp-depth-right" aria-hidden="true" />

          {/* Full scientific laboratory animation canvas */}
          <MolecularCanvas />

          {/* Hero Content Container */}
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full">

            {/* Clinical Intelligence Badge */}
            <div className="lp-anim-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-400/25 bg-sky-500/10 backdrop-blur-md mb-6 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
              <RiShieldCheckLine size={12} className="text-sky-400 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-sky-300">
                Clinical Intelligence Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="lp-anim-h1 lp-h1 mb-5">
              Precision in Every Patient.
              <br />
              <span className="font-semibold bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-200 bg-clip-text text-transparent">
                Clarity in Every Protocol.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="lp-anim-p lp-desc">
              One intelligent platform connecting oncology workflows, clinical research and patient records.
            </p>

            {/* CTA Buttons */}
            <div className="lp-anim-cta lp-cta-row">
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="lp-hero-primary"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Sign in to Onco Sphere'}</span>
                <RiArrowRightLine size={17} className="lp-arrow shrink-0" />
              </Link>

              {!isAuthenticated && (
                <Link to="/register/apply" className="lp-hero-secondary">
                  Request Access
                </Link>
              )}
            </div>

            {/* Trust Indicator Strip */}
            <div className="lp-anim-strip lp-trust-strip">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse shrink-0 mt-0.5" />
              <span className="lp-trust-text">
                HIPAA-aware Architecture&nbsp;·&nbsp;Continuous PHI Audit&nbsp;·&nbsp;Institutional Oncology Use
              </span>
            </div>
          </div>
        </main>

        {/* ── Compact Footer ─────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-divider-line max-w-5xl mx-auto mb-5" />

          <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
            <div className="lp-footer-brand">
              <img
                src={ICSRLogo}
                alt=""
                aria-hidden="true"
                style={{ width: '18px', height: '18px', objectFit: 'contain', background: 'transparent' }}
              />
              <span className="text-xs font-bold text-slate-300 tracking-[0.1em] uppercase">
                Onco Sphere
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-[11px] font-semibold text-sky-400/80 tracking-[0.12em] uppercase">
                Clinical Intelligence
              </span>
            </div>

            <p className="text-[11px] font-normal text-slate-400 max-w-sm sm:max-w-lg leading-relaxed px-2">
              Institutional oncology research & clinical intelligence registry. Protected Health Information (PHI) access is strictly monitored and audited.
            </p>

            <p className="text-[10px] font-normal text-slate-500 tracking-wider">
              &copy; {new Date().getFullYear()} Onco Sphere — Oncology Intelligence. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
