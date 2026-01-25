from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.stress_log_model import StressLevel
from app.models.diary_model import Diary
from app.models.user_model import User
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response
from app.schemas.analytics_schema import AnalyticsSummaryResponse
from app.schemas.response_schema import APIResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=APIResponse[AnalyticsSummaryResponse])
def get_user_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stress_logs_count = (
        db.query(StressLevel).filter(StressLevel.user_id == current_user.user_id).count()
    )
    diary_count = db.query(Diary).filter(Diary.user_id == current_user.user_id).count()

    return success_response(
        data={
            "stressLogsCount": stress_logs_count,
            "diaryCount": diary_count,
            "streak": current_user.streak,
        },
        message="Analytics summary fetched",
    )
