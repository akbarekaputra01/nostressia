#!/usr/bin/env python3
"""Generate eight EDA plots for Current Stress and Forecast datasets (user_id=4 only)."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
CURRENT_STRESS_PATH = ROOT / "Current-Stress" / "datasets" / "preprocessed" / "student_lifestyle_dataset_preprocessed.csv"
FORECAST_PATH = ROOT / "Stress-Forecast" / "datasets" / "stress_forecast.csv"

sns.set_theme(style="whitegrid")


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_datasets() -> tuple[pd.DataFrame, pd.DataFrame]:
    current_df = pd.read_csv(CURRENT_STRESS_PATH)
    forecast_df = pd.read_csv(FORECAST_PATH)
    forecast_df["date"] = pd.to_datetime(forecast_df["date"], errors="coerce")
    return current_df, forecast_df


# ================= CURRENT STRESS =================

def plot_stress_distribution(current_df, out_dir):
    fig, ax = plt.subplots(figsize=(8, 5))
    counts = current_df["Stress_Level_Encoded"].value_counts().sort_index()
    labels = ["Low", "Moderate", "High"][: len(counts)]

    chart_df = pd.DataFrame({"Stress Level": labels, "Count": counts.values})

    sns.barplot(data=chart_df, x="Stress Level", y="Count", hue="Stress Level",
                palette="Blues", legend=False, ax=ax)

    ax.set_title("Stress Level Distribution")
    ax.set_xlabel("Stress Level")
    ax.set_ylabel("Count")

    fig.tight_layout()
    fig.savefig(out_dir / "01_stress_level_distribution.png", dpi=180)
    plt.close(fig)


def plot_correlation_heatmap(current_df, out_dir):
    fig, ax = plt.subplots(figsize=(10, 7))
    corr = current_df.drop(columns=["Student_ID"], errors="ignore").corr(numeric_only=True)

    sns.heatmap(corr, cmap="coolwarm", center=0, annot=True, fmt=".2f", ax=ax)
    ax.set_title("Feature Correlation Heatmap")

    fig.tight_layout()
    fig.savefig(out_dir / "02_feature_correlation_heatmap.png", dpi=180)
    plt.close(fig)


def plot_scaling_necessity(current_df, out_dir):
    features = [
        "Study_Hours_Per_Day",
        "Extracurricular_Hours_Per_Day",
        "Sleep_Hours_Per_Day",
        "Social_Hours_Per_Day",
        "Physical_Activity_Hours_Per_Day",
        "GPA",
    ]

    melted = current_df[features].melt(var_name="Feature", value_name="Value")

    fig, ax = plt.subplots(figsize=(11, 5))
    sns.boxplot(data=melted, x="Feature", y="Value",
                hue="Feature", dodge=False, legend=False, ax=ax)

    ax.set_title("Scaling Necessity Visualization")
    ax.tick_params(axis="x", rotation=25)

    fig.tight_layout()
    fig.savefig(out_dir / "03_scaling_necessity_visualization.png", dpi=180)
    plt.close(fig)


def plot_pca_separability(current_df, out_dir):
    features = [
        "Study_Hours_Per_Day",
        "Extracurricular_Hours_Per_Day",
        "Sleep_Hours_Per_Day",
        "Social_Hours_Per_Day",
        "Physical_Activity_Hours_Per_Day",
        "GPA",
    ]

    X = current_df[features].to_numpy()
    y = current_df["Stress_Level_Encoded"].to_numpy()

    X_scaled = StandardScaler().fit_transform(X)
    comp = PCA(n_components=2, random_state=42).fit_transform(X_scaled)

    pca_df = pd.DataFrame({"PC1": comp[:, 0], "PC2": comp[:, 1], "Stress": y})

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.scatterplot(data=pca_df, x="PC1", y="PC2", hue="Stress", ax=ax)

    ax.set_title("PCA 2D Separability")

    fig.tight_layout()
    fig.savefig(out_dir / "04_pca_2d_separability_multiclass.png", dpi=180)
    plt.close(fig)


# ================= FORECAST =================

def _build_transition_matrix(forecast_df):
    ordered = forecast_df.sort_values(["user_id", "date"]).copy()
    ordered["next_state"] = ordered.groupby("user_id")["stress_level"].shift(-1)
    transitions = ordered.dropna(subset=["next_state"])

    counts = pd.crosstab(transitions["stress_level"], transitions["next_state"])
    probs = counts.div(counts.sum(axis=1), axis=0).fillna(0)

    probs.index = [f"state_{int(x)}" for x in probs.index]
    probs.columns = [f"state_{int(x)}" for x in probs.columns]

    return probs


def plot_temporal_pattern(forecast_df, out_dir):
    user_df = forecast_df.sort_values("date")

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(user_df["date"], user_df["stress_level"], marker="o")

    ax.set_title("Temporal Pattern — user_id=4")
    ax.set_xlabel("Date")
    ax.set_ylabel("Stress Level")
    ax.set_yticks([0, 1, 2])

    fig.autofmt_xdate()
    fig.tight_layout()
    fig.savefig(out_dir / "05_temporal_pattern_example_user_timeline.png", dpi=180)
    plt.close(fig)


def plot_transition_heatmap(forecast_df, out_dir):
    matrix = _build_transition_matrix(forecast_df)

    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(matrix, annot=True, fmt=".2f", cmap="Blues", ax=ax)

    ax.set_title("Transition Matrix Heatmap")
    ax.set_xlabel("Next State")
    ax.set_ylabel("Current State")

    fig.tight_layout()
    fig.savefig(out_dir / "06_transition_matrix_heatmap.png", dpi=180)
    plt.close(fig)


def plot_class_balance(forecast_df, out_dir):
    high = (forecast_df["stress_level"] == 2).sum()
    low = (forecast_df["stress_level"] != 2).sum()

    df = pd.DataFrame({"Class": ["Low Risk", "High Risk"], "Count": [low, high]})

    fig, ax = plt.subplots(figsize=(6, 5))
    sns.barplot(data=df, x="Class", y="Count", hue="Class", legend=False, ax=ax)

    ax.set_title("Class Balance")

    fig.tight_layout()
    fig.savefig(out_dir / "07_class_balance_high_vs_low_risk.png", dpi=180)
    plt.close(fig)


# ⭐ FIXED VERSION (NO OVERLAP)
def plot_f1_threshold_sweep(forecast_df, out_dir):
    features = [
        "gpa",
        "extracurricular_hour_per_day",
        "physical_activity_hour_per_day",
        "sleep_hour_per_day",
        "study_hour_per_day",
        "social_hour_per_day",
        "emoji",
    ]

    data = forecast_df.dropna(subset=features + ["stress_level"])

    X = data[features]
    y = (data["stress_level"] == 2).astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]

    thresholds = np.arange(0.05, 1.0, 0.05)
    f1_values = [f1_score(y_test, (probs >= t).astype(int), zero_division=0)
                 for t in thresholds]

    fig, ax = plt.subplots(figsize=(8, 5))

    ax.plot(thresholds, f1_values, marker="o")

    best_idx = int(np.argmax(f1_values))
    best_t = thresholds[best_idx]
    best_f1 = f1_values[best_idx]

    ax.scatter(best_t, best_f1, zorder=5)
    ax.axvline(best_t, linestyle="--", alpha=0.4)

    ax.annotate(
        f"best={best_t:.2f}, F1={best_f1:.2f}",
        (best_t, best_f1),
        xytext=(10, -15),
        textcoords="offset points",
    )

    ax.set_title("F1 vs Threshold Sweep (0.05 → 0.95)", pad=15)
    ax.set_xlabel("Threshold")
    ax.set_ylabel("F1 Score")

    ax.set_xlim(0.05, 0.95)
    ax.set_ylim(0, 1.05)  # extra space biar ga nabrak
    ax.grid(alpha=0.3)

    fig.tight_layout(pad=2)
    fig.savefig(out_dir / "08_f1_vs_threshold_sweep.png", dpi=180)
    plt.close(fig)


# ================= MAIN =================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=ROOT / "eda_plots")
    args = parser.parse_args()

    _ensure_dir(args.output_dir)

    current_df, forecast_df = load_datasets()

    # FILTER USER 4
    forecast_df = forecast_df[forecast_df["user_id"] == 4]

    if forecast_df.empty:
        raise ValueError("user_id=4 tidak ditemukan")

    plot_stress_distribution(current_df, args.output_dir)
    plot_correlation_heatmap(current_df, args.output_dir)
    plot_scaling_necessity(current_df, args.output_dir)
    plot_pca_separability(current_df, args.output_dir)

    plot_temporal_pattern(forecast_df, args.output_dir)
    plot_transition_heatmap(forecast_df, args.output_dir)
    plot_class_balance(forecast_df, args.output_dir)
    plot_f1_threshold_sweep(forecast_df, args.output_dir)

    print("Generated 8 plots (user_id=4)")


if __name__ == "__main__":
    main()