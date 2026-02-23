#!/usr/bin/env python3
"""Generate eight EDA plots for Current Stress and Forecast datasets (all users)."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.decomposition import PCA
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
    user_df = forecast_df.sort_values(["user_id", "date"])

    fig, ax = plt.subplots(figsize=(10, 5))
    sns.lineplot(data=user_df, x="date", y="stress_level", hue="user_id", marker="o", palette="tab10", ax=ax)

    ax.set_title("Temporal Pattern — All Users")
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


def plot_autocorrelation(forecast_df, out_dir):
    """Plot average autocorrelation of stress_level across all users up to 7 days lag."""
    lags = range(1, 8)
    acf_values = {lag: [] for lag in lags}
    
    for uid, group in forecast_df.groupby("user_id"):
        group = group.sort_values("date")
        if len(group) > max(lags):
            for lag in lags:
                corr = group["stress_level"].autocorr(lag=lag)
                if not np.isnan(corr):
                    acf_values[lag].append(corr)
                    
    avg_acf = {lag: np.mean(vals) for lag, vals in acf_values.items() if vals}
    
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(avg_acf.keys(), avg_acf.values(), color="skyblue", edgecolor="black")
    ax.set_title("Average Autocorrelation of Stress Level (1-7 Days)")
    ax.set_xlabel("Lag (Days)")
    ax.set_ylabel("Average Autocorrelation")
    ax.set_ylim(-0.5, 1)
    ax.axhline(0, color="black", linewidth=1.2)
    
    for lag, val in avg_acf.items():
        vpos = val + 0.02 if val >= 0 else val - 0.08
        ax.text(lag, vpos, f"{val:.2f}", ha="center", fontweight="bold")
    
    fig.tight_layout()
    fig.savefig(out_dir / "08_autocorrelation_analysis.png", dpi=180)
    plt.close(fig)


# ================= MAIN =================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=ROOT / "eda_plots")
    args = parser.parse_args()

    _ensure_dir(args.output_dir)

    current_df, forecast_df = load_datasets()

    # Use all users
    if forecast_df.empty:
        raise ValueError("Dataset forecast kosong")

    plot_stress_distribution(current_df, args.output_dir)
    plot_correlation_heatmap(current_df, args.output_dir)
    plot_scaling_necessity(current_df, args.output_dir)
    plot_pca_separability(current_df, args.output_dir)

    plot_temporal_pattern(forecast_df, args.output_dir)
    plot_transition_heatmap(forecast_df, args.output_dir)
    plot_class_balance(forecast_df, args.output_dir)
    plot_autocorrelation(forecast_df, args.output_dir)

    print("Generated 8 plots (All Users)")


if __name__ == "__main__":
    main()