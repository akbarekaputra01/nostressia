from pydantic import BaseModel

class PredictRequest(BaseModel):
    study_hours: float
    extracurricular_hours: float
    sleep_hours: float
    social_hours: float
    physical_hours: float
    gpa: float

class PredictResponse(BaseModel):
    result: str  # Isinya "Low", "Moderate", atau "High"
    message: str

    class Config:
        # Ini perbaikan untuk warning tadi (Pydantic V2)
        from_attributes = True