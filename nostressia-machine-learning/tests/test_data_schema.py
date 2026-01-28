from pathlib import Path

import pandas as pd


def test_current_stress_raw_schema():
    dataset = Path("Current-Stress/datasets/raw/student_lifestyle_dataset.csv")
    assert dataset.exists(), "Raw current stress dataset is missing."
    df = pd.read_csv(dataset)
    expected_columns = {
        "Student_ID",
        "Study_Hours_Per_Day",
        "Extracurricular_Hours_Per_Day",
        "Sleep_Hours_Per_Day",
        "Social_Hours_Per_Day",
        "Physical_Activity_Hours_Per_Day",
        "GPA",
        "Stress_Level",
    }
    assert expected_columns.issubset(df.columns)


def test_current_stress_preprocessed_schema():
    dataset = Path("Current-Stress/datasets/preprocessed/student_lifestyle_dataset_preprocessed.csv")
    assert dataset.exists(), "Preprocessed current stress dataset is missing."
    df = pd.read_csv(dataset)
    expected_columns = {
        "Student_ID",
        "Study_Hours_Per_Day",
        "Extracurricular_Hours_Per_Day",
        "Sleep_Hours_Per_Day",
        "Social_Hours_Per_Day",
        "Physical_Activity_Hours_Per_Day",
        "GPA",
        "Stress_Level_Encoded",
        "Academic_Performance_Encoded",
    }
    assert expected_columns.issubset(df.columns)


def test_stress_forecast_schema():
    dataset = Path("Stress-Forecast/datasets/stress_forecast.csv")
    assert dataset.exists(), "Stress forecast dataset is missing."
    df = pd.read_csv(dataset)
    expected_columns = {
        "stress_level_id",
        "user_id",
        "date",
        "stress_level",
        "gpa",
        "extracurricular_hour_per_day",
        "physical_activity_hour_per_day",
        "sleep_hour_per_day",
        "study_hour_per_day",
        "social_hour_per_day",
        "emoji",
        "is_restored",
        "created_at",
    }
    assert expected_columns.issubset(df.columns)
