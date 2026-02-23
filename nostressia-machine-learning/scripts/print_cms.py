import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]

# Function to print CM nicely
def print_cm(title, cm, labels=None):
    print(f"\n=== Confusion Matrix: {title} ===")
    if labels:
        print(f"{'':>12} " + " ".join([f"Pred_{l:<10}" for l in labels]))
        for i, row in enumerate(cm):
            print(f"True_{labels[i]:<7} " + " ".join([f"{val:<15}" for val in row]))
    else:
        print(cm)

# 1. Current Stress
current_df_path = ROOT / "Current-Stress" / "datasets" / "preprocessed" / "student_lifestyle_dataset_preprocessed.csv"
current_model_path = ROOT / "Current-Stress" / "models" / "current_stress.joblib"

if current_df_path.exists() and current_model_path.exists():
    df = pd.read_csv(current_df_path)
    X = df.drop(columns=["Student_ID", "Stress_Level", "Stress_Level_Encoded"], errors="ignore")
    y = df["Stress_Level_Encoded"]
    
    # Notebook uses random_state=26, test_size=0.2
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=26, stratify=y)
    
    b = joblib.load(current_model_path)
    # the dictionary has "pipeline" or direct model
    model = b.get("pipeline", b.get("model", b))
    
    preds = model.predict(X_test)
    cm = confusion_matrix(y_test, preds)
    print_cm("Current Stress (0: Low, 1: Moderate, 2: High)", cm, labels=['Low', 'Moderate', 'High'])
else:
    print("Current Stress data or model not found.")

# 2. Global Forecast
forecast_df_path = ROOT / "Stress-Forecast" / "datasets" / "stress_forecast.csv"
global_model_path = ROOT / "Stress-Forecast" / "models" / "global_forecast.joblib"

if forecast_df_path.exists() and global_model_path.exists():
    df = pd.read_csv(forecast_df_path).sort_values(by=["user_id", "date"])
    b = joblib.load(global_model_path)
    pipe = b.get("pipe")
    meta = b.get("meta", {})
    
    if pipe is not None:
        features = meta.get("feature_cols", [
            "gpa", "extracurricular_hour_per_day", "physical_activity_hour_per_day",
            "sleep_hour_per_day", "study_hour_per_day", "social_hour_per_day", "emoji"
        ])
        features = [c for c in features if c in df.columns]

        y_test_all = []
        preds_all = []
        
        # Test split: last 12 days per user (as defined in WINDOW/TEST_LEN)
        test_len = meta.get("test_len", 12)
        
        for name, group in df.groupby("user_id"):
            test_group = group.iloc[-test_len:]
            
            # Predict only on valid rows (drop NaNs for features)
            valid_test = test_group.dropna(subset=features + ["stress_level"])
            if valid_test.empty: continue
            
            X_test_g = valid_test[features]
            y_test_g = (valid_test["stress_level"] == 2).astype(int)
            
            p = pipe.predict(X_test_g)
            y_test_all.extend(y_test_g.values)
            preds_all.extend(p)
            
        cm = confusion_matrix(y_test_all, preds_all)
        print_cm("Global Forecast (Target: High Stress Tomorrow)", cm, labels=['Not_High', 'High'])
    else:
        print("Global Pipeline not found in joblib.")

# 3. Personalized Forecast (Using User 5 as example since we saw it saved)
pers_model_path = ROOT / "Stress-Forecast" / "models" / "personalized_forecast.joblib"
if forecast_df_path.exists() and pers_model_path.exists():
    df = pd.read_csv(forecast_df_path).sort_values(by=["user_id", "date"])
    b = joblib.load(pers_model_path)
    
    artifact = b.get("artifact", {})
    meta = b.get("meta", {})
    probs_by_user = artifact.get("probs_by_user", {})
    
    if 5 in probs_by_user or '5' in probs_by_user:
        # User 5 markov probs were saved for evaluation!
        probs = probs_by_user.get(5) or probs_by_user.get('5')
        
        # We need the true targets for user 5's test set
        group = df[df["user_id"] == 5].sort_values("date")
        test_len = meta.get("test_len", 12)
        test_group = group.iloc[-test_len:]
        
        # Binary target
        y_test_5 = (test_group["stress_level"] == 2).astype(int)
        
        # the probs array for markov: shape (num_windows, test_len, classes)
        # we will just take the first window for simplicity
        if len(probs.shape) == 3:
            p = probs[0]
        else:
            p = probs
            
        # extract class index 1 (High stress probability) and threshold > 0.5 (or custom threshold)
        thr = artifact.get("thr", 0.5)
        preds_5 = (p[:, 1] >= thr).astype(int) if p.shape[1] > 1 else (p[:, 0] >= thr).astype(int)
        
        # Make sure sizes match
        min_len = min(len(y_test_5), len(preds_5))
        
        cm = confusion_matrix(y_test_5.values[:min_len], preds_5[:min_len])
        print_cm("Personalized Forecast [User 5 Markov] (Target: High Stress Tomorrow)", cm, labels=['Not_High', 'High'])
    else:
        # Try sklearn approach if present
        models_by_user = artifact.get("models_by_user", {})
        if models_by_user:
            print("Sklearn personalized models found, but not implemented in script.")
        else:
            print("Neither markov probs nor sklearn models found for personalized.")
