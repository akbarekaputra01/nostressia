from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.predict_schema import PredictRequest, PredictResponse
from app.services.ml_service import ml_service
# from app.models.stress_log_model import StressLog  <-- Nanti dinyalain kalau tabel Log udah ready
# from app.models.user_model import User

router = APIRouter(prefix="/predict", tags=["Machine Learning"])

@router.post("/current-stress", response_model=PredictResponse)
def predict_stress_level(
    request: PredictRequest, 
    db: Session = Depends(get_db)
):
    # 1. Ubah data request jadi dictionary buat ML
    input_data = {
        "study_hours": request.study_hours,
        "extracurricular_hours": request.extracurricular_hours,
        "sleep_hours": request.sleep_hours,
        "social_hours": request.social_hours,
        "physical_hours": request.physical_hours,
        "gpa": request.gpa
    }

    # 2. Panggil ML Service
    result = ml_service.predict_stress(input_data)

    if result == "Error":
        raise HTTPException(status_code=500, detail="Terjadi kesalahan pada model ML")
    
    # 3. Balikin hasil
    return {
        "result": result,
        "message": f"Tingkat stres kamu terdeteksi: {result}"
    }