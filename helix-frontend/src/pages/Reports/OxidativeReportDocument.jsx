import { forwardRef } from 'react'
import './ReportsModule.css'

const DEFAULT_SUMMARY_TEXT =
  "The Damage vs. Defense Ratio (DDR) summarizes the body's oxidative stress by comparing total oxidative damage to antioxidant capacity. It is calculated as (MDA + FOX-2 + Protein Carbonyl + Nitric Oxide) ÷ GSH. A low DDR indicates that antioxidants effectively counteract oxidative damage, a moderate DDR suggests that oxidative stress is present and defenses are partially overwhelmed, and a high DDR indicates that damage exceeds the body's protective capacity, reflecting severe oxidative stress and higher risk for cellular dysfunction or disease."

const DEFAULT_DISCLAIMER_TEXT =
  'The information provided by this panel reflects biochemical markers of oxidative balance and is intended for research or monitoring purposes. It should be considered alongside clinical evaluation and not as a standalone diagnostic tool.'

// Format YYYY-MM-DD -> DD-MM-YY (e.g., 28-05-26) to match reference PDF
function formatPdfDate(dateStr) {
  if (!dateStr) return '—'
  const parts = String(dateStr).split('T')[0].split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    const yy = parts[0].slice(2)
    return `${parts[2]}-${parts[1]}-${yy}`
  }
  return dateStr
}

// Qualitative Circle Colors matching reference PDF
function getDamageCircleHex(score) {
  const s = parseFloat(score) || 0
  if (s <= 3) return '#FDD835' // Light Yellow
  if (s <= 7) return '#FB770D' // Orange (matches 6.1 in PDF)
  return '#D32F2F' // Red
}

function getDefenceCircleHex(score) {
  const s = parseFloat(score) || 0
  if (s <= 3) return '#DCE775' // Light Yellow
  if (s <= 7) return '#7CB342' // Light Green
  return '#257A1E' // Dark Green (matches 8.3 in PDF)
}

function getRatioCircleHex(score) {
  const s = parseFloat(score) || 0
  if (s <= 3) return '#39A835' // Green (matches 2.9 in PDF)
  if (s <= 6) return '#FDD835' // Yellow
  return '#D32F2F' // Red
}

// Maroon ICSR Swirl Emblem + Wordmark (matches reference PDF header)
function IcsrHeaderLogo({ instSettings }) {
  return (
    <div className="flex items-center justify-between pt-2 pb-4">
      {/* Left: Swirl Logo + ICSR serif text */}
      <div className="flex items-center gap-3">
        {instSettings?.logo_url ? (
          <img
            src={instSettings.logo_url}
            alt="ICSR Logo"
            className="h-[68px] w-auto object-contain"
          />
        ) : (
          <svg width="68" height="68" viewBox="0 0 80 80" fill="none">
            <g transform="translate(40,40)">
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <path
                  key={angle}
                  d="M 4 -8 C 16 -22, 32 -12, 24 6 C 18 16, 8 10, 4 -8 Z"
                  fill="#8B2323"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="10" fill="#FFFFFF" />
            </g>
          </svg>
        )}
        <span
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: '58px',
            fontWeight: 700,
            color: '#8B2323',
            letterSpacing: '0.03em',
            lineHeight: 1,
          }}
        >
          ICSR
        </span>
      </div>

      {/* Right: SHANTI AVEDNA TRUST + INSTITUTE OF CANCER AND STEM CELL RESEARCH */}
      <div className="text-center flex-1 pl-4">
        <div className="inline-block border-b-[2px] border-[#6B1D1D] pb-0.5 mb-2.5">
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: '#6B1D1D',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            SHANTI AVEDNA TRUST
          </span>
        </div>
        <h1
          style={{
            fontSize: '23px',
            fontWeight: 800,
            color: '#7A2020',
            letterSpacing: '0.02em',
            lineHeight: 1.22,
            textTransform: 'uppercase',
          }}
        >
          {instSettings?.name || (
            <>
              INSTITUTE OF CANCER AND
              <br />
              STEM CELL RESEARCH
            </>
          )}
        </h1>
      </div>
    </div>
  )
}

