# AGENTS.md

## Repository Rules for Code Agents

### Development Environment

- All development and execution must be done using Docker.
- Do NOT run services directly on the host machine.
- The repository must remain runnable via docker-compose (or the standard Makefile commands).

### Directory Conventions

- The active backend API must live under `backend/`.
- Legacy or archived backends may live under directories such as `backend-archive/`.
- Do NOT remove archived code unless explicitly instructed.

### Scope of Changes

- The frontend directory (`frontend/`) must NOT be modified unless explicitly instructed.
- Avoid unnecessary changes outside the assigned task.
- Prefer minimal, reversible changes.

### Database Rules

- Do NOT modify the database schema unless explicitly instructed.
- No destructive or speculative migrations are allowed.

### API Compatibility

- When replacing or migrating APIs, compatibility takes priority over framework conventions.
- Match existing behavior exactly when required:
  - URL structure
  - HTTP status codes
  - JSON response shape
  - Error formats

### Coding Principles

- Prefer clarity over abstraction.
- Avoid premature refactoring.
- Keep responsibilities clearly separated.

### Commits

- Use commit messages with prefix: `API: ...`
- One logical change per commit.
- Do not commit broken or non-runnable states.
