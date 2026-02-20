import json
import random
from pathlib import Path

import mlflow
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from mlflow.data import from_pandas
from mlflow.models import infer_signature
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
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
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

EXPERIMENT_NAME = "Current Stress - Experiments"
DATASET_NAME = "current_stress_v1"
DATASET_VERSION = "v1"
RANDOM_STATE = 42
TEST_SIZE = 0.2


def set_seeds(seed: int = RANDOM_STATE) -> None:
    random.seed(seed)
    np.random.seed(seed)


def resolve_repo_root() -> Path:
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        if (parent / ".git").exists():
            return parent
    return cwd


def load_dataset(dataset_path: Path | None = None) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series]:
    repo_root = resolve_repo_root()
    path = dataset_path or repo_root / "nostressia-machine-learning" / "Current-Stress" / "datasets" / "raw" / "student_lifestyle_dataset.csv"
    df = pd.read_csv(path)
    df["Academic_Performance"] = pd.cut(
        df["GPA"], bins=[-np.inf, 2.0, 3.0, 3.5, np.inf], labels=["Poor", "Fair", "Good", "Excellent"]
    ).astype(str)
    y = df["Stress_Level"].map({"Low": 0, "Moderate": 1, "High": 2}).astype(int)
    drop_cols = ["Stress_Level", "Student_ID"]
    X = df.drop(columns=[c for c in drop_cols if c in df.columns]).copy()
    return df, X, y


def select_features(X: pd.DataFrame, feature_group: str = "all") -> pd.DataFrame:
    if feature_group == "all":
        return X
    academic_keywords = {"study", "gpa", "academic", "performance"}
    lifestyle_keywords = {"sleep", "diet", "physical", "social", "screen", "extracurricular"}

    def match(cols, keys):
        return [c for c in cols if any(k in c.lower() for k in keys)]

    if feature_group == "academic":
        cols = match(X.columns, academic_keywords)
    elif feature_group == "lifestyle":
        cols = match(X.columns, lifestyle_keywords)
    else:
        cols = list(X.columns)
    if not cols:
        cols = list(X.columns)
    return X[cols].copy()


def build_preprocessor(num_cols: list[str], cat_cols: list[str]) -> ColumnTransformer:
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer(
        transformers=[("num", num_pipe, num_cols), ("cat", cat_pipe, cat_cols)],
        remainder="drop",
    )


def evaluate_classification(y_true, y_pred, y_proba=None) -> dict:
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "precision_weighted": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall_weighted": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "mcc": float(matthews_corrcoef(y_true, y_pred)),
    }
    if y_proba is not None:
        metrics["roc_auc_ovr"] = float(roc_auc_score(y_true, y_proba, multi_class="ovr"))
        metrics["log_loss"] = float(log_loss(y_true, y_proba))
    return metrics


def log_classification_artifacts(y_true, y_pred, y_proba, labels, artifact_dir: Path, prefix: str = "test") -> None:
    artifact_dir.mkdir(parents=True, exist_ok=True)
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    fig, ax = plt.subplots(figsize=(6, 5))
    ConfusionMatrixDisplay(cm, display_labels=labels).plot(ax=ax, cmap="Blues", colorbar=False)
    ax.set_title(f"{prefix} confusion matrix")
    fig.tight_layout()
    fig.savefig(artifact_dir / f"{prefix}_confusion_matrix.png", dpi=150)
    plt.close(fig)

    report_json = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)
    report_txt = classification_report(y_true, y_pred, labels=labels, zero_division=0)
    (artifact_dir / f"{prefix}_classification_report.json").write_text(json.dumps(report_json, indent=2), encoding="utf-8")
    (artifact_dir / f"{prefix}_classification_report.txt").write_text(report_txt, encoding="utf-8")

    pred_df = pd.DataFrame({"y_true": y_true, "y_pred": y_pred})
    if y_proba is not None:
        for i in range(y_proba.shape[1]):
            pred_df[f"proba_class_{i}"] = y_proba[:, i]
    pred_df.to_csv(artifact_dir / f"{prefix}_predictions.csv", index=False)


def log_run_metadata(tags: dict, description: str) -> None:
    mlflow.set_tags(tags)
    mlflow.set_tag("mlflow.note.content", description)


def log_dataset_inputs(X_train, y_train, X_test, y_test, context_prefix: str = DATASET_NAME) -> None:
    train_df = X_train.copy()
    train_df["target"] = y_train.values
    test_df = X_test.copy()
    test_df["target"] = y_test.values
    mlflow.log_input(from_pandas(train_df, name=f"{context_prefix}_train"), context="training")
    mlflow.log_input(from_pandas(test_df, name=f"{context_prefix}_test"), context="testing")


def log_and_register_model(model, X_train, model_name: str, artifact_path: str = "model") -> None:
    input_example = X_train.head(5)
    signature = infer_signature(input_example, model.predict(input_example))
    mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path=artifact_path,
        signature=signature,
        input_example=input_example,
        registered_model_name=model_name,
    )


def setup_mlflow() -> None:
    repo_root = resolve_repo_root()
    tracking_dir = repo_root / "nostressia-machine-learning" / "Current-Stress" / "notebooks" / "experiments" / "mlruns"
    tracking_dir.mkdir(parents=True, exist_ok=True)
    mlflow.set_tracking_uri(f"file:{tracking_dir.resolve().as_posix()}")
    mlflow.set_experiment(EXPERIMENT_NAME)
