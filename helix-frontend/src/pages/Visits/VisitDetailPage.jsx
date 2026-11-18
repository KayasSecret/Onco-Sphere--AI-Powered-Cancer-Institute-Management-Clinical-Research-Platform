import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  RiArrowLeftLine, RiCalendarLine, RiUserLine, RiBuilding2Line,
  RiDoorLine, RiTimeLine, RiFlaskLine, RiFileTextLine, RiCapsuleLine,
  RiHeartPulseLine, RiAlertLine, RiRefreshLine, RiStethoscopeLine,
  RiInformationLine, RiCheckboxCircleLine,
} from "react-icons/ri"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import PageHeader from "@/components/PageHeader"
import VisitStatusBadge from "@/components/visits/VisitStatusBadge"
import VisitTypeBadge from "@/components/visits/VisitTypeBadge"
import visitService from "@/services/visitService"

// -- Section wrapper ----------------------------------------------------------
function Section({ icon: Icon, title, children, empty, emptyText }) {
  return (
    <Card className="bg-surface-card border-surface-border shadow-sm">
      <CardHeader className="pb-3 border-b border-surface-border/50">
        <CardTitle className="text-sm font-semibold text-brand-navy uppercase tracking-wider flex items-center gap-2">
          <Icon size={15} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {empty ? (
          <p className="text-sm text-ink-disabled italic">{emptyText || "No data recorded."}</p>
        ) : children}
      </CardContent>
    </Card>
  )
}

// -- Field row -----------------------------------------------------------------
function FieldRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-surface-border/30 last:border-0">
      <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider shrink-0 sm:w-44">{label}</p>
      <p className="text-sm text-ink-primary">{value || <span className="text-ink-disabled italic">Not available</span>}</p>
    </div>
  )
}

// -- Severity bar --------------------------------------------------------------
function SeverityBar({ score }) {
  const label = score <= 3 ? "Mild" : score <= 6 ? "Moderate" : "Severe"
  const color = score <= 3 ? "bg-green-500" : score <= 6 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className={`text-xs font-semibold ${score <= 3 ? "text-green-600" : score <= 6 ? "text-amber-600" : "text-red-600"}`}>
        {score}/10 {label}
      </span>
    </div>
  )
}

