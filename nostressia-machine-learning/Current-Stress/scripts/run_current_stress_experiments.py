from __future__ import annotations

import json
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
try:
    from imblearn.over_sampling import SMOTE
    from imblearn.pipeline import Pipeline as ImbPipeline
    IMBLEARN_AVAILABLE = True
except ModuleNotFoundError:
    SMOTE = None
    ImbPipeline = None
    IMBLEARN_AVAILABLE = False
from mlflow.models import infer_signature
from scipy.stats import randint
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    precision_recall_fscore_support,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler
from sklearn.tree import DecisionTreeClassifier
import matplotlib.pyplot as plt

RANDOM_STATE = 26
TEST_SIZE = 0.2
EXPERIMENT_NAME = "Current Stress - Experiments"


@dataclass(frozen=True)
class ExperimentConfig:
    run_name: str
    model_family: str
    registered_model_name: str
    description: str
    feature_group: str


def resolve_repo_root() -> Path:
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        if (parent / "nostressia-machine-learning").exists() and (parent / "nostressia-backend").exists():
            return parent
    return cwd


def categorize_academic_performance(gpa: float) -> str:
    if gpa >= 3.5:
        return "Excellent"
    if gpa >= 3.0:
        return "Good"
    if gpa >= 2.0:
        return "Fair"
    return "Poor"


def load_dataset(dataset_path: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    raw = pd.read_csv(dataset_path)
    processed = raw.copy()
    processed["Academic_Performance"] = processed["GPA"].apply(categorize_academic_performance)
    processed["Stress_Level_Encoded"] = processed["Stress_Level"].map({"Low": 0, "Moderate": 1, "High": 2})
    processed["Academic_Performance_Encoded"] = processed["Academic_Performance"].map(
        {"Poor": 0, "Fair": 1, "Good": 2, "Excellent": 3}
    )
    processed = processed.drop(columns=["Stress_Level", "Academic_Performance"])
    return raw, processed


def split_data(df: pd.DataFrame, features: list[str]) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    x = df[features].copy()
    y = df["Stress_Level_Encoded"].copy()
    return train_test_split(x, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y)


def build_pipeline(estimator: Any, *, use_scaler: bool = False, use_smote: bool = False) -> Any:
    steps: list[tuple[str, Any]] = []
    if use_scaler:
        steps.append(("scaler", RobustScaler()))
    if use_smote:
        if not IMBLEARN_AVAILABLE:
            raise RuntimeError("SMOTE experiment requested but imblearn is not installed.")
        steps.append(("smote", SMOTE(random_state=RANDOM_STATE)))
    steps.append(("model", estimator))
    if use_smote and ImbPipeline is not None:
        return ImbPipeline(steps)
    return Pipeline(steps)


def metric_payload(y_true: pd.Series, y_pred: np.ndarray, y_proba: np.ndarray | None) -> dict[str, float]:
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "precision_weighted": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "precision_micro": float(precision_score(y_true, y_pred, average="micro", zero_division=0)),
        "recall_weighted": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall_micro": float(recall_score(y_true, y_pred, average="micro", zero_division=0)),
        "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_micro": float(f1_score(y_true, y_pred, average="micro", zero_division=0)),
        "matthews_corrcoef": float(matthews_corrcoef(y_true, y_pred)),
        "cohen_kappa": float(cohen_kappa_score(y_true, y_pred)),
    }
    if y_proba is not None:
        metrics["roc_auc_ovr_weighted"] = float(roc_auc_score(y_true, y_proba, multi_class="ovr", average="weighted"))
        metrics["roc_auc_ovr_macro"] = float(roc_auc_score(y_true, y_proba, multi_class="ovr", average="macro"))
        metrics["log_loss"] = float(log_loss(y_true, y_proba))

    class_precision, class_recall, class_f1, class_support = precision_recall_fscore_support(
        y_true, y_pred, labels=[0, 1, 2], zero_division=0
    )
    for idx, label in enumerate(["low", "moderate", "high"]):
        metrics[f"precision_{label}"] = float(class_precision[idx])
        metrics[f"recall_{label}"] = float(class_recall[idx])
        metrics[f"f1_{label}"] = float(class_f1[idx])
        metrics[f"support_{label}"] = float(class_support[idx])
    return metrics


def log_dataset(dataset_df: pd.DataFrame, dataset_path: Path, context: str) -> None:
    dataset = mlflow.data.from_pandas(
        dataset_df,
        source=str(dataset_path),
        name="student_lifestyle_dataset",
        targets="Stress_Level_Encoded",
    )
    mlflow.log_input(dataset, context=context)


