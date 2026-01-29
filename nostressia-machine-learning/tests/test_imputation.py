from pathlib import Path
import sys

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from imputation import impute_latest_gpa_per_user


def test_impute_latest_gpa_per_user_uses_latest_value():
    df = pd.DataFrame(
        {
            "user_id": [1, 1, 1, 2, 2],
            "date": [
                "2024-01-01",
                "2024-01-02",
                "2024-01-03",
                "2024-01-01",
                "2024-01-02",
            ],
            "gpa": [3.2, None, 3.6, None, None],
        }
    )

    result = impute_latest_gpa_per_user(df)

    user1 = result[result["user_id"] == 1]["gpa"].tolist()
    user2 = result[result["user_id"] == 2]["gpa"].tolist()

    assert user1 == [3.2, 3.6, 3.6]
    assert pd.isna(user2).all()


def test_impute_latest_gpa_per_user_requires_columns():
    df = pd.DataFrame({"user_id": [1, 2], "date": ["2024-01-01", "2024-01-02"]})

    try:
        impute_latest_gpa_per_user(df)
    except ValueError as error:
        assert "DataFrame must include user and GPA columns." in str(error)
    else:
        raise AssertionError("Expected ValueError when GPA column is missing.")
