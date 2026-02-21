# Global Forecast Experiments

Notebook eksperimen untuk mencoba berbagai pendekatan model global forecast, mengikuti alur utama di `../global_forecast.ipynb`.

## Daftar notebook
- `01_eda_global_forecast.ipynb`: full flow + EDA aktif
- `02_baseline_global_forecast.ipynb`: baseline persistence dan markov saja
- `03_logreg_global_forecast.ipynb`: fokus Logistic Regression
- `04_tree_ensemble_global_forecast.ipynb`: fokus Decision Tree / RandomForest / ExtraTrees
- `05_boosting_svm_global_forecast.ipynb`: fokus boosting & linear SVM terkalibrasi

Semua notebook diset default pakai dataset CSV lokal `../datasets/stress_forecast.csv` agar cocok untuk eksperimen coba-coba.

## Tambahan untuk replay leaderboard global
- `06_full_candidates_replay_global_forecast.ipynb`: replay semua kandidat seperti `global_forecast.ipynb` (termasuk GradBoost, HistGB, AdaBoost, BaggingTree, LinearSVC_Calibrated, dll).
- `07_adaboost_focus_global_forecast.ipynb`: fokus tuning AdaBoost.
- `08_bagging_tree_focus_global_forecast.ipynb`: fokus tuning Bagging + DecisionTree base estimator.
