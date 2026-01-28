from __future__ import annotations

import pandas as pd


def impute_latest_gpa_per_user(
    df: pd.DataFrame,
    *,
    user_col: str = "user_id",
    gpa_col: str = "gpa",
    date_col: str = "date",
) -> pd.DataFrame:
    """
    Impute missing GPA values with the latest known GPA per user.

    The "latest" GPA is determined by sorting by the date column (if present)
    and selecting the most recent non-null GPA for each user. Users without any
    GPA remain null.
    """
    if user_col not in df.columns or gpa_col not in df.columns:
        raise ValueError("DataFrame must include user and GPA columns.")

    working = df.copy()
    if date_col in working.columns:
        working[date_col] = pd.to_datetime(working[date_col], errors="coerce")
        working = working.sort_values([user_col, date_col])
    else:
        working = working.sort_values([user_col])

    def _latest_non_null(series: pd.Series) -> float | None:
        non_null = series.dropna()
        if non_null.empty:
            return None
        return float(non_null.iloc[-1])

    latest_by_user = (
        working.groupby(user_col)[gpa_col]
        .apply(_latest_non_null)
        .to_dict()
    )

    working[gpa_col] = working[gpa_col].fillna(working[user_col].map(latest_by_user))
    return working
