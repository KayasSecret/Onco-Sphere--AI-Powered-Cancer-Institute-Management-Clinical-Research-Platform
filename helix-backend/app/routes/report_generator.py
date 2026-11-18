from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database.db import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.report_generator import (
    ReportTemplate,
    ReportParameter,
    Report,
    ReportValue,
    ReportAuditLog,
    DoctorSignature,
    InstituteInfo,
)
from app.schemas.report_generator import (
    ReportTemplateResponse,
    ReportCreateRequest,
    ReportResponse,
    ReportValueResponse,
    PatientMiniResponse,
    UserMiniResponse,
    InstituteInfoResponse,
    InstituteInfoUpdate,
    DoctorSignatureResponse,
    DoctorSignatureCreate,
    ReportAuditLogResponse,
    SettingsResponse,
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Report Generator"])

DEFAULT_OXIDATIVE_SUMMARY = (
    "The Damage vs. Defense Ratio (DDR) summarizes the body's oxidative stress by comparing total "
    "oxidative damage to antioxidant capacity. It is calculated as (MDA + FOX-2 + Protein Carbonyl + "
    "Nitric Oxide) / (GSH + TAC). A low DDR indicates that antioxidants effectively counteract oxidative "
    "damage; a moderate DDR suggests that oxidative stress is present and defenses are partially "
    "overwhelmed; and a high DDR indicates that damage exceeds the body's protective capacity, reflecting "
    "severe oxidative stress and higher risk for cellular dysfunction or disease."
)

DEFAULT_OXIDATIVE_DISCLAIMER = (
    "The information provided by this panel reflects biochemical markers of oxidative balance and is "
    "intended for clinical research or monitoring purposes. It should be considered alongside comprehensive "
    "oncology clinical evaluation and not as a standalone diagnostic tool."
)

DEFAULT_OXIDATIVE_PARAMETERS = [
    {
        "name": "Lipid Peroxidation — MDA (TBARS)",
        "code": "MDA",
        "section": "Oxidative Damage",
        "reference_range": "0.5 - 2.0 µmol/L",
        "default_interpretation": "Normal lipid peroxidation level",
        "unit": "µmol/L",
        "display_order": 1,
    },
    {
        "name": "Lipid Hydroperoxides — FOX-2 Assay",
        "code": "FOX2",
        "section": "Oxidative Damage",
        "reference_range": "2.0 - 10.0 µmol/L",
        "default_interpretation": "Within physiological hydroperoxide range",
        "unit": "µmol/L",
        "display_order": 2,
    },
    {
        "name": "Protein Carbonyl Content (DNPH)",
        "code": "DNPH",
        "section": "Oxidative Damage",
        "reference_range": "0.5 - 2.5 nmol/mg",
        "default_interpretation": "Normal protein oxidative modification",
        "unit": "nmol/mg",
        "display_order": 3,
    },
    {
        "name": "Nitric Oxide Metabolites (Griess Assay)",
        "code": "GRIESS",
        "section": "Oxidative Damage",
        "reference_range": "20.0 - 40.0 µmol/L",
        "default_interpretation": "Normal nitrosative stress marker",
        "unit": "µmol/L",
        "display_order": 4,
    },
    {
        "name": "Reduced Glutathione (GSH)",
        "code": "GSH",
        "section": "Antioxidant Defence",
        "reference_range": "650 - 1100 µmol/L",
        "default_interpretation": "Adequate intracellular glutathione reserve",
        "unit": "µmol/L",
        "display_order": 5,
    },
    {
        "name": "Total Antioxidant Capacity (TAC)",
        "code": "TAC",
        "section": "Antioxidant Defence",
        "reference_range": "600 - 1200 µmol/L",
        "default_interpretation": "Optimal plasma antioxidant capacity",
        "unit": "µmol/L",
        "display_order": 6,
    },
]


def ensure_oxidative_stress_template(db: Session) -> None:
    """Idempotently ensures the OXIDATIVE_STRESS template and all 6 parameters exist."""
    tpl = db.query(ReportTemplate).filter(ReportTemplate.code == "OXIDATIVE_STRESS").first()
    if not tpl:
        tpl = ReportTemplate(
            name="Oxidative Stress & Antioxidant Defence Panel",
            code="OXIDATIVE_STRESS",
            description=DEFAULT_OXIDATIVE_SUMMARY,
            default_disclaimer=DEFAULT_OXIDATIVE_DISCLAIMER,
        )
        db.add(tpl)
        db.commit()
        db.refresh(tpl)

    existing_codes = {p.code for p in tpl.parameters}
    added_any = False
    for p_def in DEFAULT_OXIDATIVE_PARAMETERS:
        if p_def["code"] not in existing_codes:
            db.add(
                ReportParameter(
                    template_id=tpl.id,
                    name=p_def["name"],
                    code=p_def["code"],
                    section=p_def["section"],
                    reference_range=p_def["reference_range"],
                    default_interpretation=p_def["default_interpretation"],
                    unit=p_def["unit"],
                    display_order=p_def["display_order"],
                )
            )
            added_any = True
    if added_any:
        db.commit()


# 1. Get Templates and Parameters
@router.get("/templates", response_model=List[ReportTemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    ensure_oxidative_stress_template(db)
    templates = db.query(ReportTemplate).all()
    return templates

# 2. Get Settings (Institute info & signatures)
@router.get("/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    inst = db.query(InstituteInfo).first()
    signatures = db.query(DoctorSignature).filter(DoctorSignature.is_active == True).all()
    
    return {
        "institute": inst,
        "signatures": signatures
    }

# 3. Save/Update Institute Settings
@router.post("/settings", response_model=InstituteInfoResponse)
def update_institute_settings(
    payload: InstituteInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inst = db.query(InstituteInfo).first()
    if not inst:
        inst = InstituteInfo(
            name=payload.name,
            logo_url=payload.logo_url,
            stamp_url=payload.stamp_url,
            address=payload.address,
            website=payload.website,
            email=payload.email,
            contact_number=payload.contact_number,
        )
        db.add(inst)
    else:
        inst.name = payload.name
        inst.logo_url = payload.logo_url
        inst.stamp_url = payload.stamp_url
        inst.address = payload.address
        inst.website = payload.website
        inst.email = payload.email
        inst.contact_number = payload.contact_number
        
    db.commit()
    db.refresh(inst)
    return inst

# 4. Add Doctor Signature
@router.post("/signature", response_model=DoctorSignatureResponse)
def add_signature(
    payload: DoctorSignatureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Deactivate other signatures if required, or allow multiple active
    new_sig = DoctorSignature(
        doctor_name=payload.doctor_name,
        signature_url=payload.signature_url,
        is_active=payload.is_active,
    )
    db.add(new_sig)
    db.commit()
    db.refresh(new_sig)
    return new_sig

# Helper to generate unique report number
def generate_report_number(db: Session) -> str:
    today_str = date.today().strftime("%Y%m%d")
    prefix = f"REP-{today_str}-"
    
    # Query database for reports created today
    today_reports_count = db.query(Report).filter(
        Report.report_number.like(f"{prefix}%")
    ).distinct(Report.report_number).count()
    
    seq = today_reports_count + 1
    return f"{prefix}{seq:04d}"

# 5. Create / Edit Report
@router.post("", response_model=ReportResponse)
def create_or_version_report(
    payload: ReportCreateRequest,
    existing_report_number: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Determine version and report number
    if existing_report_number:
        # Check if the report exists
        latest_report = db.query(Report).filter(
            Report.report_number == existing_report_number
        ).order_by(Report.version.desc()).first()
        
        if not latest_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report number {existing_report_number} not found."
            )
        
        report_number = existing_report_number
        version = latest_report.version + 1
        action_type = "Updated"
    else:
        report_number = generate_report_number(db)
        version = 1
        action_type = "Created"

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found."
        )

    # Verify template exists
    template = db.query(ReportTemplate).filter(ReportTemplate.id == payload.template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report template not found."
        )

    # Build new Report
    new_report = Report(
        report_number=report_number,
        template_id=payload.template_id,
        patient_id=payload.patient_id,
        version=version,
        status=payload.status,
        doctor_name=payload.doctor_name,
        reference_by=payload.reference_by,
        report_date=payload.report_date,
        sample_type=payload.sample_type,
        collection_date=payload.collection_date,
        lab_number=payload.lab_number,
        overall_summary=payload.overall_summary,
        damage_score=payload.damage_score,
        defence_score=payload.defence_score,
        ratio_score=payload.ratio_score,
        created_by_id=current_user.id,
        updated_by_id=current_user.id if version > 1 else None,
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Add Report Values
    for val in payload.values:
        # Check parameter exists
        param = db.query(ReportParameter).filter(
            ReportParameter.id == val.parameter_id
        ).first()
        
        if not param:
            # Cleanup report before throwing
            db.delete(new_report)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parameter ID {val.parameter_id} is invalid."
            )
            
        r_val = ReportValue(
            report_id=new_report.id,
            parameter_id=val.parameter_id,
            result_value=val.result_value,
            reference_range=val.reference_range,
            interpretation=val.interpretation,
        )
        db.add(r_val)
        
    db.commit()
    
    # Audit log
    audit_log = ReportAuditLog(
        report_id=new_report.id,
        report_number=report_number,
        action=f"{action_type} (v{version})",
        user_name=current_user.full_name,
        user_role=current_user.role,
    )
    db.add(audit_log)
    db.commit()

    return get_report_by_id(new_report.id, db)

# Helper to construct full ReportResponse
def get_report_by_id(report_id: int, db: Session) -> ReportResponse:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )

    # Build response model manually to satisfy nested attributes
    values_response = []
    for val in report.values:
        values_response.append(
            ReportValueResponse(
                id=val.id,
                parameter_id=val.parameter_id,
                parameter_name=val.parameter.name,
                parameter_code=val.parameter.code,
                parameter_section=val.parameter.section,
                parameter_unit=val.parameter.unit,
                result_value=val.result_value,
                reference_range=val.reference_range,
                interpretation=val.interpretation,
            )
        )

    patient_mini = PatientMiniResponse(
        id=report.patient.id,
        patient_code=report.patient.patient_code,
        full_name=report.patient.full_name,
        date_of_birth=report.patient.date_of_birth,
        gender=report.patient.gender,
    )

    created_by_mini = UserMiniResponse(
        id=report.created_by.id,
        full_name=report.created_by.full_name,
        email=report.created_by.email,
    ) if report.created_by else None

    updated_by_mini = UserMiniResponse(
        id=report.updated_by.id,
        full_name=report.updated_by.full_name,
        email=report.updated_by.email,
    ) if report.updated_by else None

    return ReportResponse(
        id=report.id,
        report_number=report.report_number,
        template_id=report.template_id,
        template_name=report.template.name,
        template_code=report.template.code,
        patient=patient_mini,
        version=report.version,
        status=report.status,
        doctor_name=report.doctor_name,
        reference_by=report.reference_by,
        report_date=report.report_date,
        sample_type=report.sample_type,
        collection_date=report.collection_date,
        lab_number=report.lab_number,
        overall_summary=report.overall_summary,
        damage_score=report.damage_score,
        defence_score=report.defence_score,
        ratio_score=report.ratio_score,
        created_at=report.created_at,
        updated_at=report.updated_at,
        created_by=created_by_mini,
        updated_by=updated_by_mini,
        values=values_response,
    )

# 6. Fetch single report by database ID
@router.get("/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    return get_report_by_id(id, db)

# 7. Search/List Reports
@router.get("", response_model=dict)
def list_reports(
    patient_id: Optional[int] = None,
    search: Optional[str] = None,
    report_date: Optional[date] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    query = db.query(Report)
    
    if patient_id:
        query = query.filter(Report.patient_id == patient_id)
        
    if search:
        # Search by patient name, patient code, or report number
        query = query.join(Patient).filter(
            (Patient.full_name.like(f"%{search}%")) |
            (Patient.patient_code.like(f"%{search}%")) |
            (Report.report_number.like(f"%{search}%"))
        )
        
    if report_date:
        query = query.filter(Report.report_date == report_date)
        
    # Order by newest first
    query = query.order_by(Report.created_at.desc())
    
    # Calculate offset
    total = query.count()
    offset = (page - 1) * limit
    reports_raw = query.offset(offset).limit(limit).all()
    
    reports_response = []
    for r in reports_raw:
        # Load details
        reports_response.append(get_report_by_id(r.id, db))
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "reports": reports_response,
    }

# 8. Record audit log for printing
@router.post("/{id}/print-log")
def log_print_action(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
        
    # Log print action
    audit_log = ReportAuditLog(
        report_id=report.id,
        report_number=report.report_number,
        action=f"Printed (v{report.version})",
        user_name=current_user.full_name,
        user_role=current_user.role,
    )
    db.add(audit_log)
    db.commit()
    return {"message": "Print action audited successfully."}

# 9. Get audit logs for a report number
@router.get("/history/{report_number}", response_model=List[ReportAuditLogResponse])
def get_report_audit_history(report_number: str, db: Session = Depends(get_db)):
    logs = db.query(ReportAuditLog).filter(
        ReportAuditLog.report_number == report_number
    ).order_by(ReportAuditLog.timestamp.desc()).all()
    return logs

# 10. Get report versions list for a report number
@router.get("/versions/{report_number}", response_model=List[ReportResponse])
def get_report_versions(report_number: str, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(
        Report.report_number == report_number
    ).order_by(Report.version.desc()).all()
    
    versions = []
    for r in reports:
        versions.append(get_report_by_id(r.id, db))
    return versions

# 11. Delete Report (Super Admin only)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete reports."
        )
        
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
        
    # Log deletion
    audit_log = ReportAuditLog(
        report_id=report.id,
        report_number=report.report_number,
        action=f"Deleted (v{report.version})",
        user_name=current_user.full_name,
        user_role=current_user.role,
    )
    db.add(audit_log)
    db.delete(report)
    db.commit()
    return None
