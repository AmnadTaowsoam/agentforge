# AgentForge Delivery Checklist

## Product readiness

- [ ] Primary workflow can be completed end to end.
- [ ] Empty, loading, error, and success states are implemented.
- [ ] Review and approval states are clear.
- [ ] Exports include metadata and source references.

## Engineering readiness

- [ ] Database migrations are repeatable.
- [ ] Tests cover core workflow and failure paths.
- [ ] Logs include request IDs and workflow IDs.
- [ ] Background jobs can retry or fail safely.
- [ ] Rollback procedure is documented.

## Security readiness

- [ ] Workspace authorization is tested.
- [ ] Secrets are encrypted or stored in a managed secret store.
- [ ] Audit logs are immutable enough for operational review.
- [ ] External actions require approval where needed.
- [ ] Sensitive data is redacted from logs.

## Launch readiness

- [ ] README explains the product clearly.
- [ ] Requirements are current.
- [ ] Demo data is safe to share.
- [ ] Known limitations are documented.
- [ ] First user onboarding path is tested.
