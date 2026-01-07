from sqlalchemy.orm import Session
from app.models.stress_log_model import StressLevel
from app.schemas.stress_schema import StressLogCreate

# Fungsi Create (Insert Data)
def create_stress_log(db: Session, stress_data: StressLogCreate, user_id: int):
    # Mapping data dari schema ke model database
    new_log = StressLevel(
        date=stress_data.date,
        stressLevel=stress_data.stressLevel,
        GPA=stress_data.GPA,
        extracurricularHourPerDay=stress_data.extracurricularHourPerDay,
        physicalActivityHourPerDay=stress_data.physicalActivityHourPerDay,
        sleepHourPerDay=stress_data.sleepHourPerDay,
        studyHourPerDay=stress_data.studyHourPerDay,
        socialHourPerDay=stress_data.socialHourPerDay,
        emoji=stress_data.emoji,
        userID=user_id  # <--- INI KUNCINYA (Diambil otomatis)
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

# Fungsi Get All by User (Select Data)
def get_user_stress_logs(db: Session, user_id: int):
    # Filter hanya data milik user tersebut
    return db.query(StressLevel).filter(StressLevel.userID == user_id).all()