import { useEffect, useState, useCallback } from 'react'
import {
  RiCalendarLine, RiCalendarCheckLine, RiCheckboxCircleLine, RiTimeLine,
  RiUserLine, RiBuilding2Line, RiAddLine, RiSearchLine,
  RiRefreshLine, RiAlertLine, RiDeleteBin7Line, RiCapsuleLine,
  RiHeartPulseLine, RiStethoscopeLine,
  RiCheckLine, RiArrowRightLine,
} from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'
import VisitStatusBadge from './VisitStatusBadge'
import VisitTypeBadge from './VisitTypeBadge'
import { VISIT_TYPES, VISIT_STATUSES, DEPARTMENTS } from '@/config/visitConstants'
import visitService from '@/services/visitService'
import { toast } from 'sonner'

export default function PatientVisitsSection({ patient, patientId: propPatientId, isWritable }) {
  const patientId = propPatientId || patient?.id

  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [logModalOpen, setLogModalOpen] = useState(false)
  const [savingVisit, setSavingVisit] = useState(false)
  const [newVisit, setNewVisit] = useState({
    visit_type: 'Follow-up',
    department: patient?.department || 'Oncology',
    doctor_name: patient?.assigned_doctor || '',
    notes: '',
    advice_text: '',
    next_appointment_note: '',
  })

  const [activeVisitModal, setActiveVisitModal] = useState(null)
  const [modalDetails, setModalDetails] = useState({
    symptoms: [],
    investigations: [],
    prescriptions: [],
    treatments: [],
    followup: null,
  })
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [addingSymptom, setAddingSymptom] = useState(false)
  const [savingSymptom, setSavingSymptom] = useState(false)
  const [symForm, setSymForm] = useState({ name: '', severity_score: 5, patient_note: '' })
  const [addingRx, setAddingRx] = useState(false)
  const [savingRx, setSavingRx] = useState(false)
  const [rxForm, setRxForm] = useState({ name: '', dose: '', frequency: '', duration: '', instructions: '' })
  const [addingAdvice, setAddingAdvice] = useState(false)
  const [savingAdvice, setSavingAdvice] = useState(false)
  const [adviceText, setAdviceText] = useState('')

  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadVisits = useCallback(async () => {
    if (!patientId) return
    setLoading(true)
    setError(null)
    try {
      const res = await visitService.getPatientVisits(patientId, { per_page: 100 })
      const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      items.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
      setVisits(items)
    } catch {
      setError('Failed to load clinical visits. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadVisits()
  }, [loadVisits])

  const openVisitDetails = async (visit) => {
    setActiveVisitModal(visit)
    setLoadingDetails(true)
    try {
      const [s, inv, rx, tr, fu] = await Promise.allSettled([
        visitService.getSymptoms(visit.id),
        visitService.getInvestigations(visit.id),
        visitService.getPrescriptions(visit.id),
        visitService.getTreatments(visit.id),
        visitService.getFollowUp(visit.id),
      ])
      setModalDetails({
        symptoms: s.status === 'fulfilled' ? s.value.data || [] : [],
        investigations: inv.status === 'fulfilled' ? inv.value.data || [] : [],
        prescriptions: rx.status === 'fulfilled' ? rx.value.data || [] : [],
        treatments: tr.status === 'fulfilled' ? tr.value.data || [] : [],
        followup: fu.status === 'fulfilled' ? fu.value.data || null : null,
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleSaveVisit = async (e) => {
    e.preventDefault()
    if (!newVisit.visit_type) {
      toast.error('Please select a visit type.')
      return
    }
    setSavingVisit(true)
    try {
      const scheduled_at = new Date().toISOString()
      const res = await visitService.createVisit({
        patient_id: patientId,
        department: newVisit.department || patient?.department || 'Oncology',
        doctor_name: newVisit.doctor_name || patient?.assigned_doctor || 'Doctor',
        visit_type: newVisit.visit_type,
        scheduled_at,
        notes: newVisit.notes || undefined,
      })

      const createdId = res.data?.id

      if (createdId && newVisit.advice_text.trim()) {
        try {
          await visitService.setFollowUp(createdId, {
            advice_text: newVisit.advice_text.trim(),
            next_appointment_note: newVisit.next_appointment_note || undefined,
          })
        } catch { }
      }

      toast.success('Visit record logged successfully.')
      setLogModalOpen(false)
      setNewVisit({
        visit_type: 'Follow-up',
        department: patient?.department || 'Oncology',
        doctor_name: patient?.assigned_doctor || '',
        notes: '',
        advice_text: '',
        next_appointment_note: '',
      })
      loadVisits()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to log visit record.')
    } finally {
      setSavingVisit(false)
    }
  }
  const handleUpdateStatus = async (visitId, newStatus) => {
    try {
      await visitService.updateVisitStatus(visitId, newStatus)
      toast.success(`Visit marked as ${newStatus}.`)
      loadVisits()
      if (activeVisitModal?.id === visitId) {
        setActiveVisitModal((p) => ({ ...p, status: newStatus }))
      }
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleCheckIn = async (visitId) => {
    try {
      await visitService.checkIn(visitId)
      toast.success('Patient checked in for visit.')
      loadVisits()
      if (activeVisitModal?.id === visitId) {
        setActiveVisitModal((p) => ({ ...p, status: 'Checked In' }))
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-in failed.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await visitService.deleteVisit(deleteId)
      toast.success('Visit record deleted.')
      setDeleteId(null)
      if (activeVisitModal?.id === deleteId) setActiveVisitModal(null)
      loadVisits()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete visit.')
    } finally {
      setDeleting(false)
    }
  }

  const handleAddSymptom = async (e) => {
    e.preventDefault()
    if (!symForm.name.trim() || !activeVisitModal || savingSymptom) return
    setSavingSymptom(true)
    try {
      const label = symForm.severity_score <= 3 ? 'Mild' : symForm.severity_score <= 6 ? 'Moderate' : 'Severe'
      const res = await visitService.addSymptom(activeVisitModal.id, {
        name: symForm.name.trim(),
        severity_score: parseInt(symForm.severity_score),
        severity_label: label,
        patient_note: symForm.patient_note.trim() || undefined,
        recorded_by_role: 'CLINICAL',
      })
      setModalDetails((p) => ({ ...p, symptoms: [...p.symptoms, res.data] }))
      toast.success('Symptom recorded.')
      setSymForm({ name: '', severity_score: 5, patient_note: '' })
      setAddingSymptom(false)
    } catch {
      toast.error('Failed to save symptom.')
    } finally {
      setSavingSymptom(false)
    }
  }

  const handleAddPrescription = async (e) => {
    e.preventDefault()
    if (!rxForm.name.trim() || !activeVisitModal || savingRx) return
    setSavingRx(true)
    try {
      const res = await visitService.addPrescription(activeVisitModal.id, {
        medicines: [
          {
            name: rxForm.name.trim(),
            dose: rxForm.dose || '',
            frequency: rxForm.frequency || '',
            duration: rxForm.duration || '',
          },
        ],
        instructions: rxForm.instructions.trim() || undefined,
      })
      setModalDetails((p) => ({ ...p, prescriptions: [res.data, ...p.prescriptions] }))
      toast.success('Prescription added.')
      setRxForm({ name: '', dose: '', frequency: '', duration: '', instructions: '' })
      setAddingRx(false)
    } catch {
      toast.error('Failed to add prescription.')
    } finally {
      setSavingRx(false)
    }
  }

  const handleSaveAdvice = async (e) => {
    e.preventDefault()
    if (!adviceText.trim() || !activeVisitModal || savingAdvice) return
    setSavingAdvice(true)
    try {
      const res = await visitService.setFollowUp(activeVisitModal.id, {
        advice_text: adviceText.trim(),
      })
      setModalDetails((p) => ({ ...p, followup: res.data }))
      toast.success('Doctor advice updated.')
      setAddingAdvice(false)
    } catch {
      toast.error('Failed to update advice.')
    } finally {
      setSavingAdvice(false)
    }
  }

  const totalVisits = visits.length
  const upcomingCount = visits.filter((v) => ['Scheduled', 'Checked In', 'In Consultation'].includes(v.status)).length
  const completedCount = visits.filter((v) => v.status === 'Completed').length

  const todayStr = new Date().toISOString().split('T')[0]
  const todayVisits = visits.filter((v) => (v.scheduled_at || '').startsWith(todayStr))
  const spotlightVisit =
    visits.find((v) => v.status === 'In Consultation') ||
    visits.find((v) => v.status === 'Checked In') ||
    todayVisits[0] ||
    visits.find((v) => v.status === 'Scheduled') ||
    null
  const isToday = spotlightVisit && (spotlightVisit.scheduled_at || '').startsWith(todayStr)

  const filteredVisits = visits.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (v.visit_type || '').toLowerCase().includes(q) ||
      (v.doctor_name || '').toLowerCase().includes(q) ||
      (v.visit_code || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-5">
      {/* Header & Stats Card */}
      <Card className="onco-prof-card border-0">
        <CardHeader className="pb-3 border-b border-surface-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/10 dark:bg-sky-500/15 flex items-center justify-center text-brand-blue dark:text-sky-400 shrink-0">
                <RiCalendarLine size={17} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-ink-primary uppercase tracking-wider">
                  Clinical Visits &amp; Consultations
                </CardTitle>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Record and manage clinical visits, prescriptions, and follow-up care for {patient?.full_name}.
                </p>
              </div>
            </div>
            {isWritable && (
              <Button
                size="sm"
                onClick={() => setLogModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 h-9 px-4 rounded-lg shadow-sm shrink-0 cursor-pointer"
              >
                <RiAddLine size={16} /> Schedule Visit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="onco-data-tile border-t-2 border-t-indigo-500">
              <p className="text-[10px] uppercase font-bold tracking-wider text-ink-secondary">Total Visits</p>
              <p className="text-2xl font-extrabold text-ink-primary tabular-nums mt-1">{totalVisits}</p>
            </div>
            <div className="onco-data-tile border-t-2 border-t-blue-500">
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-400">Scheduled / Active</p>
              <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tabular-nums mt-1">{upcomingCount}</p>
            </div>
            <div className="onco-data-tile border-t-2 border-t-emerald-500">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">Completed</p>
              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums mt-1">{completedCount}</p>
            </div>
            <div className="onco-data-tile border-t-2 border-t-cyan-500">
              <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-700 dark:text-cyan-400">Today&apos;s Visit</p>
              <p className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums mt-1">
                {todayVisits.length > 0 ? `${todayVisits.length} Active` : 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active or Next Visit Spotlight */}
      {spotlightVisit && (
        <Card className={`onco-prof-card border ${isToday || spotlightVisit.status === 'Checked In' || spotlightVisit.status === 'In Consultation' ? 'border-cyan-400/50 bg-cyan-50/20 dark:bg-cyan-900/10' : 'border-brand-blue/30'}`}>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-lg shadow-xs ${isToday ? 'bg-cyan-500 text-white' : 'bg-brand-blue text-white'}`}>
                  <RiCalendarCheckLine size={17} />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider">
                    {isToday ? "Today's Appointment" : spotlightVisit.status === 'Checked In' ? 'Checked In — Awaiting Doctor' : spotlightVisit.status === 'In Consultation' ? 'Currently In Consultation' : 'Upcoming Scheduled Visit'}
                  </h4>
                  <p className="text-xs text-ink-secondary font-medium">
                    {new Date(spotlightVisit.scheduled_at).toLocaleString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <VisitTypeBadge type={spotlightVisit.visit_type} />
                <VisitStatusBadge status={spotlightVisit.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="onco-data-tile">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary block">Doctor</span>
                <span className="font-bold text-ink-primary">{spotlightVisit.doctor_name || 'Unassigned'}</span>
              </div>
              <div className="onco-data-tile">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary block">Department</span>
                <span className="font-bold text-ink-primary">{spotlightVisit.department}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border/60">
              <div className="flex items-center gap-2">
                {spotlightVisit.status === 'Scheduled' && isWritable && (
                  <Button
                    size="sm"
                    onClick={() => handleCheckIn(spotlightVisit.id)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8 flex items-center gap-1 rounded-lg cursor-pointer"
                  >
                    <RiCheckboxCircleLine size={14} /> Check In Patient
                  </Button>
                )}
                {spotlightVisit.status === 'Checked In' && isWritable && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(spotlightVisit.id, 'In Consultation')}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 flex items-center gap-1 rounded-lg cursor-pointer"
                  >
                    <RiStethoscopeLine size={14} /> Start Consultation
                  </Button>
                )}
                {spotlightVisit.status === 'In Consultation' && isWritable && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(spotlightVisit.id, 'Completed')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1 rounded-lg cursor-pointer"
                  >
                    <RiCheckLine size={14} /> Mark Completed
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openVisitDetails(spotlightVisit)}
                className="text-xs h-8 rounded-lg border-surface-border text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 cursor-pointer"
              >
                View / Edit Clinical Details <RiArrowRightLine size={13} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visits History Section */}
      <Card className="onco-prof-card border-0">
        <CardHeader className="pb-3 border-b border-surface-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink-primary uppercase tracking-wider flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <RiTimeLine size={15} />
              </div>
              <span>Visit History ({filteredVisits.length})</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-44 md:w-56">
                <RiSearchLine className="absolute left-2.5 top-2.5 text-ink-disabled pointer-events-none" size={14} />
                <Input
                  placeholder="Filter by type, doctor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8 rounded-lg bg-surface-base/60"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-xs h-8 rounded-lg">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {VISIT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadVisits}
                className="p-2 h-8 text-ink-secondary hover:text-brand-blue rounded-lg cursor-pointer"
                title="Refresh visits"
              >
                <RiRefreshLine size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <RiAlertLine size={28} className="mx-auto text-status-critical mb-2" />
              <p className="text-sm font-semibold text-ink-primary">{error}</p>
              <Button size="sm" variant="outline" onClick={loadVisits} className="mt-3 text-xs">
                Retry
              </Button>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-surface-border rounded-xl bg-surface-base/30">
              <RiCalendarLine size={34} className="mx-auto text-ink-disabled mb-2 opacity-50" />
              <p className="text-sm font-semibold text-ink-secondary">
                {visits.length === 0 ? 'No clinical visits recorded for this patient yet.' : 'No visits match your filter.'}
              </p>
              <p className="text-xs text-ink-disabled mt-1">
                {isWritable
                  ? "Click 'Schedule Visit' above to record a new visit."
                  : 'Visits recorded by clinical staff will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.map((visit) => {
                const scheduledDate = new Date(visit.scheduled_at)
                return (
                  <div
                    key={visit.id}
                    className="onco-data-tile p-4 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-ink-primary flex items-center gap-1">
                          <RiCalendarLine size={13} className="text-brand-blue" />
                          {scheduledDate.toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-ink-disabled flex items-center gap-0.5">
                          <RiTimeLine size={11} />
                          {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <VisitTypeBadge type={visit.visit_type} />
                        <span className="text-[10px] font-mono text-ink-disabled bg-surface-card px-1.5 py-0.5 rounded border border-surface-border">
                          {visit.visit_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <VisitStatusBadge status={visit.status} />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 text-ink-secondary">
                          <span className="flex items-center gap-1">
                            <RiUserLine size={12} className="text-ink-disabled" />
                            {visit.doctor_name || 'Doctor Unassigned'}
                          </span>
                          <span className="flex items-center gap-1">
                            <RiBuilding2Line size={12} className="text-ink-disabled" />
                            {visit.department}
                          </span>
                        </div>
                        {visit.notes && (
                          <p className="text-xs text-ink-secondary line-clamp-2">
                            Notes: {visit.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openVisitDetails(visit)}
                          className="text-xs h-7 px-2.5 border-surface-border text-brand-blue hover:text-brand-blue-dark"
                        >
                          Clinical Details
                        </Button>

                        {isWritable && (
                          <>
                            <Select
                              value={visit.status}
                              onValueChange={(val) => handleUpdateStatus(visit.id, val)}
                            >
                              <SelectTrigger className="text-[11px] h-7 w-28 border-surface-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VISIT_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <button
                              type="button"
                              onClick={() => setDeleteId(visit.id)}
                              className="p-1.5 text-ink-secondary hover:text-status-critical hover:bg-status-critical-bg rounded transition-colors"
                              title="Delete visit"
                            >
                              <RiDeleteBin7Line size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Log / Schedule Visit Dialog */}
      <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
        <DialogContent className="
          max-w-xl
          max-h-[90vh]
          overflow-y-auto
          bg-surface-base
          border
          border-surface-border
          text-ink-primary
          shadow-xl
        ">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-ink-primary flex items-center gap-2">
              <RiCalendarLine className="text-brand-blue" />
              Log Clinical Visit — {patient?.full_name} ({patient?.patient_code})
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveVisit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-secondary">Visit Type *</label>
                <Select
                  value={newVisit.visit_type}
                  onValueChange={(v) => setNewVisit((p) => ({ ...p, visit_type: v }))}
                >
                  <SelectTrigger className="text-xs bg-surface-card border-surface-border text-ink-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-secondary">Department *</label>
                <Select
                  value={newVisit.department}
                  onValueChange={(v) => setNewVisit((p) => ({ ...p, department: v }))}
                >
                  <SelectTrigger className="text-xs bg-surface-card border-surface-border text-ink-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-secondary">Doctor Name</label>
                <Input
                  value={newVisit.doctor_name}
                  onChange={(e) => setNewVisit((p) => ({ ...p, doctor_name: e.target.value }))}
                  placeholder="Attending doctor"
                  className="text-xs"
                />
              </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-secondary">Clinical Examination Notes</label>
              <Textarea
                rows={2}
                value={newVisit.notes}
                onChange={(e) => setNewVisit((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Clinical observations, vital signs, physical exam notes…"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-secondary">Doctor&apos;s Advice &amp; Follow-up Instructions</label>
              <Textarea
                rows={2}
                value={newVisit.advice_text}
                onChange={(e) => setNewVisit((p) => ({ ...p, advice_text: e.target.value }))}
                placeholder="Diet, hydration, alert symptoms, or follow-up schedule…"
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingVisit}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {savingVisit ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  'Save Visit Record'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Visit Complete Clinical Details Viewer */}
      {activeVisitModal && (
        <Dialog open={!!activeVisitModal} onOpenChange={(open) => { if (!open) setActiveVisitModal(null) }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-surface-border pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DialogTitle className="text-base font-bold text-ink-primary flex items-center gap-2">
                  <RiStethoscopeLine className="text-brand-blue" />
                  Visit Details — {activeVisitModal.visit_code}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <VisitTypeBadge type={activeVisitModal.visit_type} />
                  <VisitStatusBadge status={activeVisitModal.status} />
                </div>
              </div>
              <p className="text-xs text-ink-secondary mt-1">
                Scheduled for {new Date(activeVisitModal.scheduled_at).toLocaleString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })} &bull; Dr. {activeVisitModal.doctor_name || 'Unassigned'} ({activeVisitModal.department})
              </p>
            </DialogHeader>

            {loadingDetails ? (
              <div className="py-10 space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ) : (
              <div className="space-y-5 pt-3">
                {activeVisitModal.notes && (
                  <div className="p-3 bg-surface-base rounded-lg border border-surface-border text-xs">
                    <span className="font-bold text-ink-secondary uppercase text-[10px]">Clinical Notes</span>
                    <p className="text-xs text-ink-primary whitespace-pre-wrap mt-0.5">{activeVisitModal.notes}</p>
                  </div>
                )}

                {/* Symptoms Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                      <RiHeartPulseLine className="text-red-500" size={14} /> Symptoms ({modalDetails.symptoms.length})
                    </h5>
                    {isWritable && !addingSymptom && (
                      <Button size="sm" variant="ghost" onClick={() => setAddingSymptom(true)} className="text-[11px] h-6 px-2 text-brand-blue">
                        <RiAddLine size={12} /> Add Symptom
                      </Button>
                    )}
                  </div>

                  {addingSymptom && (
                    <form onSubmit={handleAddSymptom} className="p-3 bg-surface-base rounded-lg border border-brand-blue/30 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Symptom name (e.g. Nausea, Pain)"
                          value={symForm.name}
                          onChange={(e) => setSymForm((p) => ({ ...p, name: e.target.value }))}
                          className="text-xs"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-ink-secondary shrink-0">Severity (1-10):</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={symForm.severity_score}
                            onChange={(e) => setSymForm((p) => ({ ...p, severity_score: e.target.value }))}
                            className="text-xs w-16"
                          />
                        </div>
                      </div>
                      <Input
                        placeholder="Patient description / note"
                        value={symForm.patient_note}
                        onChange={(e) => setSymForm((p) => ({ ...p, patient_note: e.target.value }))}
                        className="text-xs"
                      />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => setAddingSymptom(false)} className="text-[11px] h-7">
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={savingSymptom} className="text-[11px] h-7 bg-brand-blue text-white flex items-center gap-1.5">
                          {savingSymptom ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Saving…</span>
                            </>
                          ) : (
                            'Save Symptom'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {modalDetails.symptoms.length === 0 && !addingSymptom ? (
                    <p className="text-xs text-ink-disabled italic">No symptoms recorded for this visit.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {modalDetails.symptoms.map((s) => (
                        <div key={s.id} className="p-2.5 bg-surface-card rounded border border-surface-border flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-ink-primary">{s.name}</span>
                            {s.patient_note && <span className="text-ink-secondary text-xs italic ml-2">&ldquo;{s.patient_note}&rdquo;</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.severity_score <= 3 ? 'bg-green-100 text-green-700' :
                              s.severity_score <= 6 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            Severity {s.severity_score}/10 ({s.severity_label || 'Recorded'})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescriptions Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                      <RiCapsuleLine className="text-brand-blue" size={14} /> Prescriptions ({modalDetails.prescriptions.length})
                    </h5>
                    {isWritable && !addingRx && (
                      <Button size="sm" variant="ghost" onClick={() => setAddingRx(true)} className="text-[11px] h-6 px-2 text-brand-blue">
                        <RiAddLine size={12} /> Add Medicine
                      </Button>
                    )}
                  </div>

                  {addingRx && (
                    <form onSubmit={handleAddPrescription} className="p-3 bg-surface-base rounded-lg border border-brand-blue/30 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Input
                          placeholder="Medicine name"
                          value={rxForm.name}
                          onChange={(e) => setRxForm((p) => ({ ...p, name: e.target.value }))}
                          className="text-xs"
                          autoFocus
                        />
                        <Input
                          placeholder="Dose (e.g. 500mg)"
                          value={rxForm.dose}
                          onChange={(e) => setRxForm((p) => ({ ...p, dose: e.target.value }))}
                          className="text-xs"
                        />
                        <Input
                          placeholder="Frequency (e.g. BD)"
                          value={rxForm.frequency}
                          onChange={(e) => setRxForm((p) => ({ ...p, frequency: e.target.value }))}
                          className="text-xs"
                        />
                        <Input
                          placeholder="Duration (e.g. 7 days)"
                          value={rxForm.duration}
                          onChange={(e) => setRxForm((p) => ({ ...p, duration: e.target.value }))}
                          className="text-xs"
                        />
                      </div>
                      <Input
                        placeholder="Instructions (e.g. After food)"
                        value={rxForm.instructions}
                        onChange={(e) => setRxForm((p) => ({ ...p, instructions: e.target.value }))}
                        className="text-xs"
                      />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => setAddingRx(false)} className="text-[11px] h-7">
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={savingRx} className="text-[11px] h-7 bg-brand-blue text-white flex items-center gap-1.5">
                          {savingRx ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Saving…</span>
                            </>
                          ) : (
                            'Save Prescription'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {modalDetails.prescriptions.length === 0 && !addingRx ? (
                    <p className="text-xs text-ink-disabled italic">No prescriptions recorded for this visit.</p>
                  ) : (
                    <div className="space-y-2">
                      {modalDetails.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-3 bg-surface-card rounded border border-surface-border text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-ink-secondary">
                            <span>Prescribed by: {rx.prescribing_doctor_name || 'Doctor'}</span>
                            <span>{new Date(rx.prescribed_at).toLocaleDateString('en-IN')}</span>
                          </div>
                          {(rx.medicines || []).map((m, idx) => (
                            <div key={idx} className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-primary">
                              <span className="font-bold">{m.name}</span>
                              {m.dose && <span className="text-ink-secondary">({m.dose})</span>}
                              {m.frequency && <span className="bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded text-[10px]">{m.frequency}</span>}
                              {m.duration && <span className="text-ink-disabled text-[10px]">for {m.duration}</span>}
                            </div>
                          ))}
                          {rx.instructions && (
                            <p className="text-[11px] text-ink-secondary italic bg-surface-base p-1.5 rounded">
                              Instructions: {rx.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Doctor's Advice & Follow-up */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
                      <RiCheckboxCircleLine className="text-green-600" size={14} /> Doctor&apos;s Advice &amp; Follow-up
                    </h5>
                    {isWritable && !addingAdvice && (
                      <Button size="sm" variant="ghost" onClick={() => { setAdviceText(modalDetails.followup?.advice_text || ''); setAddingAdvice(true) }} className="text-[11px] h-6 px-2 text-brand-blue">
                        {modalDetails.followup ? 'Edit Advice' : 'Add Advice'}
                      </Button>
                    )}
                  </div>

                  {addingAdvice ? (
                    <form onSubmit={handleSaveAdvice} className="p-3 bg-surface-base rounded-lg border border-brand-blue/30 space-y-2">
                      <Textarea
                        rows={2}
                        placeholder="Enter doctor's clinical advice, diet, hydration, warning signs…"
                        value={adviceText}
                        onChange={(e) => setAdviceText(e.target.value)}
                        className="text-xs"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => setAddingAdvice(false)} className="text-[11px] h-7">
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={savingAdvice} className="text-[11px] h-7 bg-brand-blue text-white flex items-center gap-1.5">
                          {savingAdvice ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Saving…</span>
                            </>
                          ) : (
                            'Save Advice'
                          )}
                        </Button>
                      </div>
                    </form>
                  ) : modalDetails.followup?.advice_text ? (
                    <div className="p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-lg text-xs space-y-1">
                      <p className="text-ink-primary whitespace-pre-wrap leading-relaxed">
                        {modalDetails.followup.advice_text}
                      </p>
                      {modalDetails.followup.next_appointment_note && (
                        <p className="text-ink-secondary text-[11px] pt-1 border-t border-brand-blue/10">
                          Next Appointment: {modalDetails.followup.next_appointment_note}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-disabled italic">No advice recorded for this visit.</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal: Delete Visit */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete Visit Record?"
        description="This will delete this clinical visit and all associated notes and prescriptions. This action cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete Visit'}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
