CREATE TABLE IF NOT EXISTS runs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status         TEXT        NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','ready','running','needs_input','completed','failed','cancelled')),
  trigger_type   TEXT        NOT NULL DEFAULT 'manual'
                             CHECK (trigger_type IN ('manual','scheduled','api')),
  config_json    JSONB       NOT NULL DEFAULT '{}',
  input_hash     TEXT        NOT NULL DEFAULT '',
  started_by     UUID        REFERENCES users(id),
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  failure_code   TEXT,
  failure_message TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_project ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_runs_status  ON runs(status);
