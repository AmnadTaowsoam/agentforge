CREATE TABLE IF NOT EXISTS review_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID        NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  reviewer_user_id  UUID        NOT NULL REFERENCES users(id),
  decision          TEXT        NOT NULL
                                CHECK (decision IN ('approved','rejected','waived','needs_revision')),
  checklist_version TEXT        NOT NULL DEFAULT '1.0',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_events_run ON review_events(run_id);