export default function VisitDetailPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()

  const [visit, setVisit] = useState(null)
  const [symptoms, setSymptoms] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [treatments, setTreatments] = useState([])
  const [followup, setFollowup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [v, s, inv, presc, treat, fu] = await Promise.allSettled([
        visitService.getVisitDetail(visitId),
        visitService.getSymptoms(visitId),
        visitService.getInvestigations(visitId),
        visitService.getPrescriptions(visitId),
        visitService.getTreatments(visitId),
        visitService.getFollowUp(visitId),
      ])
      if (v.status === "fulfilled") setVisit(v.value.data)
      else throw new Error(v.reason?.response?.data?.detail || "Visit not found")
      if (s.status === "fulfilled") setSymptoms(s.value.data || [])
      if (inv.status === "fulfilled") setInvestigations(inv.value.data || [])
      if (presc.status === "fulfilled") setPrescriptions(presc.value.data || [])
      if (treat.status === "fulfilled") setTreatments(treat.value.data || [])
      if (fu.status === "fulfilled") setFollowup(fu.value.data || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [visitId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )

  const handleBack = () => {
    if (visit?.patient_id) {
      navigate(`/patients/${visit.patient_id}`)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/patients')
    }
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-3">
      <RiAlertLine size={36} className="text-status-critical" />
      <p className="text-sm font-semibold text-ink-primary">{error}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={load}><RiRefreshLine size={13} className="mr-1" /> Retry</Button>
        <Button size="sm" variant="ghost" onClick={handleBack}>
          <RiArrowLeftLine size={13} className="mr-1" /> Back
        </Button>
      </div>
    </div>
  )

  const scheduled = visit?.scheduled_at ? new Date(visit.scheduled_at) : null
  const checkedIn = visit?.checked_in_at ? new Date(visit.checked_in_at) : null

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={`Visit ${visit?.visit_code || ""}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Patient Register", to: "/patients" },
          ...(visit?.patient_id ? [{ label: `Patient #${visit.patient_id}`, to: `/patients/${visit.patient_id}` }] : []),
          { label: visit?.visit_code || "Detail" },
        ]}
      />

      {/* Visit header bar */}
      <Card className="bg-surface-card border-surface-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <VisitStatusBadge status={visit?.status} />
                <VisitTypeBadge type={visit?.visit_type} />
                <span className="text-[11px] font-mono text-ink-disabled">{visit?.visit_code}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary">
                {scheduled && (
                  <span className="flex items-center gap-1">
                    <RiCalendarLine size={13} />
                    {scheduled.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                    &nbsp;•&nbsp;
                    <RiTimeLine size={13} />
                    {scheduled.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {visit?.doctor_name && (
                  <span className="flex items-center gap-1"><RiUserLine size={13} /> {visit.doctor_name}</span>
                )}
                {visit?.department && (
                  <span className="flex items-center gap-1"><RiBuilding2Line size={13} /> {visit.department}</span>
                )}
                {visit?.room && (
                  <span className="flex items-center gap-1"><RiDoorLine size={13} /> Room {visit.room}</span>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleBack} className="text-xs flex items-center gap-1 border-surface-border">
              <RiArrowLeftLine size={13} /> Back
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed sections */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-surface-base border border-surface-border rounded-lg p-1 w-full sm:w-auto">
          {[
            { value: "summary", label: "Summary", icon: RiInformationLine },
            { value: "symptoms", label: "Symptoms", icon: RiHeartPulseLine },
            { value: "investigations", label: "Tests", icon: RiFlaskLine },
            { value: "prescriptions", label: "Prescriptions", icon: RiCapsuleLine },
            { value: "treatments", label: "Treatment", icon: RiStethoscopeLine },
            { value: "followup", label: "Follow-up", icon: RiCheckboxCircleLine },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-brand-blue data-[state=active]:text-white">
              <tab.icon size={13} /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Summary */}
        <TabsContent value="summary">
          <Section icon={RiInformationLine} title="Visit Summary" empty={!visit?.chief_complaint && !visit?.notes} emptyText="No summary recorded for this visit.">
            <div className="space-y-1">
              {visit?.chief_complaint && <FieldRow label="Chief Complaint" value={visit.chief_complaint} />}
              {visit?.notes && <FieldRow label="Clinical Notes" value={visit.notes} />}
              {checkedIn && <FieldRow label="Checked In At" value={checkedIn.toLocaleString("en-IN")} />}
              {visit?.token_number && <FieldRow label="Token Number" value={visit.token_number} />}
            </div>
          </Section>
        </TabsContent>

        {/* Symptoms */}
        <TabsContent value="symptoms">
          <Section icon={RiHeartPulseLine} title="Symptoms & Patient-Reported Information" empty={symptoms.length === 0} emptyText="No symptoms recorded for this visit.">
            <div className="space-y-4">
              {symptoms.map((s) => (
                <div key={s.id} className="p-3 bg-surface-base rounded-lg border border-surface-border space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-primary">{s.name}</p>
                    {s.severity_score !== null && s.severity_score !== undefined && (
                      <div className="w-full sm:w-44"><SeverityBar score={s.severity_score} /></div>
                    )}
                  </div>
                  {s.patient_note && (
                    <p className="text-xs text-ink-secondary italic border-l-2 border-surface-border pl-2">"{s.patient_note}"</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* Investigations */}
        <TabsContent value="investigations">
          <Section icon={RiFlaskLine} title="Investigations Ordered" empty={investigations.length === 0} emptyText="No investigations ordered for this visit.">
            <div className="space-y-2">
              {investigations.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-surface-base rounded-lg border border-surface-border">
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">{inv.name}</p>
                    <p className="text-xs text-ink-disabled mt-0.5">Ordered: {new Date(inv.ordered_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      inv.status === "result_available" ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300" :
                      inv.status === "in_progress" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}>
                      {inv.status === "result_available" ? "Result Available" : inv.status === "in_progress" ? "In Progress" : "Ordered"}
                    </span>
                    {inv.result_url && (
                      <a href={inv.result_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue hover:text-brand-blue-dark flex items-center gap-1">
                        <RiFileTextLine size={12} /> View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* Prescriptions */}
        <TabsContent value="prescriptions">
          <Section icon={RiCapsuleLine} title="Prescriptions" empty={prescriptions.length === 0} emptyText="No prescriptions for this visit.">
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-3 bg-surface-base rounded-lg border border-surface-border space-y-3">
                  <div className="flex items-center justify-between text-xs text-ink-secondary">
                    <span className="flex items-center gap-1"><RiUserLine size={11} /> {rx.prescribing_doctor_name || "Doctor"}</span>
                    <span>{new Date(rx.prescribed_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="space-y-2">
                    {(rx.medicines || []).map((med, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-b border-surface-border/30 pb-2 last:border-0 last:pb-0">
                        <span className="font-semibold text-ink-primary">{med.name}</span>
                        {med.dose && <span className="text-ink-secondary text-xs">{med.dose}</span>}
                        {med.frequency && <span className="text-ink-secondary text-xs">{med.frequency}</span>}
                        {med.duration && <span className="text-ink-disabled text-xs">for {med.duration}</span>}
                      </div>
                    ))}
                  </div>
                  {rx.instructions && (
                    <p className="text-xs text-ink-secondary bg-surface-card rounded p-2 border border-surface-border">{rx.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* Treatments */}
        <TabsContent value="treatments">
          <Section icon={RiStethoscopeLine} title="Treatment & Procedure Information" empty={treatments.length === 0} emptyText="No treatment procedures recorded for this visit.">
            <div className="space-y-3">
              {treatments.map((t) => (
                <div key={t.id} className="p-3 bg-surface-base rounded-lg border border-surface-border space-y-1">
                  <p className="text-sm font-bold text-ink-primary">{t.procedure_type}</p>
                  {t.performed_by_name && <p className="text-xs text-ink-secondary">By: {t.performed_by_name}</p>}
                  {t.notes && <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{t.notes}</p>}
                  <p className="text-[10px] text-ink-disabled">{new Date(t.created_at).toLocaleDateString("en-IN")}</p>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* Follow-up */}
        <TabsContent value="followup">
          <Section icon={RiCheckboxCircleLine} title="Doctor'\''s Advice & Follow-up" empty={!followup} emptyText="No follow-up instructions recorded.">
            {followup && (
              <div className="space-y-4">
                {followup.advice_text && (
                  <div className="p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-lg">
                    <p className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1.5">Doctor'\''s Advice</p>
                    <p className="text-sm text-ink-primary leading-relaxed whitespace-pre-line">{followup.advice_text}</p>
                  </div>
                )}
                {followup.next_appointment_note && (
                  <FieldRow label="Next Appointment" value={followup.next_appointment_note} />
                )}
                {followup.next_visit_id && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/visits/${followup.next_visit_id}`)}
                      className="text-xs flex items-center gap-1"
                    >
                      <RiCalendarLine size={12} /> View Next Visit
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
