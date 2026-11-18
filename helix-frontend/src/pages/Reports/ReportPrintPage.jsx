import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import reportService from '../../services/reportService'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Button } from '../../components/ui/button'
import { RiPrinterLine, RiDownload2Line, RiArrowLeftLine, RiEditLine } from 'react-icons/ri'
import { toast } from 'sonner'
import { calculateAge } from '../../lib/utils'
import OxidativeReportDocument from './OxidativeReportDocument'
import './ReportsModule.css'

export default function ReportPrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const autoPrint = searchParams.get('print') === 'true'

  const printAreaRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [instSettings, setInstSettings] = useState(null)
  const [signatures, setSignatures] = useState([])

  const triggerSystemPrint = useCallback(async () => {
    try {
      await reportService.logPrint(id)
    } catch {}
    window.print()
  }, [id])

  const loadPrintData = useCallback(async () => {
    setLoading(true)
    try {
      const [repRes, setRes] = await Promise.all([
        reportService.getReport(id),
        reportService.getSettings(),
      ])
      setReport(repRes.data)
      setInstSettings(setRes.data.institute)
      setSignatures(setRes.data.signatures || [])

      if (autoPrint) {
        setTimeout(() => {
          triggerSystemPrint()
        }, 650)
      }
    } catch {
      toast.error('Failed to load report data for printing.')
    } finally {
      setLoading(false)
    }
  }, [id, autoPrint, triggerSystemPrint])

  useEffect(() => {
    loadPrintData()
  }, [loadPrintData])

  const handleDownloadPDF = async () => {
    const container = printAreaRef.current
    if (!container) return

    const pageNodes = container.querySelectorAll('[data-pdf-page]')
    const targets = pageNodes.length > 0 ? Array.from(pageNodes) : [container]

    const toastId = toast.loading('Generating 3-page ICSR Oxidative Stress PDF...')
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      for (let i = 0; i < targets.length; i++) {
        const canvas = await html2canvas(targets[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        })
        const imgData = canvas.toDataURL('image/jpeg', 0.98)
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
      }

      pdf.save(`${report?.report_number || 'REPORT'}.pdf`)

      try {
        await reportService.logPrint(id)
      } catch {}
      toast.success('PDF download completed.', { id: toastId })
    } catch {
      toast.error('Failed to generate PDF file.', { id: toastId })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading Pathology Report Viewer...
        </p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
        <p className="text-sm font-semibold text-rose-600">Report not found.</p>
        <Button onClick={() => navigate('/reports')} variant="outline">
          Back to History
        </Button>
      </div>
    )
  }

  const damageValues = report.values.filter((v) => v.parameter_section === 'Oxidative Damage')
  const defenceValues = report.values.filter((v) => v.parameter_section === 'Antioxidant Defence')
  const matchedSignatureUrl =
    signatures.find((s) => s.doctor_name === report.doctor_name)?.signature_url || null

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-4 print:p-0 print:bg-white">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="w-full max-w-[794px] mb-5 flex flex-wrap justify-between items-center gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs no-print print:hidden">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <RiArrowLeftLine size={16} /> Back to Onco Receipt History
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/reports/edit/${id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            <RiEditLine size={14} /> Edit Report
          </button>
          <button
            type="button"
            onClick={triggerSystemPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold cursor-pointer"
          >
            <RiPrinterLine size={15} /> Print Report
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            <RiDownload2Line size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* Shared Single-Page Optimized A4 Document */}
      <div className="w-full overflow-x-auto pb-4 print:overflow-visible">
        <div className="w-fit mx-auto">
          <OxidativeReportDocument
            ref={printAreaRef}
            instSettings={instSettings}
            signatureUrl={matchedSignatureUrl}
            reportNumber={report.report_number}
            version={report.version}
            reportStatus={report.status}
            patientName={report.patient?.full_name}
            patientCode={report.patient?.patient_code}
            patientAge={calculateAge(report.patient?.date_of_birth)}
            patientGender={report.patient?.gender}
            referenceBy={report.reference_by}
            doctorName={report.doctor_name}
            reportDate={report.report_date}
            collectionDate={report.collection_date}
            sampleType={report.sample_type}
            labNumber={report.lab_number}
            damageParams={damageValues}
            defenceParams={defenceValues}
            damageScore={report.damage_score}
            defenceScore={report.defence_score}
            ratioScore={report.ratio_score}
            overallSummary={report.overall_summary}
          />
        </div>
      </div>
    </div>
  )
}
