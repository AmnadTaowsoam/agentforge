CREATE TABLE IF NOT EXISTS artifacts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID        NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  artifact_type     TEXT        NOT NULL
                                CHECK (artifact_type IN (
                                  'brief','requirements','architecture',
                                  'api-contract','data-model','tasks',
                                  'test-plan','readme','scaffold'
                                )),
  path              TEXT        NOT NULL,
  content_ref       TEXT        NOT NULL DEFAULT '',
  checksum          TEXT        NOT NULL DEFAULT '',
  validation_status TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (validation_status IN ('pending','valid','invalid','warning')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id, artifact_type)
);

CREATE INDEX IF NOT EXISTS idx_artifacts_run ON artifacts(run_id);
