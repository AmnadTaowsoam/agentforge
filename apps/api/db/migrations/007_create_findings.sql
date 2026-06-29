CREATE TABLE IF NOT EXISTS findings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID        NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  severity      TEXT        NOT NULL
                            CHECK (severity IN ('info','low','medium','high','critical')),
  category      TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL DEFAULT '',
  evidence_ref  TEXT,
  suggested_fix TEXT,
  status        TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','resolved','waived','dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_run      ON findings(run_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
