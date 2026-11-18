import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog'
import {
  RiCheckLine,
  RiCloseLine,
  RiBookOpenLine,
  RiCalendarLine,
  RiPhoneLine,
  RiLinkedinBoxLine,
  RiProfileLine,
  RiInformationLine,
  RiEyeLine,
  RiExternalLinkLine,
  RiDownload2Line,
  RiShieldCheckLine,
  RiMicroscopeLine,
  RiFilePdf2Line,
  RiBuilding2Line,
  RiGraduationCapLine,
  RiAwardLine,
  RiTimeLine,
  RiUserStarLine,
  RiFileTextLine,
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
  RiAlertLine,
  RiMailLine,
} from 'react-icons/ri'
import './AdminListPage.css'

export default function ApplicationReviewModal({
  user,
  open,
  onOpenChange,
  onApprove,
  onReject,
  processingApproval,
}) {
  // Reviewer session checklist state (tracks which attached docs the Super Admin has inspected)
  const [checkedDocs, setCheckedDocs] = useState({})
  // Inline preview URL state
  const [previewDoc, setPreviewDoc] = useState(null)
  // Inline confirmation step ('APPROVE' | 'REJECT' | null)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    setCheckedDocs({})
    setPreviewDoc(null)
    setConfirmAction(null)
  }, [user?.id, open])

  if (!user) return null

  const profile = user.researcher_profile
  const approvalStatus = user.is_approved || 'APPROVED'
  const appIdCode = `APP-ONCO-${String(user.id || 1).padStart(4, '0')}`

  const initials = (user.full_name || 'R')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const documentSlots = profile
    ? [
        {
          key: 'id_proof',
          label: 'Government ID Proof',
          category: 'Identity Credential',
          url: profile.id_proof_url,
        },
        {
          key: 'inst_id',
          label: 'Institutional ID Card',
          category: 'Affiliation Proof',
          url: profile.institutional_id_url,
        },
        {
          key: 'loi',
          label: 'Letter of Intent',
          category: 'Research Authorization',
          url: profile.letter_of_intent_url,
        },
        {
          key: 'pubs',
          label: 'Publications PDF',
          category: 'Academic Record',
          url: profile.publications_url,
        },
      ]
    : []

  const attachedDocs = documentSlots.filter((d) => Boolean(d.url))
  const reviewedCount = attachedDocs.filter((d) => checkedDocs[d.key]).length

  const toggleDocChecked = (key) => {
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getStatusBadgeConfig = (status) => {
    if (status === 'PENDING') {
      return {
        wrapper:
          'onco-status-pill-pending bg-amber-500/20 text-amber-200 border-amber-400/45',
        dot: 'bg-amber-400 animate-pulse',
        text: 'Pending Authorization',
      }
    }
    if (status === 'APPROVED') {
      return {
        wrapper: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/45',
        dot: 'bg-emerald-400',
        text: 'Authorized & Approved',
      }
    }
    return {
      wrapper: 'bg-rose-500/20 text-rose-200 border-rose-400/45',
      dot: 'bg-rose-400',
      text: 'Access Declined',
    }
  }

  const statusConfig = getStatusBadgeConfig(approvalStatus)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="onco-review-dialog max-w-5xl w-[95vw] max-h-[92vh] flex flex-col"
      >
        {/* Accessible hidden title for screen readers */}
        <DialogTitle className="sr-only">
          Researcher Access Application — {user.full_name}
        </DialogTitle>

        {/* ══════════════════════════════════════════════════════════════════
            1. DEEP NAVY CLINICAL AUTHORIZATION HEADER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="onco-review-hero shrink-0">
          {/* Decorative Molecular Lattice SVG Watermark */}
          <svg
            width="190"
            height="96"
            viewBox="0 0 190 96"
            fill="none"
            aria-hidden="true"
            className="absolute right-12 top-1/2 -translate-y-1/2 opacity-15 hidden lg:block pointer-events-none text-sky-300"
          >
            <polygon
              points="55,14 82,30 82,62 55,78 28,62 28,30"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <polygon
              points="109,14 136,30 136,62 109,78 82,62 82,30"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
            <circle cx="55" cy="14" r="3" fill="currentColor" />
            <circle cx="82" cy="30" r="3" fill="currentColor" />
            <circle cx="82" cy="62" r="3" fill="currentColor" />
            <circle cx="109" cy="14" r="3" fill="currentColor" />
            <circle cx="136" cy="46" r="3" fill="currentColor" />
          </svg>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="onco-review-avatar">{initials}</div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-400/15 text-sky-200 border border-sky-400/30">
                    <RiShieldCheckLine size={12} className="text-sky-300" />
                    {appIdCode}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/15">
                    Role: {user.role?.replace('_', ' ')}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                  {user.full_name}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <RiMailLine size={13} className="text-sky-300" />
                    {user.email}
                  </span>
                  {profile?.institution && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="inline-flex items-center gap-1 text-sky-200 font-medium">
                        <RiBuilding2Line size={13} />
                        {profile.institution}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Animated Approval Status Indicator + Close Button */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusConfig.wrapper}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                <span>{statusConfig.text}</span>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close application review modal"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <RiCloseLine size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. SCROLLABLE CLINICAL DOSSIER WORKSPACE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="onco-review-body flex-1 overflow-y-auto space-y-5 text-left">
          {profile ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ── PANEL 1: ACADEMIC DETAILS ────────────────────────────── */}
              <div className="onco-dossier-panel">
                <div className="onco-dossier-header">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-brand-blue dark:text-sky-400">
                      <RiBookOpenLine size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider">
                        Academic Details
                      </h3>
                      <p className="text-[10px] text-ink-secondary">
                        Credentials &amp; institutional standing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiBuilding2Line size={11} className="text-brand-blue dark:text-sky-400" />
                        Current Institution
                      </span>
                      <p className="text-xs font-bold text-ink-primary mt-0.5">
                        {profile.institution || 'N/A'}
                      </p>
                    </div>

                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiGraduationCapLine size={11} className="text-brand-blue dark:text-sky-400" />
                        Highest Qualification
                      </span>
                      <p className="text-xs font-bold text-ink-primary mt-0.5">
                        {profile.qualification || 'N/A'}
                      </p>
                    </div>

                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiAwardLine size={11} className="text-brand-blue dark:text-sky-400" />
                        Field of Specialization
                      </span>
                      <p className="text-xs font-semibold text-ink-primary mt-0.5">
                        {profile.specialization || 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="onco-dossier-field">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                          Designated Role
                        </span>
                        <p className="text-xs font-bold text-brand-navy dark:text-sky-300 mt-0.5">
                          {profile.researcher_role || 'N/A'}
                        </p>
                      </div>

                      <div className="onco-dossier-field">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                          Experience Level
                        </span>
                        <p className="text-xs font-bold font-mono text-ink-primary mt-0.5">
                          {profile.experience_years || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg bg-brand-blue/8 hover:bg-brand-blue/15 border border-brand-blue/25 text-xs font-bold text-brand-blue dark:text-sky-300 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <RiLinkedinBoxLine size={16} />
                        <span>Verify LinkedIn Profile</span>
                      </span>
                      <RiExternalLinkLine size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* ── PANEL 2: RESEARCH FOCUS ──────────────────────────────── */}
              <div className="onco-dossier-panel">
                <div className="onco-dossier-header">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <RiMicroscopeLine size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider">
                        Research Focus
                      </h3>
                      <p className="text-[10px] text-ink-secondary">
                        Oncology domain &amp; supervision
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="onco-dossier-field">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                      Primary Research Area
                    </span>
                    <p className="text-xs font-bold text-ink-primary mt-0.5">
                      {profile.research_area || 'N/A'}
                    </p>
                  </div>

                  <div className="onco-dossier-field">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block">
                      Cancer Type of Interest
                    </span>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {profile.cancer_interest || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiTimeLine size={11} /> Duration
                      </span>
                      <p className="text-xs font-bold text-ink-primary mt-0.5">
                        {profile.research_duration || 'N/A'}
                      </p>
                    </div>

                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiUserStarLine size={11} /> Supervisor
                      </span>
                      <p className="text-xs font-bold text-ink-primary mt-0.5 truncate" title={profile.supervisor_name}>
                        {profile.supervisor_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {profile.prior_work_details && (
                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                        Prior Work &amp; Publications Summary
                      </span>
                      <p className="text-xs text-ink-secondary leading-relaxed max-h-28 overflow-y-auto">
                        {profile.prior_work_details}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── PANEL 3: VERIFICATION DOCUMENTS & IDENTITY ───────────── */}
              <div className="onco-dossier-panel">
                <div className="onco-dossier-header">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <RiShieldCheckLine size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider">
                        Verification Documents
                      </h3>
                      <p className="text-[10px] text-ink-secondary">
                        Identity &amp; uploaded credentials
                      </p>
                    </div>
                  </div>

                  {attachedDocs.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                      {reviewedCount}/{attachedDocs.length} Checked
                    </span>
                  )}
                </div>

                <div className="p-3.5 space-y-2.5 flex-1">
                  {/* Personal Identity Mini Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiCalendarLine size={11} /> DOB &amp; Gender
                      </span>
                      <p className="text-xs font-bold text-ink-primary mt-0.5">
                        {profile.date_of_birth || 'N/A'}{' '}
                        <span className="text-ink-secondary font-medium">
                          ({profile.gender || 'N/A'})
                        </span>
                      </p>
                    </div>

                    <div className="onco-dossier-field">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1">
                        <RiPhoneLine size={11} /> Phone Contact
                      </span>
                      <p className="text-xs font-bold font-mono text-ink-primary mt-0.5">
                        {profile.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Attached Verification Files Dossier */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                        Submitted Credential Files ({attachedDocs.length})
                      </span>
                    </div>

                    {documentSlots.map((doc) => {
                      const isChecked = Boolean(checkedDocs[doc.key])
                      if (!doc.url) {
                        return (
                          <div
                            key={doc.key}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-surface-border bg-surface-base/40 text-xs opacity-65"
                          >
                            <span className="text-ink-secondary font-medium">{doc.label}</span>
                            <span className="text-[10px] font-mono text-ink-disabled uppercase">
                              Not Provided
                            </span>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={doc.key}
                          className={`onco-doc-card ${isChecked ? 'is-verified' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleDocChecked(doc.key)}
                              title={
                                isChecked
                                  ? 'Marked as reviewed'
                                  : 'Click to mark document as reviewed'
                              }
                              className="text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform shrink-0 cursor-pointer"
                            >
                              {isChecked ? (
                                <RiCheckboxCircleFill size={17} />
                              ) : (
                                <RiCheckboxBlankCircleLine
                                  size={17}
                                  className="text-ink-disabled hover:text-brand-blue"
                                />
                              )}
                            </button>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink-primary truncate">
                                {doc.label}
                              </p>
                              <p className="text-[10px] text-ink-secondary">
                                {isChecked ? 'Reviewed in session' : doc.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewDoc(
                                  previewDoc?.key === doc.key ? null : doc
                                )
                                setCheckedDocs((prev) => ({ ...prev, [doc.key]: true }))
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-surface-card hover:bg-brand-blue/10 text-brand-blue dark:text-sky-300 border border-surface-border transition-colors cursor-pointer"
                              title="Preview Document"
                            >
                              <RiEyeLine size={13} />
                              <span>Inspect</span>
                            </button>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                setCheckedDocs((prev) => ({ ...prev, [doc.key]: true }))
                              }
                              className="p-1.5 rounded-md bg-surface-card hover:bg-surface-hover text-ink-secondary hover:text-brand-blue border border-surface-border transition-colors"
                              title="Open / Download in new tab"
                            >
                              <RiExternalLinkLine size={13} />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* General Account Specifications (for standard Admin / Super Admin accounts) */
            <div className="onco-dossier-panel p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue dark:text-sky-400">
                  <RiProfileLine size={16} />
                </div>
                <span className="text-xs font-extrabold tracking-wider text-ink-primary uppercase">
                  System Account Specifications
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="onco-dossier-field">
                  <span className="text-[10px] text-ink-secondary uppercase font-bold block">
                    System Access Role
                  </span>
                  <span className="text-sm text-ink-primary font-extrabold mt-0.5 block">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="onco-dossier-field">
                  <span className="text-[10px] text-ink-secondary uppercase font-bold block">
                    Operational Status
                  </span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5 block">
                    {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="onco-dossier-field">
                  <span className="text-[10px] text-ink-secondary uppercase font-bold block">
                    Authorization State
                  </span>
                  <span className="text-sm text-ink-primary font-extrabold mt-0.5 block">
                    {approvalStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── INLINE INTERACTIVE DOCUMENT PREVIEW DRAWER ───────────────── */}
          {previewDoc && (
            <div className="onco-dossier-panel p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-surface-border pb-2.5">
                <div className="flex items-center gap-2">
                  <RiFilePdf2Line size={17} className="text-brand-blue dark:text-sky-400" />
                  <span className="text-xs font-extrabold text-ink-primary uppercase tracking-wider">
                    Document Preview — {previewDoc.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-blue text-white hover:bg-brand-blue-dark transition-colors"
                  >
                    <RiDownload2Line size={13} />
                    <span>Open Full Document</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="p-1 rounded-md text-ink-secondary hover:text-ink-primary hover:bg-surface-hover cursor-pointer"
                  >
                    <RiCloseLine size={16} />
                  </button>
                </div>
              </div>

              <div className="w-full h-72 rounded-lg overflow-hidden bg-slate-950 border border-surface-border flex items-center justify-center">
                {/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(previewDoc.url) ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.label}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.label}
                    className="w-full h-full bg-white"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── ACCESS REQUEST OBJECTIVE STATEMENT (HIGHLIGHTED SECTION) ─── */}
          {user.registration_reason && (
            <div className="onco-objective-banner">
              <div className="flex items-center gap-2 mb-1.5">
                <RiFileTextLine size={15} className="text-brand-blue dark:text-sky-400 shrink-0" />
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-brand-navy dark:text-sky-300">
                  Access Request Objective (Statement of Clinical &amp; Research Purpose)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-primary leading-relaxed italic font-medium">
                &ldquo;{user.registration_reason}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. AUTHORIZATION COMMAND FOOTER (WITH CONFIRMATION STEP)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="onco-review-footer shrink-0">
          {confirmAction ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-base border border-surface-border animate-fade-in">
              <div className="flex items-center gap-2.5 text-xs">
                <RiAlertLine
                  size={18}
                  className={
                    confirmAction === 'APPROVE'
                      ? 'text-emerald-600 shrink-0'
                      : 'text-rose-600 shrink-0'
                  }
                />
                <span className="font-semibold text-ink-primary">
                  {confirmAction === 'APPROVE'
                    ? `Confirm granting Onco Sphere access credentials to ${user.full_name}?`
                    : `Confirm rejecting the access application submitted by ${user.full_name}?`}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end shrink-0">
                <button
                  type="button"
                  disabled={!!processingApproval}
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover text-xs font-semibold text-ink-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!!processingApproval}
                  onClick={() =>
                    confirmAction === 'APPROVE' ? onApprove(user) : onReject(user)
                  }
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 ${
                    confirmAction === 'APPROVE'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {processingApproval ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {confirmAction === 'APPROVE' ? 'Authorizing…' : 'Rejecting…'}
                      </span>
                    </>
                  ) : (
                    <>
                      {confirmAction === 'APPROVE' ? (
                        <RiCheckLine size={15} />
                      ) : (
                        <RiCloseLine size={15} />
                      )}
                      <span>
                        {confirmAction === 'APPROVE'
                          ? 'Confirm Approval'
                          : 'Confirm Rejection'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="text-xs text-ink-secondary flex items-center gap-1.5">
                <RiInformationLine size={15} className="text-brand-blue dark:text-sky-400 shrink-0" />
                <span>
                  Verify institutional credentials and attached identification documents prior to authorization.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover text-xs font-semibold text-ink-primary transition-colors cursor-pointer"
                >
                  Close Viewer
                </button>

                {approvalStatus === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={!!processingApproval}
                      onClick={() => setConfirmAction('REJECT')}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      <RiCloseLine size={16} />
                      <span>Reject Request</span>
                    </button>

                    <button
                      type="button"
                      disabled={!!processingApproval}
                      onClick={() => setConfirmAction('APPROVE')}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60"
                    >
                      <RiCheckLine size={16} />
                      <span>Approve Access</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
