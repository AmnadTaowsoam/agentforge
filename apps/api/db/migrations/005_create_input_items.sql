CREATE TABLE IF NOT EXISTS input_items (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID        NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  input_type        TEXT        NOT NULL,
  label             TEXT        NOT NULL,
  content_ref       TEXT        NOT NULL DEFAULT '',
  validation_status TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (validation_status IN ('pending','valid','invalid','warning')),
  warnings_json     JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_input_items_run ON input_items(run_id);
