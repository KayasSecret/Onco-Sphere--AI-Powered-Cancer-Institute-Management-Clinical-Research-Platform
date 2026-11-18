import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, resolving conflicts intelligently.
 * Required by shadcn/ui components.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate accurate age in years from a date string (YYYY-MM-DD or ISO).
 * Returns empty string if input is missing or invalid, or numeric age >= 0.
 */
export function calculateAge(dobString, { asNumber = false } = {}) {
  if (!dobString) return asNumber ? null : ''
  const birthDate = new Date(dobString)
  if (isNaN(birthDate.getTime())) return asNumber ? null : ''
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return asNumber ? age : age.toString()
}

/**
 * Format raw byte count into human-readable units (Bytes, KB, MB, GB).
 */
export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const ACCENT_PALETTES = {
  royal: { blue: '#3D6BC5', dark: '#2E56A8', light: '#5582D4' },
  cyan: { blue: '#0284C7', dark: '#0369A1', light: '#38BDF8' },
  indigo: { blue: '#4F46E5', dark: '#4338CA', light: '#818CF8' },
  teal: { blue: '#0D9488', dark: '#0F766E', light: '#2DD4BF' },
}

/**
 * Apply persisted theme mode, accent palette, font scale, and reduced-motion preference to DOM root.
 */
export function applyStoredAppearance() {
  const root = document.documentElement

  const theme = localStorage.getItem('theme') || 'light'
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  const accentKey = localStorage.getItem('helix_accent') || 'royal'
  const palette = ACCENT_PALETTES[accentKey] || ACCENT_PALETTES.royal
  root.style.setProperty('--color-blue', palette.blue)
  root.style.setProperty('--color-blue-dark', palette.dark)
  root.style.setProperty('--color-blue-light', palette.light)

  const fontScale = localStorage.getItem('helix_font_scale') || '15px'
  if (['14px', '15px', '16px'].includes(fontScale)) {
    root.style.fontSize = fontScale
  }

  const reducedMotion = localStorage.getItem('helix_reduced_motion') === 'true'
  if (reducedMotion) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }
}
