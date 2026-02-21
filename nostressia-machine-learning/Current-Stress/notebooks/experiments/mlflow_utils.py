from __future__ import annotations

import json
import random
import shutil
import tempfile
from time import perf_counter
from pathlib import Path
from typing import Any

import mlflow
import numpy as np
import pandas as pd
from mlflow.exceptions import MlflowException
from mlflow.tracking import MlflowClient
from mlflow.data import from_pandas
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

import matplotlib.pyplot as plt

RANDOM_STATE = 42
TEST_SIZE = 0.2
EXPERIMENT_NAME = "Current Stress"
DATASET_NAME = "current_stress_v1"
DATASET_VERSION = "v1"


def resolve_repo_root() -> Path:
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        if (parent / "nostressia-machine-learning").exists() and (parent / "nostressia-backend").exists():
            return parent
    return cwd


def configure_mlflow() -> Path:
    repo_root = resolve_repo_root()
    mlruns_dir = (repo_root / "mlruns").resolve()
    tracking_uri = "file:" + str(mlruns_dir).replace("\\", "/")
    mlflow.set_tracking_uri(tracking_uri)

    client = MlflowClient()
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)

    if experiment and experiment.lifecycle_stage == "deleted":
        trash_experiment_dir = mlruns_dir / ".trash" / experiment.experiment_id
        if trash_experiment_dir.exists():
            shutil.rmtree(trash_experiment_dir)

    try:
        mlflow.set_experiment(EXPERIMENT_NAME)
    except MlflowException as exc:
        if "deleted experiment" not in str(exc).lower():
            raise
        recovered_experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
        if recovered_experiment and recovered_experiment.lifecycle_stage == "deleted":
            client.restore_experiment(recovered_experiment.experiment_id)
        mlflow.set_experiment(EXPERIMENT_NAME)
    return repo_root


def set_seeds(seed: int = RANDOM_STATE) -> None:
    random.seed(seed)
    np.random.seed(seed)


def build_preprocessor(num_cols: list[str], cat_cols: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
        ],
        remainder="drop",
    )


def evaluate_classification(y_true, y_pred, y_proba=None) -> dict[str, float]:
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_macro": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "precision_weighted": precision_score(y_true, y_pred, average="weighted", zero_division=0),
        "recall_macro": recall_score(y_true, y_pred, average="macro", zero_division=0),
        "recall_weighted": recall_score(y_true, y_pred, average="weighted", zero_division=0),
        "f1_macro": f1_score(y_true, y_pred, average="macro", zero_division=0),
        "f1_weighted": f1_score(y_true, y_pred, average="weighted", zero_division=0),
        "balanced_accuracy": balanced_accuracy_score(y_true, y_pred),
        "mcc": matthews_corrcoef(y_true, y_pred),
    }
    if y_proba is not None:
        try:
            metrics["roc_auc_ovr_weighted"] = roc_auc_score(y_true, y_proba, multi_class="ovr", average="weighted")
            metrics["log_loss"] = log_loss(y_true, y_proba)
            confidence = np.max(np.asarray(y_proba), axis=1)
            metrics["confidence_p50"] = float(np.percentile(confidence, 50))
            metrics["confidence_p90"] = float(np.percentile(confidence, 90))
            metrics["confidence_p95"] = float(np.percentile(confidence, 95))
            metrics["confidence_p99"] = float(np.percentile(confidence, 99))
        except ValueError:
            pass
    return {k: float(v) for k, v in metrics.items()}



def measure_latency_percentiles(model, X: pd.DataFrame, include_predict_proba: bool = True, max_samples: int = 200) -> dict[str, float]:
    sample = X.head(max_samples)
    predict_latencies_ms: list[float] = []

    for i in range(len(sample)):
        row = sample.iloc[[i]]
        start = perf_counter()
        model.predict(row)
        predict_latencies_ms.append((perf_counter() - start) * 1000.0)

    metrics = {
        "latency_predict_p50_ms": float(np.percentile(predict_latencies_ms, 50)),
        "latency_predict_p90_ms": float(np.percentile(predict_latencies_ms, 90)),
        "latency_predict_p95_ms": float(np.percentile(predict_latencies_ms, 95)),
        "latency_predict_p99_ms": float(np.percentile(predict_latencies_ms, 99)),
    }

    if include_predict_proba and hasattr(model, "predict_proba"):
        proba_latencies_ms: list[float] = []
        for i in range(len(sample)):
            row = sample.iloc[[i]]
            start = perf_counter()
            model.predict_proba(row)
            proba_latencies_ms.append((perf_counter() - start) * 1000.0)

        metrics.update({
            "latency_predict_proba_p50_ms": float(np.percentile(proba_latencies_ms, 50)),
            "latency_predict_proba_p90_ms": float(np.percentile(proba_latencies_ms, 90)),
            "latency_predict_proba_p95_ms": float(np.percentile(proba_latencies_ms, 95)),
            "latency_predict_proba_p99_ms": float(np.percentile(proba_latencies_ms, 99)),
        })

    return metrics

