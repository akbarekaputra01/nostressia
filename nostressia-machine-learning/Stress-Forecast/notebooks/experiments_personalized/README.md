# Personalized Forecast Experiments (Step-by-Step)

Folder ini khusus eksperimen personalized dan disusun **satu model per notebook** agar progres eksperimen terlihat jelas.

## Urutan eksperimen
1. `01_eda_personalized_forecast.ipynb` (EDA only)
2. `02_baseline_personalized_forecast.ipynb` (Baseline only)
3. `03_logreg_personalized_forecast.ipynb`
4. `04_decision_tree_personalized_forecast.ipynb`
5. `05_tree_personalized_forecast.ipynb` (tree-family focus: DecisionTree/RandomForest/ExtraTrees)
6. `06_boosting_svm_personalized_forecast.ipynb` (boosting + calibrated LinearSVC focus)
7. `07_random_forest_personalized_forecast.ipynb`
8. `08_extra_trees_personalized_forecast.ipynb`
9. `09_gradboost_personalized_forecast.ipynb`
10. `10_histgb_personalized_forecast.ipynb`
11. `11_linearsvc_personalized_forecast.ipynb`
12. `12_adaboost_personalized_forecast.ipynb`
13. `13_bagging_tree_personalized_forecast.ipynb`

Default path:
- dataset: `../../datasets/stress_forecast.csv`
- output model: `../../models/experiments_personalized/...`
