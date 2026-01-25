from app.schemas.base_schema import BaseSchema


class AnalyticsSummaryResponse(BaseSchema):
    stress_logs_count: int
    diary_count: int
    streak: int
