import mlflow
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression

# Create dummy data
X = pd.DataFrame(np.random.rand(100, 5), columns=[f'feature_{i}' for i in range(5)])
y = pd.Series(np.random.randint(0, 2, 100), name='target')
df = pd.concat([X, y], axis=1)

# Train simple model
model = LogisticRegression()
model.fit(X, y)

# Start MLflow run
mlflow.set_experiment("Dataset_Column_Test")

with mlflow.start_run() as run:
    # Create and log dataset
    dataset = mlflow.data.from_pandas(df, name="TestDataset", targets="target")
    mlflow.log_input(dataset, context="training")
    
    # Log model with metadata
    mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path="model",
        registered_model_name="TestModel_WithDataset",
        metadata={"dataset_name": "TestDataset", "dataset_digest": dataset.digest}
    )
    
    # Also try evaluate
    eval_dataset = mlflow.data.from_pandas(df.head(20), name="TestDataset_Eval", targets="target")
    mlflow.evaluate(
        model=f"runs:/{run.info.run_id}/model",
        data=eval_dataset,
        model_type="classifier"
    )
    
    print(f"Run ID: {run.info.run_id}")
    print("Check MLflow UI to see if Dataset column is populated in Logged Models table")
