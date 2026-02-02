-- Drop ML registry/queue tables and columns that are no longer used.

DROP TABLE IF EXISTS model_registry;
DROP TABLE IF EXISTS training_jobs;

-- Drop user personalization tracking columns safely.
SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lastPersonalizedTrainedMilestone'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lastPersonalizedTrainedMilestone',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lastPersonalizedTrainingAt'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lastPersonalizedTrainingAt',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lastPersonalizedTrainingStatus'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lastPersonalizedTrainingStatus',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lastPersonalizedModelDataStart'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lastPersonalizedModelDataStart',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lastPersonalizedModelDataEnd'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lastPersonalizedModelDataEnd',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lastPersonalizedMetrics'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lastPersonalizedMetrics',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'lifetimeValidCount'
);
SET @stmt := IF(
    @col_exists > 0,
    'ALTER TABLE users DROP COLUMN lifetimeValidCount',
    'SELECT 1'
);
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;
