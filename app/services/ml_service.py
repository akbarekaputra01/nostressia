import joblib
import pandas as pd
import os
import sys

# Tentukan path absolut biar tidak bingung
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models_ml", "current_stress_model.joblib")

class StressModelService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.load_model()

    def load_model(self):
        print(f"🔍 Mencari model di: {MODEL_PATH}") # DEBUG PRINT
        
        if not os.path.exists(MODEL_PATH):
            print(f"⚠️  FILE TIDAK DITEMUKAN! Pastikan file ada di folder tersebut.")
            return

        try:
            data = joblib.load(MODEL_PATH)
            
            # Unpack dictionary artifacts
            if isinstance(data, dict):
                self.model = data.get('model')
                self.scaler = data.get('scaler')
            else:
                self.model = data
            
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
        if not self.model:
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

            # Scaling
            if self.scaler:
                final_input = self.scaler.transform(df)
            else:
                final_input = df

            # Predict
            prediction_idx = self.model.predict(final_input)[0]
            label_map = {0: "Low", 1: "Moderate", 2: "High"}
            
            return label_map.get(prediction_idx, "Unknown")

        except Exception as e:
            print(f"❌ Prediction Error: {e}")
            return f"Error: {str(e)}"

ml_service = StressModelService()