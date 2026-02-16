def _prepare_eval_data_global(df: pd.DataFrame) -> pd.DataFrame:
    """
    Replicates feature engineering from global_forecast.ipynb for evaluation.
    WINDOW = 7 for global forecast.
    """
    import pandas as pd
    import numpy as np
    
    BEHAVIOR_COLS = [
        "extracurricular_hour_per_day", "physical_activity_hour_per_day",
        "sleep_hour_per_day", "study_hour_per_day", "social_hour_per_day"
    ]
    
    # Check required columns
    for col in [DATE_COL, USER_COL, TARGET_COL]:
        if col not in df.columns:
            return pd.DataFrame()
            
    df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
    df = df.sort_values([USER_COL, DATE_COL]).reset_index(drop=True)
    
    rows = []
    for uid, g in df.groupby(USER_COL):
        g = g.sort_values(DATE_COL).reset_index(drop=True)

        # Calendar features
        g["dow"] = g[DATE_COL].dt.dayofweek.astype(int)
        g["is_weekend"] = (g["dow"] >= 5).astype(int)

        # Target lag features (t-1..t-W)
        for k in range(1, WINDOW + 1):
            g[f"lag_sp_{k}"] = g[TARGET_COL].shift(k)

        # Gap features (days between records)
        g["gap_days"] = g[DATE_COL].diff().dt.days
        for k in range(1, WINDOW + 1):
            g[f"gap_{k}"] = g["gap_days"].shift(k - 1)

        # Behavior lag1 (t-1)
        for c in BEHAVIOR_COLS:
            if c in g.columns:
                g[f"lag1_{c}"] = g[c].shift(1)
            else:
                g[f"lag1_{c}"] = 0.0

        # Rolling stats on stress level
        sp_shift = g[TARGET_COL].shift(1)
        g["sp_mean"] = sp_shift.rolling(WINDOW).mean()
        g["sp_std"]  = sp_shift.rolling(WINDOW).std().fillna(0.0)
        g["sp_min"]  = sp_shift.rolling(WINDOW).min()
        g["sp_max"]  = sp_shift.rolling(WINDOW).max()

        g["count_high"] = (sp_shift >= 1).rolling(WINDOW).sum()
        g["count_low"]  = (sp_shift == 0).rolling(WINDOW).sum()

        # High streak
        high = (sp_shift >= 1).astype(int).fillna(0).astype(int).tolist()
        streak, cur = [], 0
        for v in high:
            cur = cur + 1 if v == 1 else 0
            streak.append(cur)
        g["streak_high"] = streak

        # Transitions
        diff = (sp_shift != sp_shift.shift(1)).astype(int)
        g["transitions"] = diff.rolling(WINDOW).sum()

        rows.append(g)

    if not rows:
        return pd.DataFrame()
        
    feat = pd.concat(rows, ignore_index=True)
    
    # Feature columns
    feature_cols = (
        ["dow", "is_weekend"]
        + [f"lag_sp_{k}" for k in range(1, WINDOW + 1)]
        + [f"gap_{k}" for k in range(1, WINDOW + 1)]
        + [
            "sp_mean", "sp_std", "sp_min", "sp_max",
            "count_high", "count_low",
            "streak_high", "transitions",
        ]
    )
    # Add behavior lags
    for c in BEHAVIOR_COLS:
        if f"lag1_{c}" in feat.columns:
            feature_cols.append(f"lag1_{c}")
            
    # Keep target for evaluation
    final_cols = list(set(feature_cols)) + [TARGET_COL]
    
    # Drop rows with NaNs
    feat = feat.dropna(subset=feature_cols).reset_index(drop=True)
    
    # Ensure all columns exist
    for col in final_cols:
        if col not in feat.columns:
            feat[col] = 0  # Add missing columns with default value
    
    return feat[final_cols]
