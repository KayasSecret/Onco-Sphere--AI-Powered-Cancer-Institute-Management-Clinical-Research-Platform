from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

class ReportParameterResponse(BaseModel):
    id: int
    template_id: int
    name: str
    code: str
    section: str
    reference_range: str
    default_interpretation: str
    unit: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True

class ReportTemplateResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    default_disclaimer: Optional[str] = None
    parameters: List[ReportParameterResponse] = []

    class Config:
        from_attributes = True

class ReportValueCreate(BaseModel):
    parameter_id: int
    parameter_code: Optional[str] = None
    result_value: float
    reference_range: str
    interpretation: str

class ReportCreateRequest(BaseModel):
    template_id: int
    patient_id: int
    doctor_name: str
    reference_by: str
    report_date: date
    sample_type: str
    collection_date: date
    lab_number: str
    overall_summary: Optional[str] = None
    status: Optional[str] = "Draft"
    damage_score: Optional[float] = 0.0
    defence_score: Optional[float] = 0.0
    ratio_score: Optional[float] = 0.0
    values: List[ReportValueCreate]

class ReportValueResponse(BaseModel):
    id: int
    parameter_id: int
    parameter_name: str
    parameter_code: str
    parameter_section: str
    parameter_unit: Optional[str] = None
    result_value: float
    reference_range: str
    interpretation: str

    class Config:
        from_attributes = True

class PatientMiniResponse(BaseModel):
    id: int
    patient_code: str
    full_name: str
    date_of_birth: date
    gender: str

    class Config:
        from_attributes = True

class UserMiniResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: int
    report_number: str
    template_id: int
    template_name: str
    template_code: str
    patient: PatientMiniResponse
    version: int
    status: str
    doctor_name: str
    reference_by: str
    report_date: date
    sample_type: str
    collection_date: date
    lab_number: str
    overall_summary: Optional[str] = None
    damage_score: float
    defence_score: float
    ratio_score: float
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserMiniResponse] = None
    updated_by: Optional[UserMiniResponse] = None
    values: List[ReportValueResponse] = []

    class Config:
        from_attributes = True

class ReportAuditLogResponse(BaseModel):
    id: int
    report_id: int
    report_number: str
    action: str
    user_name: str
    user_role: str
    timestamp: datetime

    class Config:
        from_attributes = True

class DoctorSignatureResponse(BaseModel):
    id: int
    doctor_name: str
    signature_url: str
    is_active: bool

    class Config:
        from_attributes = True

class DoctorSignatureCreate(BaseModel):
    doctor_name: str
    signature_url: str
    is_active: Optional[bool] = True

class DoctorSignatureUpdate(BaseModel):
    doctor_name: str
    signature_url: str
    is_active: Optional[bool] = True

class ReportParameterCreate(BaseModel):
    template_id: Optional[int] = None
    name: str
    code: str
    section: str
    reference_range: str
    default_interpretation: str
    unit: Optional[str] = ""
    display_order: Optional[int] = None

class ReportParameterUpdate(BaseModel):
    name: str
    section: str
    reference_range: str
    default_interpretation: str
    unit: Optional[str] = ""

class InstituteInfoResponse(BaseModel):
    id: int
    name: str
    logo_url: Optional[str] = None
    stamp_url: Optional[str] = None
    address: str
    website: str
    email: str
    contact_number: str

    class Config:
        from_attributes = True

class InstituteInfoUpdate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    stamp_url: Optional[str] = None
    address: str
    website: str
    email: str
    contact_number: str

class SettingsResponse(BaseModel):
    institute: Optional[InstituteInfoResponse] = None
    signatures: List[DoctorSignatureResponse] = []

    class Config:
        from_attributes = True
