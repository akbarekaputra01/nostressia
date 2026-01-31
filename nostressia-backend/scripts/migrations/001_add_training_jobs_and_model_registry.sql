ALTER TABLE users
    ADD COLUMN lastPersonalizedTrainedMilestone INT NOT NULL DEFAULT 0,
    ADD COLUMN lastPersonalizedTrainingAt TIMESTAMP NULL;

CREATE TABLE training_jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    job_type ENUM('global', 'personalized') NOT NULL,
    user_id INT NULL,
    milestone INT NULL,
    status ENUM('queued', 'running', 'success', 'failed') NOT NULL DEFAULT 'queued',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    error_message TEXT NULL,
    CONSTRAINT fk_training_jobs_user_id FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX ix_training_jobs_status_created_at ON training_jobs (status, created_at);
CREATE INDEX ix_training_jobs_job_type_status ON training_jobs (job_type, status);
CREATE INDEX ix_training_jobs_user_id_milestone ON training_jobs (user_id, milestone);

CREATE TABLE model_registry (
    model_id INT AUTO_INCREMENT PRIMARY KEY,
    model_type ENUM('global', 'personalized') NOT NULL,
    user_id INT NULL,
    milestone INT NULL,
    artifact_url TEXT NOT NULL,
    trained_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_model_registry_user_id FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX ix_model_registry_type_active ON model_registry (model_type, is_active);
CREATE INDEX ix_model_registry_user_active ON model_registry (user_id, model_type, is_active);
CREATE INDEX ix_model_registry_type_trained_at ON model_registry (model_type, trained_at);