def log_classification_artifacts(y_true, y_pred, output_dir: Path, y_proba=None, prefix: str = "test") -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    ConfusionMatrixDisplay(confusion_matrix=cm).plot(ax=ax, cmap="Blues", colorbar=False)
    ax.set_title(f"{prefix.title()} Confusion Matrix")
    fig.tight_layout()
    fig.savefig(output_dir / f"{prefix}_confusion_matrix.png", dpi=160)
    plt.close(fig)

    report_dict = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    report_text = classification_report(y_true, y_pred, digits=4, zero_division=0)
    (output_dir / f"{prefix}_classification_report.json").write_text(json.dumps(report_dict, indent=2), encoding="utf-8")
    (output_dir / f"{prefix}_classification_report.txt").write_text(report_text, encoding="utf-8")

    pd.DataFrame({"y_true": y_true, "y_pred": y_pred}).to_csv(output_dir / f"{prefix}_predictions.csv", index=False)

    if y_proba is not None:
        pd.DataFrame(y_proba).to_csv(output_dir / f"{prefix}_probabilities.csv", index=False)


def log_run_metadata(
    *,
    run_description: str,
    tags: dict[str, Any],
    params: dict[str, Any],
    dataset_df: pd.DataFrame,
    dataset_context: str = "training",
    dataset_source: str | None = None,
    split_column: str = "split_set",
) -> None:
    merged_tags = {
        "project": "nostressia",
        "task": "current-stress",
        "dataset_name": DATASET_NAME,
        "dataset_version": DATASET_VERSION,
        "split": "80/20",
        "random_state": str(RANDOM_STATE),
    }
    merged_tags.update({k: str(v) for k, v in tags.items()})
    mlflow.set_tags(merged_tags)
    mlflow.set_tag("mlflow.note.content", run_description)
    mlflow.log_params({k: str(v) for k, v in params.items()})

    if split_column in dataset_df.columns:
        train_df = dataset_df[dataset_df[split_column] == "train"].drop(columns=[split_column], errors="ignore")
        test_df = dataset_df[dataset_df[split_column] == "test"].drop(columns=[split_column], errors="ignore")

        if not train_df.empty:
            train_dataset = from_pandas(train_df, name=f"{DATASET_NAME}_train", source=dataset_source)
            mlflow.log_input(train_dataset, context="training")
        if not test_df.empty:
            test_dataset = from_pandas(test_df, name=f"{DATASET_NAME}_test", source=dataset_source)
            mlflow.log_input(test_dataset, context="testing")
    else:
        dataset = from_pandas(dataset_df, name=DATASET_NAME, source=dataset_source)
        mlflow.log_input(dataset, context=dataset_context)


def get_dataset_path(repo_root: Path) -> Path:
    return repo_root / "nostressia-machine-learning" / "Current-Stress" / "datasets" / "raw" / "student_lifestyle_dataset.csv"


def load_current_stress_dataset(repo_root: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series]:
    dataset_path = get_dataset_path(repo_root)
    df = pd.read_csv(dataset_path)
    mapping = {"Low": 0, "Moderate": 1, "High": 2}

    def _academic_bucket(gpa: float) -> str:
        if gpa >= 3.5:
            return "Excellent"
        if gpa >= 3.0:
            return "Good"
        if gpa >= 2.0:
            return "Fair"
        return "Poor"

    feature_df = df.drop(columns=["Stress_Level"]).copy()
    feature_df["Academic_Performance"] = feature_df["GPA"].apply(_academic_bucket)
    y = df["Stress_Level"].map(mapping)
    return df, feature_df, y


def select_feature_set(feature_df: pd.DataFrame, feature_set: str) -> pd.DataFrame:
    if feature_set == "academic":
        cols = ["Study_Hours_Per_Day", "Extracurricular_Hours_Per_Day", "GPA", "Academic_Performance"]
        return feature_df[cols].copy()
    if feature_set == "lifestyle":
        cols = ["Sleep_Hours_Per_Day", "Social_Hours_Per_Day", "Physical_Activity_Hours_Per_Day"]
        return feature_df[cols].copy()
    drop_cols = ["Student_ID"] if "Student_ID" in feature_df.columns else []
    return feature_df.drop(columns=drop_cols).copy()


def split_data(X: pd.DataFrame, y: pd.Series):
    return train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y)


def train_test_dataset_frame(X_train, X_test, y_train, y_test) -> pd.DataFrame:
    train_df = X_train.copy()
    train_df["target"] = y_train.values
    train_df["split_set"] = "train"
    test_df = X_test.copy()
    test_df["target"] = y_test.values
    test_df["split_set"] = "test"
    return pd.concat([train_df, test_df], ignore_index=True)



def create_local_output_dir(repo_root: Path, notebook_name: str, run_id: str) -> Path:
    safe_name = notebook_name.replace(".ipynb", "")
    out_dir = repo_root / "nostressia-machine-learning" / "Current-Stress" / "notebooks" / "experiments" / "local_outputs" / safe_name / run_id
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir

def temp_artifact_dir():
    return tempfile.TemporaryDirectory()
