from app.schemas.base_schema import BaseSchema

class PredictRequest(BaseSchema):
    study_hours: float
    extracurricular_hours: float
    sleep_hours: float
    social_hours: float
    physical_hours: float
    gpa: float

class PredictResponse(BaseSchema):
    result: str  # Expected values: "Low", "Moderate", or "High"
    message: str
