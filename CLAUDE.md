# Vault — Instructions for Claude Code

See also `AGENTS.md` for the graphify knowledge-graph rules that apply to this repository.

## What is this vault

- Centralized knowledge base for all projects.
- Persistent memory across sessions.

## Project stacks

- **graphify** — Python library + Claude Code skill (NetworkX, tree-sitter). See `ARCHITECTURE.md` and [[architecture/decisions]].

## Zettelkasten rules

### Note creation

- Use wikilinks: `[[note-name]]` (not markdown links)
- Mandatory YAML frontmatter on every note
- Filenames in kebab-case: `auth-flow.md`, not `Auth Flow.md`
- 1 concept per permanent note (atomicity)
- Minimum 2 wikilinks per note (dense linking)

### Standard frontmatter

```yaml
---
title: Note Name
tags: [project, topic]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
type: permanent
---
```

### Never do

- Don't delete notes without asking
- Don't use markdown links for internal notes (use wikilinks)
- Don't create notes without frontmatter
- Don't change folder structure without documenting it (here, in "Folder structure")

## Folder structure

- `logs/` — session logs, one per session: `YYYY-MM-DD-description.md`
- `architecture/` — decisions per project; start at [[architecture/decisions]]

These vault folders sit alongside the existing repository layout (`graphify/`, `tests/`, `docs/`, …), which is unchanged.

## Session commands

### /resume

When you receive this command:

1. Read the 3 most recent session logs in `logs/`
2. Read `architecture/decisions.md` for the current project
3. Summarize current state and what's left to do

### /save

When you receive this command:

1. Create a session log in `logs/YYYY-MM-DD-description.md`
2. Record: what was done, decisions made, pending items
3. Add wikilinks to created/modified notes
4. Run `git commit` + `git push` if in a repository
