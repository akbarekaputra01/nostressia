import joblib
import pandas as pd
import os
import sys
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Tentukan path absolut biar tidak bingung
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models_ml", "current_stress_pipeline.joblib")

class StressModelService:
    def __init__(self):
        self.pipeline = None
        self.feature_names = None
        self.load_model()

    def _coerce_logistic_regression(self, estimator) -> None:
        if estimator is None:
            return

        if isinstance(estimator, LogisticRegression):
            if not hasattr(estimator, "multi_class"):
                estimator.multi_class = "auto"
            return

        if isinstance(estimator, Pipeline):
            for _, step in estimator.steps:
                self._coerce_logistic_regression(step)
            return

        if hasattr(estimator, "transformers"):
            for _, transformer, _ in estimator.transformers:
                if transformer in {"drop", "passthrough"}:
                    continue
                self._coerce_logistic_regression(transformer)

        if hasattr(estimator, "estimator"):
            self._coerce_logistic_regression(estimator.estimator)

        if hasattr(estimator, "estimator_"):
            self._coerce_logistic_regression(estimator.estimator_)

        if hasattr(estimator, "base_estimator"):
            self._coerce_logistic_regression(estimator.base_estimator)

    def load_model(self):
        print(f"🔍 Mencari model di: {MODEL_PATH}") # DEBUG PRINT
        
        if not os.path.exists(MODEL_PATH):
            print(f"⚠️  FILE TIDAK DITEMUKAN! Pastikan file ada di folder tersebut.")
            return

        try:
            data = joblib.load(MODEL_PATH)
            
            # Unpack dictionary artifacts
            if isinstance(data, dict):
                self.pipeline = data.get('pipeline')
                self.feature_names = data.get('feature_names')
            else:
                self.pipeline = data

            self._coerce_logistic_regression(self.pipeline)
            
            print("✅ ML Model Berhasil Dimuat!")
        except Exception as e:
            print(f"❌ Error saat load joblib: {e}")

    # Logic ini disamakan PERSIS dengan predict.ipynb kamu
    def _calculate_academic_performance_encoded(self, gpa):
        # 1. Tentukan Kategori (Sesuai fungsi categorize_academic_performance di notebook)
        if gpa >= 3.5:
            category = 'Excellent'
        elif 3.0 <= gpa < 3.5:
            category = 'Good'
        elif 2.0 <= gpa < 3.0:
            category = 'Fair'
        else:
            category = 'Poor'
        
        # 2. Mapping ke Angka (Sesuai mapping_performance di notebook)
        mapping = {'Poor': 0, 'Fair': 1, 'Good': 2, 'Excellent': 3}
        return mapping.get(category, 0)

    def predict_stress(self, input_data: dict) -> str:
        if not self.pipeline:
            print("❌ Model belum siap saat predict dipanggil.")
            return "Error: Model not ready"

        try:
            # Feature Engineering
            gpa = input_data['gpa']
            # Pakai fungsi baru yang logic-nya sama dengan Notebook
            academic_encoded = self._calculate_academic_performance_encoded(gpa)

            # Buat DataFrame
            df = pd.DataFrame([{
                'Study_Hours_Per_Day': input_data['study_hours'],
                'Extracurricular_Hours_Per_Day': input_data['extracurricular_hours'],
                'Sleep_Hours_Per_Day': input_data['sleep_hours'],
                'Social_Hours_Per_Day': input_data['social_hours'],
                'Physical_Activity_Hours_Per_Day': input_data['physical_hours'],
                'GPA': gpa,
                'Academic_Performance_Encoded': academic_encoded
            }])

            if self.feature_names:
                df = df[self.feature_names]

            # Predict
            prediction_idx = self.pipeline.predict(df)[0]
            label_map = {0: "Low", 1: "Moderate", 2: "High"}
            
            return label_map.get(prediction_idx, "Unknown")

        except Exception as e:
            print(f"❌ Prediction Error: {e}")
            return f"Error: {str(e)}"

ml_service = StressModelService()
