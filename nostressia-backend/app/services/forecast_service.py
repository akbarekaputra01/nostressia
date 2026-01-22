from app.schemas.stress_schema import EligibilityResponse


def build_global_forecast_payload(eligibility: EligibilityResponse) -> dict:
    return {
        "message": "Global forecast not integrated yet.",
        "eligibility": eligibility.model_dump(by_alias=True),
    }
