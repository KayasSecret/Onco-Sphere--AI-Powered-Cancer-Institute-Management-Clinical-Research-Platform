import { forwardRef } from 'react'
import './ReportsModule.css'

const DEFAULT_SUMMARY_TEXT =
  "The Damage vs. Defense Ratio (DDR) summarizes the body's oxidative stress by comparing total oxidative damage to antioxidant capacity. It is calculated as (MDA + FOX-2 + Protein Carbonyl + Nitric Oxide) / (GSH + TAC). A low DDR indicates that antioxidants effectively counteract oxidative damage; a moderate DDR suggests that oxidative stress is present and defenses are partially overwhelmed; and a high DDR indicates that damage exceeds the body's protective capacity, reflecting severe oxidative stress and higher risk for cellular dysfunction or disease."

const DEFAULT_DISCLAIMER_TEXT =
  'The information provided by this panel reflects biochemical markers of oxidative balance and is intended for research or clinical monitoring purposes. It should be considered alongside comprehensive oncology clinical evaluation and not as a standalone diagnostic tool.'

// Qualitative indicator helpers
const getDamageCircleColor = (score) => {
  const s = parseFloat(score) || 0
  if (s <= 3) return '#FFEB3B' // Low (Yellow)
  if (s <= 7) return '#FF9800' // Moderate (Orange)
  return '#F44336' // High (Red)
}

const getDamageLabel = (score) => {
  const s = parseFloat(score) || 0
  if (s <= 0) return 'Pending'
  if (s <= 3) return 'Low Damage'
  if (s <= 7) return 'Moderate Stress'
  return 'High Oxidative Stress'
}

const getDefenceCircleColor = (score) => {
  const s = parseFloat(score) || 0
  if (s <= 3) return '#FFEB3B' // Weak (Yellow)
  if (s <= 7) return '#8BC34A' // Moderate (Light Green)
  return '#2E7D32' // Strong (Dark Green)
}

const getDefenceLabel = (score) => {
  const s = parseFloat(score) || 0
  if (s <= 0) return 'Pending'
  if (s <= 3) return 'Low Reserve'
  if (s <= 7) return 'Moderate Defence'
  return 'Strong Defence'
}

const getRatioCircleColor = (score) => {
  const s = parseFloat(score) || 0
  if (s <= 3) return '#4CAF50' // Balanced (Green)
  if (s <= 6) return '#FFEB3B' // Moderate (Yellow)
  return '#F44336' // High Risk (Red)
}

const getRatioLabel = (score) => {
  const s = parseFloat(score) || 0
  if (s <= 0) return 'Pending'
  if (s <= 3) return 'Balanced Ratio'
  if (s <= 6) return 'Moderate Ratio'
  return 'Elevated DDR Risk'
}

const getPinLeftPercent = (score) => {
  const val = parseFloat(score)
  if (isNaN(val) || val <= 1) return '2%'
  if (val >= 10) return '96%'
  return `${2 + ((val - 1) / 9) * 94}%`
}

/**
 * OxidativeReportDocument — High-density, single-page optimized A4 clinical report
 * Used identically by ReportCreatorPage (live preview) and ReportPrintPage (PDF export).
 */
