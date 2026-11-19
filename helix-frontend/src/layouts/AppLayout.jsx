import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  RiDashboardLine,
  RiUserHeartLine,
  RiUserSettingsLine,
  RiSettings4Line,
  RiLogoutBoxLine,
  RiMenuLine,
  RiMenuFoldLine,
  RiCloseLine,
  RiFileTextLine,
  RiSunLine,
  RiMoonLine,
  RiArrowDownSLine,
  RiUserLine,
  RiShieldCheckLine,
} from 'react-icons/ri'
import ICSRLogo from '../assets/ICSR-LOGO.png'
import { selectSidebarOpen, setSidebarOpen } from '../redux/slices/uiSlice'
import { selectUser, logoutThunk, getMeThunk } from '../redux/slices/authSlice'
import { Sheet, SheetContent } from '../components/ui/sheet'
import { toast } from 'sonner'
import './AppLayout.css'

// ── Navigation items — role-aware filtering happens in the component ─────────
const NAV_ITEMS = [
  {
    label: 'Onco Dashboard',
    icon: RiDashboardLine,
    to: '/dashboard',
    matchPrefixes: ['/dashboard'],
    roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
  },
  {
    label: 'Onco Register',
    icon: RiUserHeartLine,
    to: '/patients',
    matchPrefixes: ['/patients', '/visits'],
    roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
  },
  {
    label: 'Onco Receipt',
    icon: RiFileTextLine,
    to: '/reports',
    matchPrefixes: ['/reports'],
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    label: 'Onco Access',
    icon: RiUserSettingsLine,
    to: '/admin-management',
    matchPrefixes: ['/admin-management'],
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    label: 'Settings',
    icon: RiSettings4Line,
    to: '/settings',
    matchPrefixes: ['/settings'],
    roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
  },
]

const NAV_ITEM_PITCH = 52 // 46px height + 6px gap

// ── Sidebar Brand Header ─────────────────────────────────────────────────────
function SidebarBrand({ collapsed, isMobileDrawer, onClose }) {
  return (
    <div
      className="onco-sidebar-header"
      style={{ justifyContent: collapsed ? 'center' : 'space-between' }}
    >
      <Link to="/dashboard" className="onco-sidebar-brand">
        <img
          src={ICSRLogo}
          alt="Onco Sphere"
          style={{
            width: '34px',
            height: '34px',
            objectFit: 'contain',
            flexShrink: 0,
            background: 'transparent',
          }}
        />
        {!collapsed && (
          <div className="flex flex-col justify-center leading-none overflow-hidden">
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.025em',
                lineHeight: '1.15',
                whiteSpace: 'nowrap',
              }}
            >
              Onco Sphere
            </span>
            <span
              style={{
                fontSize: '0.53rem',
                fontWeight: 700,
                color: 'var(--color-blue)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginTop: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              Clinical Intelligence
            </span>
          </div>
        )}
      </Link>

      {!collapsed && (
        <button
          type="button"
          onClick={onClose}
          aria-label={isMobileDrawer ? 'Close navigation menu' : 'Collapse sidebar'}
          title={isMobileDrawer ? 'Close navigation menu' : 'Collapse sidebar'}
          className="onco-sidebar-collapse-btn"
        >
          {isMobileDrawer ? <RiCloseLine size={17} /> : <RiMenuFoldLine size={16} />}
        </button>
      )}
    </div>
  )
}