def write_eval_artifacts(y_true: pd.Series, y_pred: np.ndarray, out_dir: Path) -> None:
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    ConfusionMatrixDisplay(cm).plot(ax=ax, colorbar=False)
    fig.tight_layout()
    fig.savefig(out_dir / "confusion_matrix.png", dpi=150)
    plt.close(fig)

    report = classification_report(y_true, y_pred, digits=4, output_dict=True)
    (out_dir / "classification_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


def run_single_experiment(
    config: ExperimentConfig,
    pipeline_model: Any,
    x_train: pd.DataFrame,
    x_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    dataset_df: pd.DataFrame,
    dataset_path: Path,
) -> None:
    with mlflow.start_run(run_name=config.run_name):
        mlflow.set_tags(
            {
                "module": "current-stress",
                "feature_group": config.feature_group,
                "model_family": config.model_family,
                "mlflow.note.content": config.description,
                "run_description": config.description,
            }
        )
        mlflow.log_params(
            {
                "dataset_path": str(dataset_path),
                "test_size": TEST_SIZE,
                "random_state": RANDOM_STATE,
                "pipeline_type": type(pipeline_model).__name__,
                "model_family": config.model_family,
            }
        )
        log_dataset(dataset_df, dataset_path, context="training")

        pipeline_model.fit(x_train, y_train)
        y_pred = pipeline_model.predict(x_test)
        y_proba = pipeline_model.predict_proba(x_test) if hasattr(pipeline_model, "predict_proba") else None

        metrics = metric_payload(y_test, y_pred, y_proba)
        mlflow.log_metrics(metrics)
        mlflow.log_text(
            "Comprehensive classifier metrics: accuracy, f1, precision, recall (micro/macro/weighted), "
            "class-level metrics, roc_auc, log_loss, mcc, and kappa.",
            artifact_file="metrics/description.txt",
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            write_eval_artifacts(y_test, y_pred, out_dir)
            mlflow.log_artifacts(str(out_dir), artifact_path="evaluation")

        signature = infer_signature(x_train.head(20), pipeline_model.predict(x_train.head(20)))
        mlflow.sklearn.log_model(
            sk_model=pipeline_model,
            artifact_path="model",
            input_example=x_train.head(5),
            signature=signature,
            registered_model_name=config.registered_model_name,
        )


def main() -> None:
    repo_root = resolve_repo_root()
    dataset_path = repo_root / "nostressia-machine-learning" / "Current-Stress" / "datasets" / "raw" / "student_lifestyle_dataset.csv"

    mlflow.set_tracking_uri("file:" + str((repo_root / "mlruns").resolve()).replace("\\", "/"))
    mlflow.set_experiment(EXPERIMENT_NAME)

    raw_df, processed_df = load_dataset(dataset_path)
    all_features = [c for c in processed_df.columns if c not in ["Stress_Level_Encoded", "Student_ID"]]

    x_train, x_test, y_train, y_test = split_data(processed_df, all_features)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    lr_pipeline = build_pipeline(
        LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
        use_scaler=True,
    )
    run_single_experiment(
        ExperimentConfig(
            run_name="LR Baseline - Pipeline",
            model_family="logistic_regression",
            registered_model_name="CurrentStress_LR_Baseline",
            description="Baseline Logistic Regression with RobustScaler pipeline on all current-stress features.",
            feature_group="all",
        ),
        lr_pipeline,
        x_train,
        x_test,
        y_train,
        y_test,
        processed_df,
        dataset_path,
    )

    dt_pipeline = build_pipeline(DecisionTreeClassifier(random_state=RANDOM_STATE))
    run_single_experiment(
        ExperimentConfig(
            run_name="DT Baseline - Pipeline",
            model_family="decision_tree",
            registered_model_name="CurrentStress_DT_Baseline",
            description="Baseline Decision Tree pipeline on all current-stress features.",
            feature_group="all",
        ),
        dt_pipeline,
        x_train,
        x_test,
        y_train,
        y_test,
        processed_df,
        dataset_path,
    )

    rf_default_pipeline = build_pipeline(RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=100, n_jobs=-1))
    run_single_experiment(
        ExperimentConfig(
            run_name="RF Default - Pipeline",
            model_family="random_forest",
            registered_model_name="CurrentStress_RF_Default",
            description="Default Random Forest pipeline with full feature set.",
            feature_group="all",
        ),
        rf_default_pipeline,
        x_train,
        x_test,
        y_train,
        y_test,
        processed_df,
        dataset_path,
    )

    if IMBLEARN_AVAILABLE:
        smote_pipeline = build_pipeline(
            RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=300, class_weight="balanced", n_jobs=-1),
            use_smote=True,
        )
        with mlflow.start_run(run_name="RF + SMOTE - Pipeline"):
            mlflow.set_tags(
                {
                    "module": "current-stress",
                    "feature_group": "all",
                    "model_family": "random_forest_smote",
                    "mlflow.note.content": "Random Forest + SMOTE pipeline for class imbalance handling.",
                }
            )
            cv_scores = cross_val_score(clone(smote_pipeline), x_train, y_train, cv=cv, scoring="f1_weighted", n_jobs=-1)
            mlflow.log_metric("cv_f1_weighted_mean", float(np.mean(cv_scores)))
            mlflow.log_metric("cv_f1_weighted_std", float(np.std(cv_scores)))
        run_single_experiment(
            ExperimentConfig(
                run_name="RF + SMOTE - Final Pipeline",
                model_family="random_forest_smote",
                registered_model_name="CurrentStress_RF_SMOTE",
                description="Random Forest pipeline with SMOTE oversampling for imbalanced labels.",
                feature_group="all",
            ),
            smote_pipeline,
            x_train,
            x_test,
            y_train,
            y_test,
            processed_df,
            dataset_path,
        )
    else:
        print("[WARN] imblearn not installed, skipping RF + SMOTE experiments.")

    rf_tuner = RandomizedSearchCV(
        estimator=RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1),
        param_distributions={
            "n_estimators": randint(120, 500),
            "max_depth": [None, 4, 6, 8, 12],
            "min_samples_split": randint(2, 10),
            "min_samples_leaf": randint(1, 5),
            "max_features": ["sqrt", "log2", None],
            "class_weight": [None, "balanced"],
        },
        n_iter=18,
        scoring="f1_weighted",
        cv=cv,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    rf_tuner.fit(x_train, y_train)
    best_rf = rf_tuner.best_estimator_
    run_single_experiment(
        ExperimentConfig(
            run_name="RF Tuned - Pipeline",
            model_family="random_forest_tuned",
            registered_model_name="CurrentStress_RF_Tuned",
            description="Random Forest tuned via RandomizedSearchCV using weighted F1 objective.",
            feature_group="all",
        ),
        build_pipeline(best_rf),
        x_train,
        x_test,
        y_train,
        y_test,
        processed_df,
        dataset_path,
    )

    academic_features = ["Study_Hours_Per_Day", "Extracurricular_Hours_Per_Day", "GPA", "Academic_Performance_Encoded"]
    xa_train, xa_test, ya_train, ya_test = split_data(processed_df, academic_features)
    run_single_experiment(
        ExperimentConfig(
            run_name="Academic Only - RF Pipeline",
            model_family="random_forest",
            registered_model_name="CurrentStress_Academic_RF",
            description="Academic-feature-only Random Forest pipeline.",
            feature_group="academic",
        ),
        build_pipeline(RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=250, n_jobs=-1)),
        xa_train,
        xa_test,
        ya_train,
        ya_test,
        processed_df[[*academic_features, "Stress_Level_Encoded"]],
        dataset_path,
    )

    lifestyle_features = ["Sleep_Hours_Per_Day", "Social_Hours_Per_Day", "Physical_Activity_Hours_Per_Day"]
    xl_train, xl_test, yl_train, yl_test = split_data(processed_df, lifestyle_features)
    run_single_experiment(
        ExperimentConfig(
            run_name="Lifestyle Only - RF Pipeline",
            model_family="random_forest",
            registered_model_name="CurrentStress_Lifestyle_RF",
            description="Lifestyle-feature-only Random Forest pipeline.",
            feature_group="lifestyle",
        ),
        build_pipeline(RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=250, n_jobs=-1)),
        xl_train,
        xl_test,
        yl_train,
        yl_test,
        processed_df[[*lifestyle_features, "Stress_Level_Encoded"]],
        dataset_path,
    )

    stacking_model = build_pipeline(
        StackingClassifier(
            estimators=[
                ("lr", build_pipeline(LogisticRegression(random_state=RANDOM_STATE, max_iter=1000), use_scaler=True)),
                ("dt", DecisionTreeClassifier(random_state=RANDOM_STATE, max_depth=8, min_samples_split=4)),
                ("rf", RandomForestClassifier(random_state=RANDOM_STATE, n_estimators=350, class_weight="balanced", n_jobs=-1)),
            ],
            final_estimator=LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
            cv=5,
            passthrough=False,
        )
    )
    run_single_experiment(
        ExperimentConfig(
            run_name="Stacking Ensemble Final - Pipeline",
            model_family="stacking_classifier",
            registered_model_name="CurrentStress_Stacking_Final",
            description="Final stacking ensemble pipeline combining LR, DT, and tuned RF learners.",
            feature_group="all",
        ),
        stacking_model,
        x_train,
        x_test,
        y_train,
        y_test,
        processed_df,
        dataset_path,
    )


if __name__ == "__main__":
    main()
