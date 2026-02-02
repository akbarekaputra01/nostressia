# ML Training Audit & Flow

## Audit of the Previous Flow (before this change)
- **Dataset source:** the forecast notebooks loaded data from DB/API (`data_source=db|api`) and did not read the CSV directly, while the CSV existed as a static artifact in the repo. This meant CI relied on runtime DB/API access rather than the tracked dataset file. 
- **Training execution:** GitHub Actions invoked a training worker that pulled from a DB queue (`training_jobs`) and persisted active artifacts in a `model_registry` table, then uploaded artifacts to Azure Blob Storage. The workflow itself did not commit artifacts back to the repo. 
- **Notebook behavior:** both forecast notebooks perform full training runs and `joblib.dump(...)` the resulting artifacts (they do not simply load a prebuilt model). 
- **Personalized failure mode:** the personalized worker marked the Action as “success” even when no jobs were queued; if no eligible user hit the milestone logic in the DB queue, the worker would exit without training or artifacts. This explains “success” runs without Azure artifacts or DB records. 

## New Flow (current)
1. Refresh dataset from the realtime DB into `Stress-Forecast/datasets/stress_forecast.csv`.
2. Execute forecast notebooks headlessly for training.
3. Overwrite model artifacts directly inside `nostressia-backend/app/models_ml/` and generate `.meta.json` sidecars.
4. Commit the updated dataset, models, and `.ml_state.json` gate state back to the repo.

The 60-day global gate and personalized milestone gates are implemented in scripts and tracked in `.ml_state.json`.
For manual tests, the personalized workflow accepts `force_user_id`/`force_window_size` to bypass the 60x gate.