// ── Sidebar Content (Shared between Desktop & Mobile Drawer) ─────────────────
function SidebarContent({
  collapsed,
  isMobileDrawer = false,
  onClose,
  user,
  filteredNav,
  activeIndex,
  onLogout,
  onNavigate,
}) {
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false)
  const popoverRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setAvatarPopoverOpen(false)
      }
    }
    if (avatarPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [avatarPopoverOpen])

  useEffect(() => {
    if (!collapsed) setAvatarPopoverOpen(false)
  }, [collapsed])

  return (
    <aside
      className="onco-sidebar"
      style={{ width: collapsed ? 74 : 252 }}
    >
      {/* Brand Header */}
      <SidebarBrand collapsed={collapsed} isMobileDrawer={isMobileDrawer} onClose={onClose} />

      <div className="mx-3.5 h-px bg-surface-border/80 shrink-0" />

      {/* Navigation Track with Gliding Active Highlight */}
      <nav className="onco-nav-container" aria-label="Main Clinical Navigation">
        {!collapsed && (
          <div className="onco-nav-section-label">Clinical Modules</div>
        )}

        <div className="onco-nav-list">
          {/* Gliding Animated Active Indicator */}
          {activeIndex >= 0 && (
            <div
              className="onco-nav-glider"
              aria-hidden="true"
              style={{
                transform: `translateY(${activeIndex * NAV_ITEM_PITCH}px)`,
              }}
            />
          )}

          {filteredNav.map((item, idx) => {
            const Icon = item.icon
            const isActive = idx === activeIndex

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`onco-nav-link ${isActive ? 'is-active' : ''} ${
                  collapsed ? 'is-collapsed' : ''
                }`}
              >
                <div className="onco-nav-icon-box">
                  <Icon size={19} />
                </div>

                {!collapsed && (
                  <span className="onco-nav-label">{item.label}</span>
                )}

                {collapsed && (
                  <span className="onco-nav-tooltip">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Operator Footer */}
      <div className="onco-sidebar-footer" ref={popoverRef}>
        {collapsed ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setAvatarPopoverOpen((prev) => !prev)}
              className="onco-avatar-ring cursor-pointer hover:scale-105 transition-transform"
              title={user?.full_name || 'User Profile'}
              aria-label="User profile options"
            >
              {user?.photo_url ? (
                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.charAt(0) || 'U'
              )}
            </button>

            {avatarPopoverOpen && (
              <div
                className="onco-profile-dropdown"
                style={{ left: 'calc(100% + 12px)', right: 'auto', top: 'auto', bottom: '10px' }}
              >
                <div className="onco-dropdown-hero">
                  <p className="text-xs font-extrabold !text-white truncate">
                    {user?.full_name || 'Clinical Operator'}
                  </p>
                  <p className="text-[11px] text-sky-200/85 truncate mt-0.5">
                    {user?.email || user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPopoverOpen(false)
                      navigate('/settings')
                    }}
                    className="onco-dropdown-item"
                  >
                    <RiSettings4Line size={16} className="text-brand-blue" />
                    <span>Account &amp; Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPopoverOpen(false)
                      onLogout()
                    }}
                    className="onco-dropdown-item danger"
                  >
                    <RiLogoutBoxLine size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="onco-sidebar-user-card">
            <div className="relative shrink-0">
              <div className="onco-avatar-ring">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0) || 'U'
                )}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-card"
                title="Active session"
              />
            </div>

            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-ink-primary text-xs font-extrabold truncate leading-tight">
                {user?.full_name || 'Clinical Operator'}
              </p>
              <p className="text-brand-blue text-[10px] font-bold uppercase tracking-wider truncate mt-0.5">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="shrink-0 p-1.5 rounded-lg text-ink-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

