---
title: Architecture Decisions
tags: [graphify, architecture, decisions]
created: 2026-10-13
updated: 2026-10-13
status: active
type: permanent
---

# Architecture Decisions

Entry point for architecture decisions per project. Session history lives in [[logs/2026-10-13-vault-setup]].

## graphify

Canonical reference: `ARCHITECTURE.md` (pipeline `detect → extract → build → cluster → analyze → report → export`).

| Date | Decision | Context |
|------|----------|---------|
| 2026-10-13 | Adopt a Zettelkasten vault (`logs/`, `architecture/`) inside the repo for cross-session memory | Rules in `CLAUDE.md`; complements the graph in `graphify-out/` described in `AGENTS.md` |

## Related

- [[logs/2026-10-13-vault-setup]]
- [[CLAUDE]]
