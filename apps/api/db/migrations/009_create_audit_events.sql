CREATE TABLE IF NOT EXISTS audit_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id  UUID        REFERENCES users(id),
  action         TEXT        NOT NULL,
  target_type    TEXT        NOT NULL,
  target_id      TEXT        NOT NULL,
  metadata_json  JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_workspace ON audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created   ON audit_events(created_at DESC);