// Repeated Patient Info Box (matches reference PDF)
function PatientInfoBox({ patientName, reportDate, referenceBy, sampleType }) {
  return (
    <div
      style={{
        border: '1px solid #6B7280',
        padding: '18px 26px',
        marginTop: '6px',
        marginBottom: '22px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <table className="w-full border-collapse" style={{ fontSize: '14.5px', color: '#111827' }}>
        <tbody>
          <tr>
            <td style={{ paddingBottom: '18px', width: '58%' }}>
              <strong style={{ fontWeight: 700 }}>Patient Name:</strong>{' '}
              <span>{patientName || '—'}</span>
            </td>
            <td style={{ paddingBottom: '18px', width: '42%' }}>
              <strong style={{ fontWeight: 700 }}>Report Date:</strong>{' '}
              <span>{formatPdfDate(reportDate)}</span>
            </td>
          </tr>
          <tr>
            <td>
              <strong style={{ fontWeight: 700 }}>Ref. By:</strong>{' '}
              <span>{referenceBy || '—'}</span>
            </td>
            <td>
              <strong style={{ fontWeight: 700 }}>Sample:</strong>{' '}
              <span>{sampleType || 'Serum'}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Repeated Page Footer Bar (Page 1, 2, 3)
function PageFooterBar({ pageNumber }) {
  return (
    <div className="pt-3 mt-auto flex items-center justify-between">
      <span
        style={{
          fontSize: '11.2px',
          fontWeight: 800,
          color: '#7A2020',
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
        }}
      >
        INSTITUTE OF CANCER AND STEM CELL RESEARCH | INDIAN INSTITUTE OF PREVENTIVE ONCOLOGY | SAT
      </span>
      <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{pageNumber}</span>
    </div>
  )
}

/**
 * OxidativeReportDocument — Exact 3-Page ICSR Oxidative Stress Report replica.
 * Every parameter value, score, date, doctor, patient name, and summary updates live from the form.
 */
const OxidativeReportDocument = forwardRef(function OxidativeReportDocument(
  {
    instSettings,
    signatureUrl,
    patientName,
    referenceBy,
    doctorName,
    reportDate,
    sampleType,
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

  const pageShellStyle = {
    width: '794px',
    minWidth: '794px',
    maxWidth: '794px',
    height: '1123px',
    minHeight: '1123px',
    maxHeight: '1123px',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    padding: '16px',
    boxSizing: 'border-box',
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  }

  const innerBorderStyle = {
    border: '1.5px solid #8B2626',
    width: '100%',
    height: '100%',
    padding: '24px 30px 18px 30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const damageColorBlocks = [
    '#FFEA00',
    '#FFD600',
    '#FFC107',
    '#FFA000',
    '#FB8C00',
    '#F57C00',
    '#E65100',
    '#E53935',
    '#C62828',
  ]

  const defenceColorBlocks = [
    '#FFF59D',
    '#E6EE9C',
    '#DCE775',
    '#C0CA33',
    '#9E9D24',
    '#7CB342',
    '#558B2F',
    '#33691E',
    '#2E7D32',
    '#1B5E20',
  ]

  return (
    <div ref={ref} id="printable-report" className="flex flex-col items-center gap-6 print:gap-0">
      {/* ════════════════════════════════════════════════════════════════════
          PAGE 1 — OXIDATIVE DAMAGE & ANTIOXIDANT DEFENCE TABLES
      ════════════════════════════════════════════════════════════════════ */}
      <div data-pdf-page="1" style={pageShellStyle} className="shadow-lg print:shadow-none">
        <div style={innerBorderStyle}>
          <div>
            <IcsrHeaderLogo instSettings={instSettings} />
            <PatientInfoBox
              patientName={patientName}
              reportDate={reportDate}
              referenceBy={referenceBy}
              sampleType={sampleType}
            />

            {/* Section 1: Oxidative Damage */}
            <div className="mt-2">
              <h2
                style={{
                  fontSize: '23px',
                  fontWeight: 800,
                  color: '#8B2323',
                  marginBottom: '6px',
                }}
              >
                Oxidative Damage
              </h2>
              <p
                style={{
                  fontSize: '9.6px',
                  color: '#1F2937',
                  lineHeight: 1.45,
                  marginBottom: '14px',
                }}
              >
                This includes markers that show cellular injury caused by reactive species. MDA (TBARS) and FOX-2 indicate lipid peroxidation and early membrane damage. Protein Carbonyl (DNPH) reflects oxidative modification of proteins. Nitric Oxide (Griess assay) indicates nitrosative stress, which can contribute to tissue and cellular damage. Elevated values of these markers suggest increased oxidative stress in the body.
              </p>

              <table
                className="w-full border-collapse text-center"
                style={{ border: '1px solid #BDBDBD', fontSize: '12.5px' }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #BDBDBD', backgroundColor: '#FFFFFF' }}>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '14px 10px',
                        width: '28%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Parameter Measured
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '14px 10px',
                        width: '20%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Result
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '14px 10px',
                        width: '22%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Refrence Range
                    </th>
                    <th
                      style={{
                        padding: '14px 10px',
                        width: '30%',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1.3,
                      }}
                    >
                      Interpretation (estabilsh
                      <br />
                      clinical significance )
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {damageParams.map((param, idx) => (
                    <tr
                      key={param.parameter_id || param.code || idx}
                      style={{ borderBottom: '1px solid #BDBDBD' }}
                    >
                      <td
                        style={{
                          borderRight: '1px solid #BDBDBD',
                          padding: '12px 10px',
                          color: '#1F2937',
                          lineHeight: 1.35,
                        }}
                      >
                        {param.name || param.parameter_name}
                      </td>
                      <td
                        style={{
                          borderRight: '1px solid #BDBDBD',
                          padding: '12px 10px',
                          fontWeight: idx === 0 ? 700 : 500,
                          fontSize: '13.5px',
                          color: '#111827',
                        }}
                      >
                        {param.result_value !== '' &&
                        param.result_value !== null &&
                        param.result_value !== undefined
                          ? param.result_value
                          : '—'}
                      </td>
                      <td
                        style={{
                          borderRight: '1px solid #BDBDBD',
                          padding: '12px 10px',
                          color: '#1F2937',
                        }}
                      >
                        {param.reference_range || '—'}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#1F2937' }}>
                        {param.interpretation || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 2: Antioxidant Defence */}
            <div className="mt-7">
              <h2
                style={{
                  fontSize: '23px',
                  fontWeight: 800,
                  color: '#8B2323',
                  marginBottom: '6px',
                }}
              >
                Antioxidant Defence
              </h2>
              <p
                style={{
                  fontSize: '9.6px',
                  color: '#1F2937',
                  lineHeight: 1.45,
                  marginBottom: '14px',
                }}
              >
                This panel evaluates the body&apos;s capacity to neutralize oxidative stress by measuring multiple antioxidant components. Reduced Glutathione (GSH) reflects the primary intracellular antioxidant that protects cells from reactive oxygen and nitrogen species. Total Antioxidant Capacity (TAC) measures the overall antioxidant potential of plasma, integrating both enzymatic and non-enzymatic systems.
              </p>

              <table
                className="w-full border-collapse text-center"
                style={{ border: '1px solid #BDBDBD', fontSize: '12.5px' }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #BDBDBD', backgroundColor: '#FFFFFF' }}>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '14px 10px',
                        width: '28%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Parameter Measured
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '14px 10px',
                        width: '20%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Result
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '14px 10px',
                        width: '22%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Refrence Range
                    </th>
                    <th
                      style={{
                        padding: '14px 10px',
                        width: '30%',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      Your Interpretation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {defenceParams.map((param, idx) => (
                    <tr
                      key={param.parameter_id || param.code || idx}
                      style={{ borderBottom: '1px solid #BDBDBD' }}
                    >
                      <td
                        style={{
                          borderRight: '1px solid #BDBDBD',
                          padding: '14px 10px',
                          color: '#1F2937',
                          lineHeight: 1.4,
                        }}
                      >
                        {param.name || param.parameter_name}
                      </td>
                      <td
                        style={{
                          borderRight: '1px solid #BDBDBD',
                          padding: '14px 10px',
                          fontSize: '13.5px',
                          color: '#111827',
                        }}
                      >
                        {param.result_value !== '' &&
                        param.result_value !== null &&
                        param.result_value !== undefined
                          ? param.result_value
                          : '—'}
                      </td>
                      <td
                        style={{
                          borderRight: '1px solid #BDBDBD',
                          padding: '14px 10px',
                          color: '#1F2937',
                        }}
                      >
                        {param.reference_range || '—'}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#1F2937' }}>
                        {param.interpretation || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PageFooterBar pageNumber={1} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 2 — OVERALL SUMMARY, OXIDATIVE DAMAGE SCORE & ANTIOXIDANT DEFENCE
      ════════════════════════════════════════════════════════════════════ */}
      <div data-pdf-page="2" style={pageShellStyle} className="shadow-lg print:shadow-none">
        <div style={innerBorderStyle}>
          <div>
            <IcsrHeaderLogo instSettings={instSettings} />
            <PatientInfoBox
              patientName={patientName}
              reportDate={reportDate}
              referenceBy={referenceBy}
              sampleType={sampleType}
            />

            {/* Overall Summary */}
            <div className="mt-2">
              <h2
                style={{
                  fontSize: '23px',
                  fontWeight: 800,
                  color: '#8B2323',
                  marginBottom: '8px',
                }}
              >
                Overall Summary
              </h2>
              <p
                style={{
                  fontSize: '9.8px',
                  color: '#1F2937',
                  lineHeight: 1.5,
                  marginBottom: '26px',
                  whiteSpace: 'pre-line',
                }}
              >
                {summaryToRender}
              </p>
            </div>

            {/* Score Section 1: Oxidative Damage Score */}
            <div className="mt-4">
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: 800,
                  color: '#8B2323',
                  marginBottom: '10px',
                }}
              >
                Oxidative Damage Score
              </h3>

              <table
                className="w-full border-collapse"
                style={{ border: '1px solid #BDBDBD', fontSize: '13px' }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #BDBDBD' }}>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '11px 14px',
                        width: '36%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Parameter
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '11px 14px',
                        width: '32%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Quantitative Analysis
                    </th>
                    <th
                      style={{
                        padding: '11px 14px',
                        width: '32%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Qualitative Analysis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '18px 14px',
                        color: '#1F2937',
                        lineHeight: 1.4,
                      }}
                    >
                      Oxidative Damage Score
                      <br />
                      (MDA+FOX2+NO+Protein Carbonyl)
                    </td>
                    <td
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '18px 14px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {damageScore || '0'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: getDamageCircleHex(damageScore),
                          margin: '0 auto',
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Segmented Color Scale + Legend (Side-by-Side like reference PDF) */}
              <div className="flex items-start gap-4 mt-5 pl-3">
                <div style={{ width: '210px', flexShrink: 0 }}>
                  <div
                    className="grid grid-cols-9 gap-[2px] p-[2px]"
                    style={{ border: '1px solid #9E9E9E', backgroundColor: '#FFFFFF' }}
                  >
                    {damageColorBlocks.map((hex, i) => (
                      <div key={i} style={{ height: '22px', backgroundColor: hex }} />
                    ))}
                  </div>
                  <div
                    className="grid grid-cols-9 text-center mt-1"
                    style={{ fontSize: '13px', color: '#1F2937' }}
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '10'].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '9.4px', color: '#111827', lineHeight: 1.7 }}>
                  <p>1–3 (Light Yellow): Low oxidative damage, minimal stress on cells.</p>
                  <p>4–7 (Orange): Moderate oxidative damage, some stress present.</p>
                  <p>8–10 (Red): High oxidative damage, significant stress and cellular risk.</p>
                </div>
              </div>
            </div>

            {/* Score Section 2: Antioxidant Defence */}
            <div className="mt-12">
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: 800,
                  color: '#8B2323',
                  marginBottom: '10px',
                }}
              >
                Antioxidant Defence
              </h3>

              <table
                className="w-full border-collapse"
                style={{ border: '1px solid #BDBDBD', fontSize: '13px' }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #BDBDBD' }}>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '11px 14px',
                        width: '36%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Parameter
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '11px 14px',
                        width: '32%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Quantitative Analysis
                    </th>
                    <th
                      style={{
                        padding: '11px 14px',
                        width: '32%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Qualitative Analysis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '22px 14px',
                        color: '#1F2937',
                      }}
                    >
                      Antioxidant Defence (GSH)
                    </td>
                    <td
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '22px 14px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {defenceScore || '0'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: getDefenceCircleHex(defenceScore),
                          margin: '0 auto',
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Segmented Color Scale + Legend */}
              <div className="flex items-start gap-4 mt-5 pl-3">
                <div style={{ width: '218px', flexShrink: 0 }}>
                  <div
                    className="grid grid-cols-10 gap-[2px] p-[2px]"
                    style={{ border: '1px solid #9E9E9E', backgroundColor: '#FFFFFF' }}
                  >
                    {defenceColorBlocks.map((hex, i) => (
                      <div key={i} style={{ height: '22px', backgroundColor: hex }} />
                    ))}
                  </div>
                  <div
                    className="grid grid-cols-10 text-center mt-1"
                    style={{ fontSize: '12.5px', color: '#1F2937' }}
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '9.4px', color: '#111827', lineHeight: 1.7 }}>
                  <p>1–3 (Light Yellow): Weak antioxidant defense, insufficient protection.</p>
                  <p>4–7 (Light Green): Moderate defense, partial protection against oxidative stress.</p>
                  <p>8–10 (Dark Green): Strong defense, effective neutralization of reactive species.</p>
                </div>
              </div>
            </div>
          </div>

          <PageFooterBar pageNumber={2} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 3 — DAMAGE-DEFENCE RATIO, DISCLAIMER, SIGNATORY & CONTACT
      ════════════════════════════════════════════════════════════════════ */}
      <div data-pdf-page="3" style={pageShellStyle} className="shadow-lg print:shadow-none">
        <div style={innerBorderStyle}>
          <div>
            <IcsrHeaderLogo instSettings={instSettings} />
            <PatientInfoBox
              patientName={patientName}
              reportDate={reportDate}
              referenceBy={referenceBy}
              sampleType={sampleType}
            />

            {/* Score Section 3: Damage - Defence Ratio */}
            <div className="mt-2">
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: 800,
                  color: '#8B2323',
                  marginBottom: '10px',
                }}
              >
                Damage - Defence Ratio
              </h3>

              <table
                className="w-full border-collapse"
                style={{ border: '1px solid #BDBDBD', fontSize: '13px' }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #BDBDBD' }}>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '11px 14px',
                        width: '36%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Parameter
                    </th>
                    <th
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '11px 14px',
                        width: '32%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Quantitative Analysis
                    </th>
                    <th
                      style={{
                        padding: '11px 14px',
                        width: '32%',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Qualitative Analysis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '22px 14px',
                        color: '#1F2937',
                      }}
                    >
                      Damage - Defence Ratio
                    </td>
                    <td
                      style={{
                        borderRight: '1px solid #BDBDBD',
                        padding: '22px 14px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {ratioScore || '0'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: getRatioCircleHex(ratioScore),
                          margin: '0 auto',
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 3-Block Color Scale (Green | Yellow | Red) + Legend */}
              <div className="flex items-start gap-4 mt-5 pl-3">
                <div style={{ width: '218px', flexShrink: 0 }}>
                  <div
                    className="grid grid-cols-3 gap-[2px] p-[2px]"
                    style={{ border: '1px solid #9E9E9E', backgroundColor: '#FFFFFF' }}
                  >
                    <div style={{ height: '22px', backgroundColor: '#39A835' }} />
                    <div style={{ height: '22px', backgroundColor: '#FDD835' }} />
                    <div style={{ height: '22px', backgroundColor: '#D32F2F' }} />
                  </div>
                  <div
                    className="grid grid-cols-9 text-center mt-1"
                    style={{ fontSize: '12.5px', color: '#1F2937' }}
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '10'].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '9.4px', color: '#111827', lineHeight: 1.7 }}>
                  <p>1–3 (Green): Low ratio, body defense is sufficient to counter damage.</p>
                  <p>4–6 (Yellow): Moderate ratio, damage and defense are somewhat balanced.</p>
                  <p>7–10 (Red): High ratio, damage exceeds defense, high oxidative stress.</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-12">
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8B2323' }}>Disclaimer:</p>
              <p style={{ fontSize: '9.8px', color: '#1F2937', lineHeight: 1.45, marginTop: '2px' }}>
                {disclaimerToRender}
              </p>
            </div>

            {/* Authorised Signatory Block (Right-aligned) */}
            <div className="mt-14 flex justify-end pr-6">
              <div className="flex flex-col items-center text-center">
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Doctor Signature"
                    className="h-12 object-contain mb-1"
                  />
                ) : (
                  <svg width="110" height="44" viewBox="0 0 120 48" fill="none" className="mb-0.5">
                    <path
                      d="M12 36 C 22 10, 35 12, 32 34 C 30 42, 48 18, 56 26 C 62 32, 74 14, 86 24 C 94 30, 104 16, 112 20"
                      stroke="#1E3A8A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M24 38 L 106 24"
                      stroke="#1E3A8A"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {instSettings?.stamp_url ? (
                  <img
                    src={instSettings.stamp_url}
                    alt="Institute Stamp"
                    className="h-12 object-contain mb-1"
                  />
                ) : (
                  <div className="text-center leading-tight mb-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#1E3A8A',
                          letterSpacing: '0.05em',
                        }}
                      >
                        ICSR
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '7.5px',
                        fontWeight: 600,
                        color: '#1E3A8A',
                        letterSpacing: '0.04em',
                      }}
                    >
                      INSTITUTE OF CANCER AND
                      <br />
                      STEM CELL RESEARCH
                    </p>
                  </div>
                )}

                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#7A2020',
                    marginTop: '2px',
                  }}
                >
                  Authorised Signatory
                </span>
                {doctorName && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>
                    {doctorName}
                  </span>
                )}
              </div>
            </div>

            {/* End of Report Centered */}
            <div className="mt-6 text-center">
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#111827',
                  letterSpacing: '0.03em',
                }}
              >
                --------End of Report ------
              </span>
            </div>
          </div>

          {/* Bottom Contact Details + Page 3 Footer */}
          <div>
            <div
              className="flex justify-between items-start px-8 mb-5"
              style={{ fontSize: '11.5px', color: '#111827', lineHeight: 1.45 }}
            >
              <div>
                <p>
                  <strong>Address -</strong>
                  {instSettings?.address || (
                    <>
                      M4 Mishika Tower Sampna
                      <br />
                      Sangeeta Indore M.P. 452001
                    </>
                  )}
                </p>
                <p className="mt-3">
                  <strong>Email -</strong> {instSettings?.email || 'icsrofficial@gmail.com'}
                </p>
              </div>

              <div>
                <p>
                  <strong>Website-</strong> {instSettings?.website || 'www.icsrofficial.com'}
                  <br />
                  <span className="pl-12">www.shantiavedna.com</span>
                </p>
                <p className="mt-3">
                  <strong>Contact no -</strong> {instSettings?.contact_number || '+91 7582950349'}
                </p>
              </div>
            </div>

            <PageFooterBar pageNumber={3} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default OxidativeReportDocument
