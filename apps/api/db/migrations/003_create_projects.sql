CREATE TABLE IF NOT EXISTS projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  domain        TEXT        NOT NULL DEFAULT 'agentic project starting',
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','active','archived')),
  owner_user_id UUID        NOT NULL REFERENCES users(id),
  metadata_json JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
