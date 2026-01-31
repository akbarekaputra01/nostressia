"""Model registration helpers."""


def register_models() -> None:
    """Import model modules so SQLAlchemy can register them with metadata."""
    from app.models.admin_model import Admin  # noqa: F401
    from app.models.bookmark_model import Bookmark  # noqa: F401
    from app.models.diary_model import Diary  # noqa: F401
    from app.models.motivation_model import Motivation  # noqa: F401
    from app.models.model_registry_model import ModelRegistry  # noqa: F401
    from app.models.push_delivery_log_model import PushDeliveryLog  # noqa: F401
    from app.models.push_subscription_model import PushSubscription  # noqa: F401
    from app.models.stress_log_model import StressLevel  # noqa: F401
    from app.models.training_job_model import TrainingJob  # noqa: F401
    from app.models.tips_model import Tips, TipsCategory  # noqa: F401
    from app.models.user_model import User  # noqa: F401