const OxidativeReportDocument = forwardRef(function OxidativeReportDocument(
  {
    instSettings,
    signatureUrl,
    reportNumber,
    version = 1,
    reportStatus = 'Draft',
    patientName,
    patientCode,
    patientAge,
    patientGender,
    referenceBy,
    doctorName,
    reportDate,
    collectionDate,
    sampleType,
    labNumber,
    damageParams = [],
    defenceParams = [],
    damageScore = 0,
    defenceScore = 0,
    ratioScore = 0,
    overallSummary,
    disclaimerText,
  },
  ref
) {
  const summaryToRender =
    overallSummary !== undefined && overallSummary !== null && overallSummary !== ''
      ? overallSummary
      : DEFAULT_SUMMARY_TEXT

  const disclaimerToRender =
    disclaimerText !== undefined && disclaimerText !== null && disclaimerText !== ''
      ? disclaimerText
      : DEFAULT_DISCLAIMER_TEXT

  return (
    <div ref={ref} id="printable-report" className="onco-a4-sheet flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* ── 1. INSTITUTE HEADER BRANDING ────────────────────────────────── */}
        <div className="flex items-center justify-between border-b-2 border-[#6B1D1D] pb-2.5">
          <div className="flex items-center gap-3">
            <img
              src={instSettings?.logo_url || '/static/default_logo.png'}
              alt="Institute Logo"
              className="h-[46px] w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="h-8 w-px bg-[#6B1D1D]/30" />
            <div>
              <p className="text-[10px] font-extrabold text-[#6B1D1D] uppercase tracking-widest leading-none">
                ICSR · Clinical Biochemistry &amp; Oncology Lab
              </p>
              <h1 className="text-[15px] font-extrabold text-[#6B1D1D] uppercase tracking-tight leading-snug mt-0.5">
                {instSettings?.name || 'Institute of Cancer and Stem Cell Research'}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded bg-[#6B1D1D] text-white text-[9px] font-bold uppercase tracking-wider">
              Oxidative Stress Panel
            </span>
            <p className="text-[10px] font-mono font-bold text-slate-700 mt-1">
              {reportNumber ? `${reportNumber} (v${version})` : 'NEW REPORT · v1'} ·{' '}
              <span className="uppercase">{reportStatus || 'Draft'}</span>
            </p>
          </div>
        </div>

        {/* ── 2. PATIENT & SPECIMEN METADATA GRID ─────────────────────────── */}
        <div className="border border-slate-300 rounded bg-[#F8FAFC] p-2.5">
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              <tr>
                <td className="py-1 px-1.5 font-bold text-slate-700 w-[15%]">Patient Name:</td>
                <td className="py-1 px-1.5 font-bold text-slate-900 w-[23%]">
                  {patientName || '—'}
                </td>
                <td className="py-1 px-1.5 font-bold text-slate-700 w-[14%]">Ref. By:</td>
                <td className="py-1 px-1.5 font-semibold text-slate-900 w-[20%]">
                  {referenceBy || '—'}
                </td>
                <td className="py-1 px-1.5 font-bold text-slate-700 w-[14%]">Report Date:</td>
                <td className="py-1 px-1.5 font-mono text-slate-900 w-[14%]">
                  {reportDate || '—'}
                </td>
              </tr>
              <tr className="border-t border-slate-200/80">
                <td className="py-1 px-1.5 font-bold text-slate-700">Patient ID / UHID:</td>
                <td className="py-1 px-1.5 font-mono font-semibold text-slate-900">
                  {patientCode || '—'}
                </td>
                <td className="py-1 px-1.5 font-bold text-slate-700">Sample Type:</td>
                <td className="py-1 px-1.5 font-semibold text-slate-900">
                  {sampleType || 'Serum'}
                </td>
                <td className="py-1 px-1.5 font-bold text-slate-700">Collected On:</td>
                <td className="py-1 px-1.5 font-mono text-slate-900">
                  {collectionDate || '—'}
                </td>
              </tr>
              <tr className="border-t border-slate-200/80">
                <td className="py-1 px-1.5 font-bold text-slate-700">Age / Gender:</td>
                <td className="py-1 px-1.5 text-slate-900">
                  {patientAge ? `${patientAge} Yrs` : '—'}
                  {patientGender ? ` / ${patientGender}` : ''}
                </td>
                <td className="py-1 px-1.5 font-bold text-slate-700">Laboratory No.:</td>
                <td className="py-1 px-1.5 font-mono font-semibold text-slate-900">
                  {labNumber || '—'}
                </td>
                <td className="py-1 px-1.5 font-bold text-slate-700">Signatory:</td>
                <td className="py-1 px-1.5 font-semibold text-slate-900 truncate">
                  {doctorName || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 3. SECTION 1: OXIDATIVE DAMAGE PANEL ────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between border-b border-[#6B1D1D]/25 pb-0.5">
            <h2 className="text-[12.5px] font-extrabold text-[#6B1D1D] uppercase tracking-wide">
              1. Oxidative Damage Biomarkers
            </h2>
            <span className="text-[9.5px] font-semibold text-slate-500">
              Lipid Peroxidation · Protein Carbonyls · Nitrosative Stress
            </span>
          </div>
          <p className="text-[9.5px] text-slate-600 leading-snug text-justify">
            Markers quantifying cellular injury from reactive oxygen and nitrogen species. MDA (TBARS) and FOX-2 reflect lipid peroxidation and early membrane damage; Protein Carbonyl (DNPH) measures oxidative protein modification; Nitric Oxide (Griess assay) evaluates nitrosative stress.
          </p>

          <table className="onco-a4-table">
            <thead>
              <tr>
                <th className="text-left w-[36%]">Parameter Measured</th>
                <th className="text-center w-[14%]">Result</th>
                <th className="text-center w-[22%]">Reference Range</th>
                <th className="text-left w-[28%]">Clinical Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {damageParams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-slate-400 py-2">
                    No oxidative damage parameters configured.
                  </td>
                </tr>
              ) : (
                damageParams.map((param, idx) => (
                  <tr key={param.parameter_id || param.id || idx}>
                    <td className="font-semibold">
                      {param.name || param.parameter_name}
                      {param.code || param.parameter_code ? (
                        <span className="ml-1 text-[9.5px] font-mono text-slate-500">
                          [{param.code || param.parameter_code}]
                        </span>
                      ) : null}
                    </td>
                    <td className="text-center font-mono font-bold text-slate-900">
                      {param.result_value !== '' && param.result_value !== null && param.result_value !== undefined
                        ? `${param.result_value}${param.unit || param.parameter_unit ? ` ${param.unit || param.parameter_unit}` : ''}`
                        : '—'}
                    </td>
                    <td className="text-center font-mono text-[10.5px]">
                      {param.reference_range || '—'}
                    </td>
                    <td className="text-[10.5px] font-medium">
                      {param.interpretation || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. SECTION 2: ANTIOXIDANT DEFENCE PANEL ─────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between border-b border-[#6B1D1D]/25 pb-0.5">
            <h2 className="text-[12.5px] font-extrabold text-[#6B1D1D] uppercase tracking-wide">
              2. Antioxidant Defence Capacity
            </h2>
            <span className="text-[9.5px] font-semibold text-slate-500">
              Intracellular Thiol Reserve · Total Plasma Antioxidant Potential
            </span>
          </div>
          <p className="text-[9.5px] text-slate-600 leading-snug text-justify">
            Evaluates systemic capacity to neutralize reactive species. Reduced Glutathione (GSH) represents the primary intracellular antioxidant barrier, while Total Antioxidant Capacity (TAC) integrates enzymatic and non-enzymatic plasma defence systems.
          </p>

          <table className="onco-a4-table">
            <thead>
              <tr>
                <th className="text-left w-[36%]">Parameter Measured</th>
                <th className="text-center w-[14%]">Result</th>
                <th className="text-center w-[22%]">Reference Range</th>
                <th className="text-left w-[28%]">Clinical Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {defenceParams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-slate-400 py-2">
                    No antioxidant defence parameters configured.
                  </td>
                </tr>
              ) : (
                defenceParams.map((param, idx) => (
                  <tr key={param.parameter_id || param.id || idx}>
                    <td className="font-semibold">
                      {param.name || param.parameter_name}
                      {param.code || param.parameter_code ? (
                        <span className="ml-1 text-[9.5px] font-mono text-slate-500">
                          [{param.code || param.parameter_code}]
                        </span>
                      ) : null}
                    </td>
                    <td className="text-center font-mono font-bold text-slate-900">
                      {param.result_value !== '' && param.result_value !== null && param.result_value !== undefined
                        ? `${param.result_value}${param.unit || param.parameter_unit ? ` ${param.unit || param.parameter_unit}` : ''}`
                        : '—'}
                    </td>
                    <td className="text-center font-mono text-[10.5px]">
                      {param.reference_range || '—'}
                    </td>
                    <td className="text-[10.5px] font-medium">
                      {param.interpretation || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. COMPOSITE QUANTITATIVE & QUALITATIVE SCORE MATRIX (3-COL) ── */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between border-b border-[#6B1D1D]/25 pb-0.5">
            <h2 className="text-[12.5px] font-extrabold text-[#6B1D1D] uppercase tracking-wide">
              3. Composite Oxidative Balance Indices (Scale 1 – 10)
            </h2>
            <span className="text-[9.5px] font-semibold text-slate-500">
              Quantitative Index &amp; Qualitative Risk Stratification
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Gauge 1: Oxidative Damage Score */}
            <div className="onco-score-box">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold text-[#6B1D1D] uppercase">
                  Oxidative Damage
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {damageScore || '0.0'}/10
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 inline-block shrink-0"
                    style={{ backgroundColor: getDamageCircleColor(damageScore) }}
                  />
                </div>
              </div>
              <p className="text-[9px] font-semibold text-slate-600 mb-2">
                Status: <strong className="text-slate-900">{getDamageLabel(damageScore)}</strong>
              </p>
              <div className="relative pt-2.5">
                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: getPinLeftPercent(damageScore) }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-900" />
                </div>
                <div
                  className="h-2 w-full rounded-xs"
                  style={{
                    background: 'linear-gradient(90deg, #FFEB3B 0%, #FF9800 50%, #F44336 100%)',
                  }}
                />
                <div className="flex justify-between text-[8px] font-mono font-bold text-slate-500 mt-0.5">
                  <span>1 (Low)</span>
                  <span>5 (Mod)</span>
                  <span>10 (High)</span>
                </div>
              </div>
            </div>

            {/* Gauge 2: Antioxidant Defence Score */}
            <div className="onco-score-box">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold text-[#6B1D1D] uppercase">
                  Antioxidant Defence
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {defenceScore || '0.0'}/10
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 inline-block shrink-0"
                    style={{ backgroundColor: getDefenceCircleColor(defenceScore) }}
                  />
                </div>
              </div>
              <p className="text-[9px] font-semibold text-slate-600 mb-2">
                Status: <strong className="text-slate-900">{getDefenceLabel(defenceScore)}</strong>
              </p>
              <div className="relative pt-2.5">
                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: getPinLeftPercent(defenceScore) }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-900" />
                </div>
                <div
                  className="h-2 w-full rounded-xs"
                  style={{
                    background: 'linear-gradient(90deg, #FFEB3B 0%, #8BC34A 50%, #2E7D32 100%)',
                  }}
                />
                <div className="flex justify-between text-[8px] font-mono font-bold text-slate-500 mt-0.5">
                  <span>1 (Weak)</span>
                  <span>5 (Mod)</span>
                  <span>10 (Strong)</span>
                </div>
              </div>
            </div>

            {/* Gauge 3: Damage - Defence Ratio (DDR) */}
            <div className="onco-score-box">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold text-[#6B1D1D] uppercase">
                  Damage–Defence Ratio
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {ratioScore || '0.0'}/10
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 inline-block shrink-0"
                    style={{ backgroundColor: getRatioCircleColor(ratioScore) }}
                  />
                </div>
              </div>
              <p className="text-[9px] font-semibold text-slate-600 mb-2">
                Status: <strong className="text-slate-900">{getRatioLabel(ratioScore)}</strong>
              </p>
              <div className="relative pt-2.5">
                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: getPinLeftPercent(ratioScore) }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-900" />
                </div>
                <div
                  className="h-2 w-full rounded-xs"
                  style={{
                    background: 'linear-gradient(90deg, #4CAF50 0%, #FFEB3B 50%, #F44336 100%)',
                  }}
                />
                <div className="flex justify-between text-[8px] font-mono font-bold text-slate-500 mt-0.5">
                  <span>1 (Opt)</span>
                  <span>5 (Mod)</span>
                  <span>10 (Risk)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. OVERALL SUMMARY & CLINICAL INTERPRETATION ────────────────── */}
        <div className="space-y-1">
          <h2 className="text-[12px] font-extrabold text-[#6B1D1D] uppercase tracking-wide border-b border-[#6B1D1D]/25 pb-0.5">
            4. Overall Summary &amp; Diagnostic Interpretation
          </h2>
          <p className="text-[9.5px] text-slate-700 leading-relaxed text-justify whitespace-pre-line">
            {summaryToRender}
          </p>
        </div>

        {/* ── 7. DISCLAIMER & AUTHORISED SIGNATORY ────────────────────────── */}
        <div className="pt-1 flex items-end justify-between gap-6">
          <div className="flex-1 space-y-1">
            <p className="text-[9px] font-bold text-slate-700 uppercase">Clinical Disclaimer:</p>
            <p className="text-[8.5px] text-slate-500 leading-snug text-justify">
              {disclaimerToRender}
            </p>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase pt-1">
              —————— End of Clinical Report ——————
            </p>
          </div>

          <div className="w-44 flex flex-col items-center text-center shrink-0">
            <div className="relative h-11 w-36 flex items-center justify-center">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Authorised Signature"
                  className="max-h-10 max-w-full object-contain"
                />
              ) : (
                <div className="h-9 w-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400">
                  Digital Signatory
                </div>
              )}
              {instSettings?.stamp_url && (
                <img
                  src={instSettings.stamp_url}
                  alt="Institute Stamp"
                  className="absolute right-0 bottom-0 h-10 w-10 object-contain opacity-80"
                />
              )}
            </div>
            <div className="w-full border-t border-slate-400 pt-1 mt-0.5">
              <p className="text-[10px] font-bold text-slate-900 leading-tight">
                {doctorName || 'Authorised Signatory'}
              </p>
              <p className="text-[8.5px] font-bold text-[#6B1D1D] uppercase tracking-wider">
                Authorised Signatory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. COMPACT INSTITUTIONAL FOOTER ─────────────────────────────── */}
      <div className="border-t-2 border-[#6B1D1D] pt-2 mt-3">
        <div className="flex items-center justify-between text-[8.5px] text-slate-600 gap-2">
          <div className="truncate">
            <strong className="text-slate-800">Address:</strong>{' '}
            {instSettings?.address || 'M4 Mishika Tower Sampna Sangeeta Indore M.P. 452001'} ·{' '}
            <strong className="text-slate-800">Email:</strong>{' '}
            {instSettings?.email || 'icsrofficial@gmail.com'}
          </div>
          <div className="text-right shrink-0">
            <strong className="text-slate-800">Web:</strong>{' '}
            {instSettings?.website || 'www.icsrofficial.com'} ·{' '}
            <strong className="text-slate-800">Tel:</strong>{' '}
            {instSettings?.contact_number || '+91 7582950349'}
          </div>
        </div>
        <div className="flex justify-between items-center text-[8.5px] text-[#6B1D1D] font-bold uppercase tracking-tight mt-1">
          <span>
            {instSettings?.name || 'Institute of Cancer and Stem Cell Research'} | SAT Clinical Registry
          </span>
          <span className="font-mono">Page 1 of 1</span>
        </div>
      </div>
    </div>
  )
})

export default OxidativeReportDocument