// ── Main Application Layout ──────────────────────────────────────────────────
export default function AppLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarOpen = useSelector(selectSidebarOpen)
  const user = useSelector(selectUser)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  )
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  const profileMenuRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handleResize = (e) => {
      setIsDesktop(e.matches)
      if (e.matches) setMobileOpen(false)
    }
    setIsDesktop(mq.matches)
    mq.addEventListener('change', handleResize)
    return () => mq.removeEventListener('change', handleResize)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('helix_access_token')) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }
    dispatch(getMeThunk())
  }, [dispatch, navigate, location])

  // Keep quick-toggle icon synced if theme changes from Settings page
  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => setIsDark(root.classList.contains('dark'))
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Close topbar profile dropdown on outside click or Escape key
  useEffect(() => {
    function handleOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setProfileMenuOpen(false)
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [profileMenuOpen])

  const filteredNav = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(user?.role)),
    [user?.role]
  )

  // Determine exact active nav index (supports nested routes like /patients/:id or /reports/new)
  const activeIndex = useMemo(() => {
    const path = location.pathname
    return filteredNav.findIndex((item) =>
      item.matchPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
    )
  }, [filteredNav, location.pathname])

  const activeNavItem = activeIndex >= 0 ? filteredNav[activeIndex] : null
  const ActiveNavIcon = activeNavItem?.icon || RiDashboardLine

  const handleLogout = async () => {
    setProfileMenuOpen(false)
    await dispatch(logoutThunk())
    navigate('/login', { replace: true })
  }

  const handleToggleTheme = () => {
    const nextDark = !isDark
    const mode = nextDark ? 'dark' : 'light'
    localStorage.setItem('theme', mode)
    if (nextDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setIsDark(nextDark)
    toast.success(`Switched to ${nextDark ? 'Sleek Dark' : 'Classic Light'} interface.`)
  }

  const closeSidebar = () => dispatch(setSidebarOpen(false))
  const openSidebar = () => dispatch(setSidebarOpen(true))

  // Single unified sidebar-open state across desktop and mobile/tablet
  const isNavOpen = isDesktop ? sidebarOpen : mobileOpen
  const handleOpenNav = () => {
    if (isDesktop) {
      openSidebar()
    } else {
      setMobileOpen(true)
    }
  }

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      {/* ── Desktop Futuristic Left Sidebar ──────────────────────────────── */}
      <div className="hidden lg:flex shrink-0 h-full">
        <SidebarContent
          collapsed={!sidebarOpen}
          onClose={closeSidebar}
          user={user}
          filteredNav={filteredNav}
          activeIndex={activeIndex}
          onLogout={handleLogout}
        />
      </div>

      {/* ── Mobile Slide-Out Navigation Drawer ───────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[252px] border-0" hideClose>
          <SidebarContent
            collapsed={false}
            isMobileDrawer
            onClose={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
            user={user}
            filteredNav={filteredNav}
            activeIndex={activeIndex}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* ── Right Main Workspace Column ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Floating Glassmorphic Top Navigation Bar */}
        <div className="onco-topbar-wrap no-print">
          <header className="onco-topbar">
            {/* Left: Single Unified Hamburger Trigger (only when closed) + Brand / Context */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {!isNavOpen && (
                <button
                  type="button"
                  onClick={handleOpenNav}
                  aria-label="Open navigation menu"
                  title="Open navigation menu"
                  className="inline-flex onco-topbar-icon-btn shrink-0"
                >
                  <RiMenuLine size={19} />
                </button>
              )}

              {/* Mobile / Tablet Brand Mark */}
              <Link to="/dashboard" className="flex lg:hidden items-center gap-2.5 min-w-0">
                <img
                  src={ICSRLogo}
                  alt="Onco Sphere"
                  style={{
                    width: '28px',
                    height: '28px',
                    objectFit: 'contain',
                    flexShrink: 0,
                    background: 'transparent',
                  }}
                />
                <div className="flex flex-col justify-center leading-none min-w-0">
                  <span className="text-ink-primary font-extrabold text-sm tracking-tight truncate">
                    Onco Sphere
                  </span>
                  <span
                    className="hidden xs:block"
                    style={{
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      color: 'var(--color-blue)',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginTop: '2px',
                    }}
                  >
                    Clinical Intelligence
                  </span>
                </div>
              </Link>

              {/* Desktop Active Workspace Indicator Pill */}
              <div className="hidden lg:flex items-center gap-3 min-w-0">
                {activeNavItem && (
                  <div className="onco-topbar-module-pill">
                    <ActiveNavIcon size={15} className="text-brand-blue shrink-0" />
                    <span className="text-xs font-extrabold text-ink-primary tracking-tight">
                      {activeNavItem.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Theme Quick-Switch & Interactive Operator Profile Dropdown */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleTheme}
                aria-label={isDark ? 'Switch to Classic Light theme' : 'Switch to Sleek Dark theme'}
                title={isDark ? 'Switch to Classic Light' : 'Switch to Sleek Dark'}
                className="inline-flex onco-topbar-icon-btn"
              >
                {isDark ? (
                  <RiSunLine size={17} className="text-amber-400" />
                ) : (
                  <RiMoonLine size={17} className="text-brand-navy" />
                )}
              </button>

              {/* Profile Trigger + Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  className="onco-profile-trigger"
                >
                  <div className="relative">
                    <div className="onco-avatar-ring">
                      {user?.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-card" />
                  </div>

                  <div className="hidden sm:flex flex-col items-start text-left leading-tight pr-1">
                    <span className="text-xs font-extrabold text-ink-primary max-w-[130px] truncate">
                      {user?.full_name || 'Operator'}
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-brand-blue">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>

                  <RiArrowDownSLine
                    size={16}
                    className={`hidden sm:block text-ink-secondary transition-transform duration-200 ${
                      profileMenuOpen ? 'rotate-180 text-brand-blue' : ''
                    }`}
                  />
                </button>

                {profileMenuOpen && (
                  <div className="onco-profile-dropdown" role="menu">
                    <div className="onco-dropdown-hero">
                      <div className="flex items-center gap-2.5">
                        <div className="onco-avatar-ring !w-10 !h-10 !text-sm">
                          {user?.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user?.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold !text-white truncate">
                            {user?.full_name || 'Clinical Operator'}
                          </p>
                          <p className="text-[11px] text-sky-200/85 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/12 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                        <RiShieldCheckLine size={12} />
                        <span>{user?.role?.replace('_', ' ')} · Audited</span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          navigate('/settings')
                        }}
                        className="onco-dropdown-item"
                      >
                        <RiUserLine size={16} className="text-brand-blue" />
                        <span>Account Profile Overview</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          navigate('/settings')
                        }}
                        className="onco-dropdown-item"
                      >
                        <RiSettings4Line size={16} className="text-brand-blue" />
                        <span>System Preferences &amp; Theme</span>
                      </button>

                      <div className="my-1 h-px bg-surface-border" />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="onco-dropdown-item danger"
                      >
                        <RiLogoutBoxLine size={16} />
                        <span>Sign Out of Onco Sphere</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
